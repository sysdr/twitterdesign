import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';

export const DIMS = 384;

let _idCounter = 0;
const makeId = t => `${t}:${(++_idCounter).toString(36).padStart(8, '0')}`;

// ─── Hash-based word embedding (InProcess) ────────────────────────────────────
// Maps each word to a 384-dim binary {+1,-1} vector via SHA-256.
// Identical words → identical vectors (deterministic).
// Distinct words → pseudo-orthogonal directions (independent hash outputs).
function wordVec(word, dims) {
  const h = crypto.createHash('sha256').update(word).digest();
  const v = new Float32Array(dims);
  for (let i = 0; i < dims; i++) {
    v[i] = (h[i % 32] >> (i & 7)) & 1 ? 1.0 : -1.0;
  }
  return v;
}

function l2normalize(v) {
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm < 1e-10) return v;          // zero / degenerate vector — return as-is
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

function inProcessEmbed(text, dims) {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
  if (words.length === 0) return new Float32Array(dims);  // zero vector
  const acc = new Float32Array(dims);
  for (const w of words) {
    const wv = wordVec(w, dims);
    for (let i = 0; i < dims; i++) acc[i] += wv[i];
  }
  return l2normalize(acc);
}

// ─── Exported utility ─────────────────────────────────────────────────────────
export function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom < 1e-10 ? 0 : dot / denom;
}

// ─── InProcessEngine ──────────────────────────────────────────────────────────
class InProcessEngine {
  constructor() {
    this.mode        = 'in-process';
    this._dims       = DIMS;
    this._tables     = new Map();   // table → Map<id, record>
    this._edges      = new Map();   // "from->type->to" → edge (dedup by key)
    this._vecs       = new Map();   // id → Float32Array(384)
    this._embedCount = 0;
    this._embedMs    = 0;
  }

  // ── Base store ops ────────────────────────────────────────────────────────
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
    for (const [, store] of this._tables) store.delete(id);
    this._vecs.delete(id);
  }

  relate(fromId, edgeType, toId, fields = {}) {
    const key  = `${fromId}->${edgeType}->${toId}`;
    const edge = { id: makeId(edgeType), from: fromId, to: toId,
                   ...fields, created: new Date().toISOString() };
    this._edges.set(key, edge);      // map key ensures idempotent dedup
    return edge;
  }

  traverse(fromId, edgeType) {
    const out    = [];
    const prefix = `${fromId}->${edgeType}->`;
    for (const [key, edge] of this._edges)
      if (key.startsWith(prefix)) out.push(edge.to);
    return out;
  }

  select(table) {
    return this._tables.has(table)
      ? [...this._tables.get(table).values()]
      : [];
  }

  selectOne(id) {
    for (const [, store] of this._tables) {
      const rec = store.get(id);
      if (rec) return rec;
    }
    return null;
  }

  count(table) {
    return this._tables.has(table) ? this._tables.get(table).size : 0;
  }

  // ── Day 14: Embedding primitives ─────────────────────────────────────────
  embed(text) {
    const t0  = performance.now();
    const vec = inProcessEmbed(text, this._dims);
    this._embedMs += performance.now() - t0;
    this._embedCount++;
    return vec;
  }

  batchEmbed(texts) {
    return texts.map(t => this.embed(t));
  }

  storeEmbedding(id, vec) {
    this._vecs.set(id, vec);
  }

  getEmbedding(id) {
    return this._vecs.get(id) ?? null;
  }

  topK(queryVec, k = 5) {
    const results = [];
    for (const [id, vec] of this._vecs)
      results.push({ id, score: cosineSimilarity(queryVec, vec) });
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  stats() {
    return {
      mode:          this.mode,
      dims:          this._dims,
      embedCount:    this._embedCount,
      avgEmbedMs:    this._embedCount
                     ? +(this._embedMs / this._embedCount).toFixed(4)
                     : 0,
      vectorsStored: this._vecs.size,
    };
  }

  async ping() { return true; }
}

// ─── ExternalEngine (Ollama) ──────────────────────────────────────────────────
class ExternalEngine {
  constructor() {
    this.mode        = 'ollama';
    this._url        = process.env.NEXUS_URL   ?? 'http://localhost:11434';
    this._model      = process.env.NEXUS_MODEL ?? 'nomic-embed-text';
    this._dims       = DIMS;
    this._tables     = new Map();
    this._edges      = new Map();
    this._vecs       = new Map();
    this._embedCount = 0;
    this._embedMs    = 0;
  }

  async ping() {
    const r = await fetch(`${this._url}/api/tags`);
    if (!r.ok) throw new Error(`Ollama unreachable at ${this._url} (${r.status})`);
    return true;
  }

  // ── Base store ops (identical signatures to InProcess) ───────────────────
  insert(table, records) {
    if (!this._tables.has(table)) this._tables.set(table, new Map());
    const store = this._tables.get(table);
    return (Array.isArray(records) ? records : [records]).map(data => {
      const rec = { ...data, id: makeId(table), created: new Date().toISOString() };
      store.set(rec.id, rec);
      return rec;
    });
  }
  create(table, data)                   { return this.insert(table, [data])[0]; }
  delete(id)                            { for (const [,s] of this._tables) s.delete(id); this._vecs.delete(id); }
  relate(fromId, type, toId, fields={}) {
    const key = `${fromId}->${type}->${toId}`;
    const edge = { id: makeId(type), from: fromId, to: toId, ...fields };
    this._edges.set(key, edge);
    return edge;
  }
  traverse(fromId, type) {
    const out = [], prefix = `${fromId}->${type}->`;
    for (const [k, e] of this._edges) if (k.startsWith(prefix)) out.push(e.to);
    return out;
  }
  select(table)  { return this._tables.has(table) ? [...this._tables.get(table).values()] : []; }
  selectOne(id)  { for (const [,s] of this._tables) { const r = s.get(id); if (r) return r; } return null; }
  count(table)   { return this._tables.has(table) ? this._tables.get(table).size : 0; }

  storeEmbedding(id, vec) { this._vecs.set(id, vec); }
  getEmbedding(id)        { return this._vecs.get(id) ?? null; }

  // ── Day 14: Embedding (async — HTTP call to Ollama) ──────────────────────
  async embed(text) {
    const t0 = performance.now();
    const r  = await fetch(`${this._url}/api/embeddings`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ model: this._model, prompt: text }),
    });
    if (!r.ok) throw new Error(`Ollama /api/embeddings failed: ${r.status}`);
    const { embedding } = await r.json();
    this._embedMs += performance.now() - t0;
    this._embedCount++;
    return new Float32Array(embedding);
  }

  async batchEmbed(texts) {
    const vecs = [];
    for (const t of texts) vecs.push(await this.embed(t));
    return vecs;
  }

  topK(queryVec, k = 5) {
    const results = [];
    for (const [id, vec] of this._vecs)
      results.push({ id, score: cosineSimilarity(queryVec, vec) });
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  stats() {
    return {
      mode:          this.mode,
      model:         this._model,
      dims:          this._dims,
      embedCount:    this._embedCount,
      avgEmbedMs:    this._embedCount
                     ? +(this._embedMs / this._embedCount).toFixed(2)
                     : 0,
      vectorsStored: this._vecs.size,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export async function createEngine() {
  if (process.env.NEXUS_MODE) {
    const eng = new ExternalEngine();
    await eng.ping();
    console.log(`[engine] connected to ollama at ${eng._url}  model=${eng._model}`);
    return eng;
  }
  console.log('[engine] in-process (hash-based embeddings, 384-dim)');
  return new InProcessEngine();
}
