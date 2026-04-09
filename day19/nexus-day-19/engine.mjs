import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';

export const DIMS = 384;

/** Populated by runQuantBenchmark / rebuildQuantIndex — read by server.mjs */
export const dashboardMetrics = {
  vectorsIndexed: 0,
  floatBytes: 0,
  sqBytes: 0,
  pqBytes: 0,
  codebookBytes: 0,
  compressionRatioSQ: 0,
  compressionRatioPQ: 0,
  recallSQat10: 0,
  recallPQat10: 0,
  floatSearchMs: 0,
  sqSearchMs: 0,
  pqSearchMs: 0,
  lastBenchAt: null,
};

export function resetDashboardMetrics() {
  Object.assign(dashboardMetrics, {
    vectorsIndexed: 0,
    floatBytes: 0,
    sqBytes: 0,
    pqBytes: 0,
    codebookBytes: 0,
    compressionRatioSQ: 0,
    compressionRatioPQ: 0,
    recallSQat10: 0,
    recallPQat10: 0,
    floatSearchMs: 0,
    sqSearchMs: 0,
    pqSearchMs: 0,
    lastBenchAt: null,
  });
}

let _idCounter = 0;
const makeId = t => `${t}:${(++_idCounter).toString(36).padStart(8, '0')}`;

function wordVec(word, dims) {
  const h = crypto.createHash('sha256').update(word).digest();
  const v = new Float32Array(dims);
  for (let i = 0; i < dims; i++) {
    v[i] = (h[i % 32] >> (i & 7)) & 1 ? 1.0 : -1.0;
  }
  return v;
}

export function l2normalize(v) {
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm < 1e-10) return v;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

function inProcessEmbed(text, dims) {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
  if (words.length === 0) return new Float32Array(dims);
  const acc = new Float32Array(dims);
  for (const w of words) {
    const wv = wordVec(w, dims);
    for (let i = 0; i < dims; i++) acc[i] += wv[i];
  }
  return l2normalize(acc);
}

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

// ─── Scalar quantization (8-bit per dim, symmetric [-1,1]) ────────────────────
export function encodeSQ(vec) {
  const u = new Uint8Array(vec.length);
  for (let i = 0; i < vec.length; i++) {
    const x = Math.max(-1, Math.min(1, vec[i]));
    u[i] = Math.round((x + 1) * 127.5);
  }
  return u;
}

export function decodeSQ(u) {
  const v = new Float32Array(u.length);
  for (let i = 0; i < u.length; i++) v[i] = u[i] / 127.5 - 1;
  return l2normalize(v);
}

// ─── Product quantization (M subspaces, K centroids each) ─────────────────────
const PQ_M = 8;
const PQ_SUB = DIMS / PQ_M; // 48
const PQ_K = 32;

function subvector(vec, m) {
  const off = m * PQ_SUB;
  return vec.subarray(off, off + PQ_SUB);
}

function kmeans1dRows(rows, k, iters) {
  const n = rows.length;
  const d = rows[0].length;
  const kUse = Math.min(k, n);
  const centroids = [];
  for (let j = 0; j < kUse; j++) centroids.push(Float32Array.from(rows[j]));

  const assign = new Int32Array(n);

  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < kUse; c++) {
        let dist = 0;
        for (let t = 0; t < d; t++) {
          const dx = rows[i][t] - centroids[c][t];
          dist += dx * dx;
        }
        if (dist < bestD) {
          bestD = dist;
          best = c;
        }
      }
      assign[i] = best;
    }
    const counts = new Uint32Array(kUse);
    const sums = Array.from({ length: kUse }, () => new Float32Array(d));
    for (let i = 0; i < n; i++) {
      const c = assign[i];
      counts[c]++;
      for (let t = 0; t < d; t++) sums[c][t] += rows[i][t];
    }
    for (let c = 0; c < kUse; c++) {
      if (counts[c] === 0) continue;
      for (let t = 0; t < d; t++) centroids[c][t] = sums[c][t] / counts[c];
    }
  }
  return { centroids, assign };
}

function trainPQCentroids(vectors) {
  const ids = [...vectors.keys()];
  const n = ids.length;
  const centroidsPerM = [];
  const codes = new Map();

  for (let i = 0; i < n; i++) {
    const id = ids[i];
    codes.set(id, new Uint8Array(PQ_M));
  }

  for (let m = 0; m < PQ_M; m++) {
    const rows = [];
    for (const id of ids) rows.push(subvector(vectors.get(id), m));

    const { centroids, assign } = kmeans1dRows(rows, PQ_K, 6);
    centroidsPerM.push(centroids);

    for (let i = 0; i < n; i++) {
      const id = ids[i];
      codes.get(id)[m] = assign[i];
    }
  }
  return { centroidsPerM, codes };
}

function pqAsymmetricScore(queryVec, id, centroidsPerM, codes) {
  const code = codes.get(id);
  if (!code) return -Infinity;
  let s = 0;
  for (let m = 0; m < PQ_M; m++) {
    const qsub = subvector(queryVec, m);
    const c = centroidsPerM[m][code[m]];
    for (let t = 0; t < PQ_SUB; t++) s += qsub[t] * c[t];
  }
  return s;
}

function codebookByteSize(centroidsPerM) {
  let b = 0;
  for (const cts of centroidsPerM)
    for (const c of cts) b += c.byteLength;
  return b;
}

// ─── InProcessEngine ──────────────────────────────────────────────────────────
class InProcessEngine {
  constructor() {
    this.mode        = 'in-process';
    this._dims       = DIMS;
    this._tables     = new Map();
    this._edges      = new Map();
    this._vecs       = new Map();
    this._embedCount = 0;
    this._embedMs    = 0;
    this._sqCodes    = new Map();
    this._pqCodes    = null;
    this._pqCentroids = null;
  }

  insert(table, records) {
    if (!this._tables.has(table)) this._tables.set(table, new Map());
    const store = this._tables.get(table);
    return (Array.isArray(records) ? records : [records]).map(data => {
      const rec = { ...data, id: makeId(table), created: new Date().toISOString() };
      store.set(rec.id, rec);
      return rec;
    });
  }

  create(table, data) { return this.insert(table, [data])[0]; }

  delete(id) {
    for (const [, store] of this._tables) store.delete(id);
    this._vecs.delete(id);
    this._sqCodes.delete(id);
    this._pqCodes?.delete(id);
  }

  relate(fromId, edgeType, toId, fields = {}) {
    const key  = `${fromId}->${edgeType}->${toId}`;
    const edge = { id: makeId(edgeType), from: fromId, to: toId,
                   ...fields, created: new Date().toISOString() };
    this._edges.set(key, edge);
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

  embed(text) {
    const t0  = performance.now();
    const vec = inProcessEmbed(text, this._dims);
    this._embedMs += performance.now() - t0;
    this._embedCount++;
    return vec;
  }

  batchEmbed(texts) { return texts.map(t => this.embed(t)); }

  storeEmbedding(id, vec) {
    this._vecs.set(id, vec);
    this._sqCodes.delete(id);
    this._pqCodes = null;
    this._pqCentroids = null;
  }

  getEmbedding(id) { return this._vecs.get(id) ?? null; }

  topK(queryVec, k = 5) {
    const results = [];
    for (const [id, vec] of this._vecs)
      results.push({ id, score: cosineSimilarity(queryVec, vec) });
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  /** Rebuild SQ + PQ structures from _vecs */
  rebuildQuantIndex() {
    this._sqCodes.clear();
    for (const [id, vec] of this._vecs)
      this._sqCodes.set(id, encodeSQ(vec));

    if (this._vecs.size === 0) {
      this._pqCodes = null;
      this._pqCentroids = null;
      return;
    }
    const { centroidsPerM, codes } = trainPQCentroids(this._vecs);
    this._pqCentroids = centroidsPerM;
    this._pqCodes = codes;
  }

  topK_SQ(queryVec, k = 10) {
    const results = [];
    const qd = decodeSQ(encodeSQ(queryVec));
    for (const [id] of this._vecs) {
      const code = this._sqCodes.get(id);
      if (!code) continue;
      const vd = decodeSQ(code);
      results.push({ id, score: cosineSimilarity(qd, vd) });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  topK_PQ(queryVec, k = 10) {
    if (!this._pqCodes || !this._pqCentroids) this.rebuildQuantIndex();
    const results = [];
    for (const [id] of this._vecs) {
      const sc = pqAsymmetricScore(queryVec, id, this._pqCentroids, this._pqCodes);
      results.push({ id, score: sc });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  recallAtK(queryVec, k, approxFn) {
    const truth = this.topK(queryVec, k).map(h => h.id);
    const approx = approxFn.call(this, queryVec, k).map(h => h.id);
    const setT = new Set(truth);
    let hit = 0;
    for (const id of approx) if (setT.has(id)) hit++;
    return hit / k;
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
      pqSubspaces:   PQ_M,
      pqCentroids:   PQ_K,
      ...dashboardMetrics,
    };
  }

  async ping() { return true; }
}

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
    this._sqCodes    = new Map();
    this._pqCodes    = null;
    this._pqCentroids = null;
  }

  async ping() {
    const r = await fetch(`${this._url}/api/tags`);
    if (!r.ok) throw new Error(`Ollama unreachable at ${this._url} (${r.status})`);
    return true;
  }

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
  delete(id)                            { for (const [,s] of this._tables) s.delete(id); this._vecs.delete(id); this._sqCodes.delete(id); this._pqCodes = null; }
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

  storeEmbedding(id, vec) {
    this._vecs.set(id, vec);
    this._sqCodes.delete(id);
    this._pqCodes = null;
    this._pqCentroids = null;
  }
  getEmbedding(id)        { return this._vecs.get(id) ?? null; }

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

  rebuildQuantIndex() {
    this._sqCodes.clear();
    for (const [id, vec] of this._vecs)
      this._sqCodes.set(id, encodeSQ(vec));
    if (this._vecs.size === 0) {
      this._pqCodes = null;
      this._pqCentroids = null;
      return;
    }
    const { centroidsPerM, codes } = trainPQCentroids(this._vecs);
    this._pqCentroids = centroidsPerM;
    this._pqCodes = codes;
  }

  topK_SQ(queryVec, k = 10) {
    const results = [];
    const qd = decodeSQ(encodeSQ(queryVec));
    for (const [id] of this._vecs) {
      const code = this._sqCodes.get(id);
      if (!code) continue;
      const vd = decodeSQ(code);
      results.push({ id, score: cosineSimilarity(qd, vd) });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  topK_PQ(queryVec, k = 10) {
    if (!this._pqCodes || !this._pqCentroids) this.rebuildQuantIndex();
    const results = [];
    for (const [id] of this._vecs) {
      const sc = pqAsymmetricScore(queryVec, id, this._pqCentroids, this._pqCodes);
      results.push({ id, score: sc });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  recallAtK(queryVec, k, approxFn) {
    const truth = this.topK(queryVec, k).map(h => h.id);
    const approx = approxFn.call(this, queryVec, k).map(h => h.id);
    const setT = new Set(truth);
    let hit = 0;
    for (const id of approx) if (setT.has(id)) hit++;
    return hit / k;
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
      pqSubspaces:   PQ_M,
      pqCentroids:   PQ_K,
      ...dashboardMetrics,
    };
  }
}

export async function createEngine() {
  if (process.env.NEXUS_MODE) {
    const eng = new ExternalEngine();
    await eng.ping();
    console.log(`[engine] connected to ollama at ${eng._url}  model=${eng._model}`);
    return eng;
  }
  console.log('[engine] in-process (hash embeddings + SQ/PQ quantization)');
  return new InProcessEngine();
}

/**
 * Run search + memory benchmark; updates dashboardMetrics (used by HTTP dashboard).
 */
export async function runQuantBenchmark(engine) {
  const n = engine._vecs.size;
  if (n < 5) {
    console.warn('[bench] need ≥5 vectors for quantization benchmark');
    return dashboardMetrics;
  }

  engine.rebuildQuantIndex();

  const floatBytes = n * DIMS * 4;
  const sqBytes    = n * DIMS * 1;
  const pqBytes    = n * PQ_M * 1;
  const cbBytes    = engine._pqCentroids ? codebookByteSize(engine._pqCentroids) : 0;

  dashboardMetrics.vectorsIndexed     = n;
  dashboardMetrics.floatBytes         = floatBytes;
  dashboardMetrics.sqBytes            = sqBytes;
  dashboardMetrics.pqBytes            = pqBytes;
  dashboardMetrics.codebookBytes      = cbBytes;
  dashboardMetrics.compressionRatioSQ = +(floatBytes / sqBytes).toFixed(2);
  const pqTotal = pqBytes + cbBytes;
  const pqRatioRaw = pqTotal > 0 ? floatBytes / pqTotal : 0;
  // Codebook is amortized; tiny corpora can look worse than float — floor at 1× for display
  dashboardMetrics.compressionRatioPQ = +(Math.max(pqRatioRaw, 1)).toFixed(2);

  const qtext = 'kafka distributed streaming partition consumer offset';
  const qvec  = await Promise.resolve(engine.embed(qtext));
  const k     = 10;

  let t0 = performance.now();
  engine.topK(qvec, k);
  dashboardMetrics.floatSearchMs = +(performance.now() - t0).toFixed(3);

  t0 = performance.now();
  engine.topK_SQ(qvec, k);
  dashboardMetrics.sqSearchMs = +(performance.now() - t0).toFixed(3);

  t0 = performance.now();
  engine.topK_PQ(qvec, k);
  dashboardMetrics.pqSearchMs = +(performance.now() - t0).toFixed(3);

  dashboardMetrics.recallSQat10 = +engine.recallAtK(qvec, k, engine.topK_SQ).toFixed(3);
  dashboardMetrics.recallPQat10 = +engine.recallAtK(qvec, k, engine.topK_PQ).toFixed(3);
  dashboardMetrics.lastBenchAt = new Date().toISOString();
  return dashboardMetrics;
}
