import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  createEngine,
  cosineSimilarity,
  DIMS,
  encodeSQ,
  decodeSQ,
  runQuantBenchmark,
} from './engine.mjs';

const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', X = '\x1b[0m';
let passed = 0, failed = 0;
const pass = m     => { console.log(`${G}  [PASS]${X} ${m}`); passed++; };
const fail = (m,e) => { console.log(`${R}  [FAIL]${X} ${m}${e ? ': ' + e.message : ''}`); failed++; };
const head = m     => console.log(`\n${Y}  ── ${m}${X}`);

const engine = await createEngine();
const eng2   = await createEngine();

head('Schema / Init');
try {
  const s = engine.stats();
  assert.equal(s.dims, DIMS);
  assert.equal(s.embedCount, 0);
  pass(`dims=${s.dims}`);
} catch(e) { fail('Schema init', e); }

head('Embed + L2');
try {
  const v = engine.embed('hello kafka streaming');
  assert.ok(v instanceof Float32Array);
  assert.equal(v.length, DIMS);
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  assert.ok(Math.abs(Math.sqrt(norm) - 1.0) < 1e-5);
  pass('unit-length embedding');
} catch(e) { fail('Embed L2', e); }

head('SQ encode / decode');
try {
  const v = engine.embed('quantization scalar eight bit');
  const c = encodeSQ(v);
  assert.equal(c.length, DIMS);
  const r = decodeSQ(c);
  const cos = cosineSimilarity(v, r);
  assert.ok(cos > 0.92, `SQ round-trip cosine ${cos}`);
  pass(`SQ round-trip cosine ≈ ${cos.toFixed(4)}`);
} catch(e) { fail('SQ encode/decode', e); }

head('PQ index + recall');
try {
  const phrases = [
    'kafka broker streaming events partitions',
    'redis cache memory fast ttl',
    'postgres sql relational acid',
    'vector search cosine approximate',
    'docker kubernetes deploy scaling',
    'kafka consumer group rebalance',
    'streaming pipeline backpressure',
    'embedding model transformer attention',
    'quantization product scalar memory',
    'distributed system consensus raft',
  ];
  for (const p of phrases) {
    const r = eng2.create('tweet', { text: p });
    eng2.storeEmbedding(r.id, eng2.embed(p));
  }
  eng2.rebuildQuantIndex();
  await runQuantBenchmark(eng2);
  const q = eng2.embed('kafka streaming events');
  const rPQ = eng2.recallAtK(q, 10, eng2.topK_PQ);
  const rSQ = eng2.recallAtK(q, 10, eng2.topK_SQ);
  assert.ok(rSQ >= 0.3, `SQ recall@10 ${rSQ}`);
  assert.ok(rPQ >= 0.1, `PQ recall@10 ${rPQ}`);
  pass(`recall@10 SQ=${rSQ.toFixed(2)} PQ=${rPQ.toFixed(2)}`);
} catch(e) { fail('PQ recall', e); }

head('topK ordering');
try {
  const e3 = await createEngine();
  for (let i = 0; i < 12; i++) {
    const t = `tweet ${i} kafka streaming pipeline`;
    const r = e3.create('tweet', { text: t });
    e3.storeEmbedding(r.id, e3.embed(t));
  }
  e3.rebuildQuantIndex();
  const qv = e3.embed('kafka streaming');
  const hits = e3.topK(qv, 3);
  assert.equal(hits.length, 3);
  assert.ok(hits[0].score >= hits[1].score);
  pass('topK sorted by score');
} catch(e) { fail('topK', e); }

head('Throughput');
try {
  const N = 100, ITERS = 50;
  const texts = Array.from({ length: N }, (_, i) =>
    `throughput ${i} kafka redis streaming`);
  engine.batchEmbed(texts.slice(0, 10));
  const times = [];
  for (let i = 0; i < ITERS; i++) {
    const t0 = performance.now();
    engine.batchEmbed(texts);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const totalMs = times.reduce((s, x) => s + x, 0);
  const tps = Math.round((ITERS * N) / (totalMs / 1000));
  const p99tweet = times[Math.floor(ITERS * 0.99)] / N;
  assert.ok(tps >= 100, `tps ${tps}`);
  assert.ok(p99tweet < 5, `P99/tweet ${p99tweet}`);
  pass(`${tps} texts/sec  P99/tweet ${p99tweet.toFixed(3)}ms`);
} catch(e) { fail('Throughput', e); }

console.log(`\n  ──────────────────────────────────────────`);
console.log(`  ${G}PASS${X}: ${passed}  ${failed > 0 ? R : ''}FAIL${X}: ${failed}`);
if (failed === 0) {
  console.log(`  ${G}[ALL PASS]${X} Day 19 verification complete.`);
} else {
  console.log(`  ${R}[FAILURES DETECTED]${X}`);
  process.exit(1);
}
