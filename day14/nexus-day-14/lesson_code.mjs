import { performance } from 'node:perf_hooks';
import { createEngine, cosineSimilarity } from './engine.mjs';

// ─── Deterministic corpus ─────────────────────────────────────────────────────
const TOPICS = [
  'kafka message queue distributed streaming events topic partition consumer',
  'redis pub sub in memory cache fast low latency key value store',
  'surrealdb graph database polyglot multi model relations edges nodes',
  'redpanda kafka compatible streaming without jvm rust performance',
  'distributed systems consensus raft paxos leader election quorum',
  'postgres sql acid transactions relational schema indexes joins',
  'vector embeddings semantic search similarity cosine nearest neighbor',
  'docker container orchestration kubernetes deployment scaling replicas',
  'event sourcing cqrs write side read side command query separation',
  'nodejs async event loop non blocking io concurrency streams buffers',
];

// Expand to 200 deterministic tweets
const corpus = [];
for (let i = 0; i < 200; i++) {
  corpus.push(`${TOPICS[i % TOPICS.length]} idx_${i}`);
}

async function main() {
  const engine = await createEngine();

  // ─── Seed: embed and store all 200 tweets ────────────────────────────────
  console.log('\n[seed] embedding 200 tweets...');
  for (let i = 0; i < corpus.length; i++) {
    const rec = engine.create('tweet', { text: corpus[i], idx: i });
    const vec = await Promise.resolve(engine.embed(corpus[i]));
    engine.storeEmbedding(rec.id, vec);
  }
  console.log(`[seed] ${engine.count('tweet')} tweets stored · ${engine.stats().vectorsStored} vectors indexed`);

  // ─── topK similarity demo ─────────────────────────────────────────────────
  const query = 'kafka distributed streaming partition topic';
  const qvec  = await Promise.resolve(engine.embed(query));
  const hits  = engine.topK(qvec, 3);
  console.log(`\n[demo] topK(3) for: "${query}"`);
  for (const h of hits) {
    const rec = engine.selectOne(h.id);
    console.log(`  score=${h.score.toFixed(4)}  "${rec.text.slice(0, 65)}"`);
  }

  // ─── Cosine distance between two specific vectors ─────────────────────────
  const vKafka = await Promise.resolve(engine.embed('kafka distributed streaming topic partition'));
  const vRedis = await Promise.resolve(engine.embed('redis in memory cache key value fast'));
  const vSame  = await Promise.resolve(engine.embed('kafka distributed streaming topic partition'));
  console.log(`\n[demo] cosine("kafka...", "kafka...")  = ${cosineSimilarity(vKafka, vSame).toFixed(6)}`);
  console.log(`[demo] cosine("kafka...", "redis...")   = ${cosineSimilarity(vKafka, vRedis).toFixed(6)}`);

  // ─── Throughput benchmark ─────────────────────────────────────────────────
  console.log('\n[bench] warming up (5 × 20 tweets)...');
  const warmupBatch = corpus.slice(0, 20);
  for (let w = 0; w < 5; w++)
    await Promise.resolve(engine.batchEmbed(warmupBatch));

  const ITERS      = 50;
  const BATCH_SIZE = 100;
  const bench      = corpus.slice(0, BATCH_SIZE);
  const times      = [];

  for (let iter = 0; iter < ITERS; iter++) {
    const t0 = performance.now();
    await Promise.resolve(engine.batchEmbed(bench));
    times.push(performance.now() - t0);
  }

  times.sort((a, b) => a - b);
  const p50        = times[Math.floor(ITERS * 0.50)];
  const p99        = times[Math.floor(ITERS * 0.99)];
  const totalMs    = times.reduce((s, x) => s + x, 0);
  const throughput = Math.round((ITERS * BATCH_SIZE) / (totalMs / 1000));
  const p99PerTweet = p99 / BATCH_SIZE;

  console.log(`[bench] batch(${BATCH_SIZE})  P50=${p50.toFixed(1)}ms  P99=${p99.toFixed(1)}ms`);
  console.log(`[bench] per-tweet P99=${p99PerTweet.toFixed(3)}ms`);
  console.log(`[bench] throughput=${throughput.toLocaleString()} tweets/sec`);

  const s = engine.stats();
  console.log(`\n[stats] ${JSON.stringify(s)}`);
  console.log('\n[done] Run: node test_lesson.mjs to verify');
}

main().catch(err => { console.error(err); process.exit(1); });
