import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createEngine, cosineSimilarity, DIMS } from './engine.mjs';

const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', X = '\x1b[0m';
let passed = 0, failed = 0;
const pass = m     => { console.log(`${G}  [PASS]${X} ${m}`); passed++; };
const fail = (m,e) => { console.log(`${R}  [FAIL]${X} ${m}${e ? ': ' + e.message : ''}`); failed++; };
const head = m     => console.log(`\n${Y}  ── ${m}${X}`);

// test_lesson.mjs always seeds its own engines — never depends on lesson_code.mjs
const engine = await createEngine();
const eng2   = await createEngine();   // fresh engine for isolated topK test

// ── 1. Schema / init ──────────────────────────────────────────────────────────
head('Schema / Init');
try {
  const s = engine.stats();
  assert.equal(s.dims,          DIMS, 'dims must be 384');
  assert.equal(s.embedCount,    0,    'embedCount must start at 0');
  assert.equal(s.vectorsStored, 0,    'vectorsStored must start at 0');
  pass(`dims=${s.dims}  embedCount=${s.embedCount}  stored=${s.vectorsStored}`);
} catch(e) { fail('Schema init', e); }

// ── 2. Embed dimensionality ───────────────────────────────────────────────────
head('Embed Dimensionality');
try {
  const v = engine.embed('hello distributed systems kafka');
  assert.ok(v instanceof Float32Array, 'embed must return Float32Array');
  assert.equal(v.length, DIMS,         `vector must be ${DIMS}-dim`);
  pass(`embed → Float32Array(${DIMS})`);
} catch(e) { fail('Embed dimensionality', e); }

// ── 3. L2 normalization ───────────────────────────────────────────────────────
head('L2 Normalization');
try {
  const cases = [
    'kafka',
    'kafka distributed streaming',
    'the quick brown fox jumps over the lazy dog',
  ];
  for (const t of cases) {
    const v = engine.embed(t);
    let norm = 0;
    for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
    norm = Math.sqrt(norm);
    assert.ok(Math.abs(norm - 1.0) < 1e-5,
      `||embed("${t.slice(0,20)}")|| = ${norm.toFixed(8)}, expected 1.0`);
  }
  pass('all embed outputs are unit-length (||v|| = 1.0 ± 1e-5)');
} catch(e) { fail('L2 normalization', e); }

// ── 4. Determinism ────────────────────────────────────────────────────────────
head('Determinism');
try {
  const t  = 'redpanda streaming kafka compatible without jvm';
  const v1 = engine.embed(t);
  const v2 = engine.embed(t);
  for (let i = 0; i < DIMS; i++)
    assert.ok(Math.abs(v1[i] - v2[i]) < 1e-10, `dim ${i} not deterministic`);
  pass('same text → bit-exact identical vector on every call');
} catch(e) { fail('Determinism', e); }

// ── 5. Cosine self-similarity ─────────────────────────────────────────────────
head('Cosine Self-Similarity');
try {
  const v    = engine.embed('surrealdb graph database polyglot multi model');
  const self = cosineSimilarity(v, v);
  assert.ok(Math.abs(self - 1.0) < 1e-6, `self-cosine = ${self}`);
  pass(`cosineSimilarity(v, v) = ${self.toFixed(8)} ≈ 1.0`);
} catch(e) { fail('Cosine self-similarity', e); }

// ── 6. Semantic ordering ──────────────────────────────────────────────────────
head('Semantic Ordering');
try {
  const base  = engine.embed('kafka distributed streaming topic partition');
  const close = engine.embed('kafka distributed streaming consumer offset group');
  const far   = engine.embed('chocolate cake birthday candles sugar frosting dessert');
  const sC    = cosineSimilarity(base, close);
  const sF    = cosineSimilarity(base, far);
  assert.ok(sC > sF,
    `similar(${sC.toFixed(4)}) must exceed unrelated(${sF.toFixed(4)})`);
  pass(`kafka-close(${sC.toFixed(4)}) > cake-far(${sF.toFixed(4)})`);
} catch(e) { fail('Semantic ordering', e); }

// ── 7. Edge cases ─────────────────────────────────────────────────────────────
head('Edge Cases');
try {
  const empty  = engine.embed('');
  const single = engine.embed('x');
  const punct  = engine.embed('!!! --- ???');
  assert.ok(empty  instanceof Float32Array && empty.length  === DIMS);
  assert.ok(single instanceof Float32Array && single.length === DIMS);
  assert.ok(punct  instanceof Float32Array && punct.length  === DIMS);
  pass('empty, single-char, punctuation-only → valid Float32Array(384)');
} catch(e) { fail('Edge cases', e); }

// ── 8. Store / retrieve round-trip ────────────────────────────────────────────
head('Store / Retrieve');
try {
  const rec = engine.create('tweet', { text: 'store retrieve round trip test' });
  const vec = engine.embed(rec.text);
  engine.storeEmbedding(rec.id, vec);
  const got = engine.getEmbedding(rec.id);
  assert.ok(got instanceof Float32Array,               'retrieved must be Float32Array');
  assert.equal(got.length, DIMS,                        'retrieved must be 384-dim');
  assert.ok(Math.abs(cosineSimilarity(vec, got) - 1.0) < 1e-6,
    'stored/retrieved vector must be identical (cosine = 1.0)');
  pass(`storeEmbedding / getEmbedding round-trip cosine = 1.0`);
} catch(e) { fail('Store / retrieve', e); }

// ── 9. topK search ────────────────────────────────────────────────────────────
head('topK Search');
try {
  const phrases = [
    'kafka message broker streaming events partitions',
    'redis cache in-memory fast lookup expiry ttl',
    'postgres relational sql acid transactions constraints',
    'kafka consumer group partition offset commit rebalance',
    'vector embeddings cosine similarity approximate search',
  ];
  for (const p of phrases) {
    const r = eng2.create('tweet', { text: p });
    eng2.storeEmbedding(r.id, eng2.embed(p));
  }

  const qvec = eng2.embed('kafka streaming events consumer');
  const hits  = eng2.topK(qvec, 2);

  assert.equal(hits.length, 2,
    'topK(2) must return exactly 2 results');
  assert.ok(hits[0].score >= hits[1].score,
    'results must be sorted by score descending');
  assert.ok(hits[0].score > 0.25,
    `top score ${hits[0].score.toFixed(4)} must exceed unrelated matches (hash embeddings stay <0.5)`);

  const topText = eng2.selectOne(hits[0].id).text;
  assert.ok(topText.includes('kafka'),
    `top result should mention kafka, got: "${topText}"`);

  pass(`topK(2) top="${topText.slice(0,45)}" score=${hits[0].score.toFixed(4)}`);
} catch(e) { fail('topK search', e); }

// ── 10. Duplicate relate deduplication (base primitive) ───────────────────────
head('Duplicate RELATE Deduplication');
try {
  const a = engine.create('user', { h: 'alice' });
  const b = engine.create('user', { h: 'bob' });
  engine.relate(a.id, 'follows', b.id, {});
  engine.relate(a.id, 'follows', b.id, {});  // duplicate — must not inflate count
  engine.relate(a.id, 'follows', b.id, {});  // triplicate
  const edges = engine.traverse(a.id, 'follows');
  assert.equal(edges.length, 1, `duplicate relate must yield 1 edge, got ${edges.length}`);
  pass('duplicate RELATE calls do not inflate edge count (Map key dedup)');
} catch(e) { fail('Duplicate RELATE deduplication', e); }

// ── 11. batchEmbed consistency ────────────────────────────────────────────────
head('batchEmbed Consistency');
try {
  const texts = Array.from({ length: 8 }, (_, i) => `batch test tweet ${i} kafka redis`);
  const vecs  = engine.batchEmbed(texts);
  assert.equal(vecs.length, 8, 'batchEmbed must return array of same length as input');
  for (let i = 0; i < vecs.length; i++) {
    assert.ok(vecs[i] instanceof Float32Array, `vecs[${i}] must be Float32Array`);
    assert.equal(vecs[i].length, DIMS,          `vecs[${i}] must be ${DIMS}-dim`);
    // batchEmbed must match individual embed calls
    const single = engine.embed(texts[i]);
    assert.ok(Math.abs(cosineSimilarity(vecs[i], single) - 1.0) < 1e-6,
      `batchEmbed[${i}] must match individual embed result`);
  }
  pass('batchEmbed(8) → 8×Float32Array(384), each matches individual embed');
} catch(e) { fail('batchEmbed consistency', e); }

// ── 12. Throughput ≥ 100 tweets/sec · P99 < 5ms/tweet ────────────────────────
head('Throughput ≥ 100 tweets/sec  ·  P99 < 5ms/tweet');
try {
  const N = 100, ITERS = 50;
  const texts = Array.from({ length: N }, (_, i) =>
    `throughput test tweet ${i} kafka redis distributed systems streaming`);

  // warm up
  engine.batchEmbed(texts.slice(0, 10));

  const times = [];
  for (let i = 0; i < ITERS; i++) {
    const t0 = performance.now();
    engine.batchEmbed(texts);
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);

  const p50      = times[Math.floor(ITERS * 0.50)];
  const p99      = times[Math.floor(ITERS * 0.99)];
  const totalMs  = times.reduce((s, x) => s + x, 0);
  const tps      = Math.round((ITERS * N) / (totalMs / 1000));
  const p99tweet = p99 / N;

  assert.ok(tps      >= 100, `throughput ${tps} tweets/sec < 100`);
  assert.ok(p99tweet < 5,    `P99/tweet ${p99tweet.toFixed(3)}ms ≥ 5ms`);

  pass(`throughput=${tps.toLocaleString()} tweets/sec  P50=${p50.toFixed(1)}ms  P99=${p99.toFixed(1)}ms  P99/tweet=${p99tweet.toFixed(3)}ms`);
} catch(e) { fail('Throughput / P99', e); }

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n  ──────────────────────────────────────────`);
console.log(`  ${G}PASS${X}: ${passed}  ${failed > 0 ? R : ''}FAIL${X}: ${failed}`);
if (failed === 0) {
  console.log(`  ${G}[ALL PASS]${X} Day 14 verification complete.`);
} else {
  console.log(`  ${R}[FAILURES DETECTED]${X} Fix the failing tests above.`);
  process.exit(1);
}
