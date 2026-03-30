import { performance } from 'node:perf_hooks';

// ── ID generation ─────────────────────────────────────────────────────────
let _idCounter = 0;
const makeId = table =>
  `${table}:${(++_idCounter).toString(36).padStart(8, '0')}`;

// ── Command metadata ──────────────────────────────────────────────────────
const COMMAND_TOPICS = {
  PostTweet:   'tweet.created',
  LikeTweet:   'tweet.liked',
  FollowUser:  'user.followed',
  DeleteTweet: 'tweet.deleted',
};

const SCHEMAS = {
  PostTweet: {
    userId:  { required: true, type: 'string' },
    content: { required: true, type: 'string', minLength: 1, maxLength: 280 },
  },
  LikeTweet: {
    userId:  { required: true, type: 'string' },
    tweetId: { required: true, type: 'string' },
  },
  FollowUser: {
    followerId: { required: true, type: 'string' },
    followeeId: { required: true, type: 'string' },
  },
  DeleteTweet: {
    userId:  { required: true, type: 'string' },
    tweetId: { required: true, type: 'string' },
  },
};

export function validatePayload(commandType, payload) {
  const schema = SCHEMAS[commandType];
  if (!schema) throw new Error(`Unknown command: ${commandType}`);

  for (const [key, rule] of Object.entries(schema)) {
    const val = payload[key];
    if (rule.required && (val === undefined || val === null || val === ''))
      throw Object.assign(new Error(`${key} is required`),
        { code: 'VALIDATION_ERROR', field: key });
    if (rule.type && val !== undefined && typeof val !== rule.type)
      throw Object.assign(new Error(`${key} must be a ${rule.type}`),
        { code: 'VALIDATION_ERROR', field: key });
    if (rule.maxLength && typeof val === 'string' && val.length > rule.maxLength)
      throw Object.assign(new Error(`${key} exceeds ${rule.maxLength} characters`),
        { code: 'VALIDATION_ERROR', field: key });
    if (rule.minLength && typeof val === 'string' && val.length < rule.minLength)
      throw Object.assign(new Error(`${key} requires at least ${rule.minLength} character`),
        { code: 'VALIDATION_ERROR', field: key });
  }

  if (commandType === 'FollowUser' && payload.followerId === payload.followeeId)
    throw Object.assign(new Error('followerId and followeeId must differ'),
      { code: 'SEMANTIC_ERROR' });
}

// ── InProcessEngine ───────────────────────────────────────────────────────
export class InProcessEngine {
  constructor() {
    this._tables = new Map();
    this._edges  = new Map(); // "fromId->type->toId" → edge record
    this._events = new Map(
      Object.values(COMMAND_TOPICS).map(t => [t, []])
    );
    this._dedup  = new Map(); // idempotencyKey → { event, expires }
    this._commandCount = 0;
    this._errorCount   = 0;
    this.mode = 'in-process';
  }

  // ── Base data primitives ─────────────────────────────────────────────
  insert(table, records) {
    if (!this._tables.has(table)) this._tables.set(table, new Map());
    const store = this._tables.get(table);
    return (Array.isArray(records) ? records : [records]).map(data => {
      const rec = { ...data, id: makeId(table), created: new Date().toISOString() };
      store.set(rec.id, rec);
      return rec;
    });
  }

  create(table, data) {
    return this.insert(table, [data])[0];
  }

  delete(id) {
    const [table] = id.split(':');
    this._tables.get(table)?.delete(id);
  }

  relate(fromId, edgeType, toId, fields = {}) {
    const key  = `${fromId}->${edgeType}->${toId}`;
    const edge = { id: makeId(edgeType), from: fromId, type: edgeType, to: toId, ...fields };
    this._edges.set(key, edge);
    return edge;
  }

  traverse(fromId, edgeType) {
    const targets = [];
    for (const [key, edge] of this._edges)
      if (key.startsWith(`${fromId}->${edgeType}->`) && edge.from === fromId)
        targets.push(edge.to);
    return targets;
  }

  select(table)   { return [...(this._tables.get(table)?.values() ?? [])]; }
  selectOne(id)   { const [t] = id.split(':'); return this._tables.get(t)?.get(id) ?? null; }
  count(table)    { return this._tables.get(table)?.size ?? 0; }

  // ── Day 09: Command / Event primitives ──────────────────────────────
  executeCommand(commandType, payload, idempotencyKey = null) {
    const start = performance.now();

    // Idempotency: evict expired entries, return existing if key matches
    if (idempotencyKey) {
      const now = Date.now();
      // Evict stale entries (24h TTL)
      for (const [k, v] of this._dedup)
        if (v.expires < now) this._dedup.delete(k);

      if (this._dedup.has(idempotencyKey)) {
        const existing = this._dedup.get(idempotencyKey).event;
        return { ...existing, latencyMs: performance.now() - start, deduplicated: true };
      }
    }

    try {
      validatePayload(commandType, payload);
    } catch (err) {
      this._errorCount++;
      throw err;
    }

    const topic = COMMAND_TOPICS[commandType];
    const event = {
      eventId:     makeId('event'),
      topic,
      commandType,
      payload:     { ...payload },
      timestamp:   new Date().toISOString(),
    };

    this._events.get(topic).push(event);

    if (idempotencyKey)
      this._dedup.set(idempotencyKey, { event, expires: Date.now() + 86_400_000 });

    this._commandCount++;
    return { ...event, latencyMs: performance.now() - start };
  }

  getEvents(topic)      { return this._events.get(topic) ?? []; }
  getEventCount(topic)  { return (this._events.get(topic) ?? []).length; }

  stats() {
    const eventCounts = {};
    for (const [topic, evts] of this._events) eventCounts[topic] = evts.length;
    return {
      mode: this.mode,
      commands:    this._commandCount,
      errors:      this._errorCount,
      totalEvents: Object.values(eventCounts).reduce((s, n) => s + n, 0),
      eventCounts,
    };
  }
}

// ── ExternalEngine (Redpanda REST proxy) ─────────────────────────────────
export class ExternalEngine {
  constructor({ url, adminUrl }) {
    this.url       = url;        // http://localhost:8082
    this.adminUrl  = adminUrl;   // http://localhost:9644
    this.mode      = 'redpanda';
    this._commandCount = 0;
    this._errorCount   = 0;
  }

  async ping() {
    let res;
    try {
      res = await fetch(`${this.adminUrl}/v1/status/ready`);
    } catch (err) {
      throw new Error(`Redpanda unreachable at ${this.adminUrl}: ${err.message}`);
    }
    if (!res.ok) throw new Error(`Redpanda not ready: HTTP ${res.status}`);
  }

  async executeCommand(commandType, payload, idempotencyKey = null) {
    const start = performance.now();
    try {
      validatePayload(commandType, payload);
    } catch (err) {
      this._errorCount++;
      throw err;
    }

    const topic = COMMAND_TOPICS[commandType];
    const event = {
      eventId:     makeId('event'),
      topic,
      commandType,
      payload:     { ...payload },
      timestamp:   new Date().toISOString(),
    };

    const headers = {
      'Content-Type': 'application/vnd.kafka.json.v2+json',
      'Accept':        'application/vnd.kafka.v2+json',
    };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    let res;
    try {
      res = await fetch(`${this.url}/topics/${topic}`, {
        method:  'POST',
        headers,
        body:    JSON.stringify({ records: [{ value: event }] }),
      });
    } catch (err) {
      this._errorCount++;
      throw new Error(`Redpanda publish failed: ${err.message}`);
    }

    if (!res.ok) {
      this._errorCount++;
      const body = await res.text().catch(() => '');
      throw new Error(`Redpanda HTTP ${res.status}: ${body}`);
    }

    const result = await res.json();
    this._commandCount++;
    return {
      ...event,
      offset:    result.offsets?.[0]?.offset ?? null,
      latencyMs: performance.now() - start,
    };
  }

  async getEventCount(topic) {
    try {
      const res = await fetch(`${this.adminUrl}/v1/topics/${topic}/partitions`);
      if (!res.ok) return 0;
      const data = await res.json();
      return data.reduce((sum, p) => sum + (p.committed_offset ?? 0), 0);
    } catch { return 0; }
  }

  getEvents() { return []; }

  stats() {
    return { mode: this.mode, commands: this._commandCount, errors: this._errorCount };
  }
}

// ── Factory ───────────────────────────────────────────────────────────────
export async function createEngine() {
  if (process.env.NEXUS_MODE === 'redpanda') {
    const url      = process.env.NEXUS_URL       ?? 'http://localhost:8082';
    const adminUrl = process.env.NEXUS_ADMIN_URL ?? 'http://localhost:9644';
    const engine   = new ExternalEngine({ url, adminUrl });
    await engine.ping();
    console.log(`[engine] connected to Redpanda at ${url}`);
    return engine;
  }
  console.log('[engine] in-process');
  return new InProcessEngine();
}

export { COMMAND_TOPICS };
