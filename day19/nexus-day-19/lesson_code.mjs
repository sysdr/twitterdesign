import { performance } from 'node:perf_hooks';
import { createEngine, cosineSimilarity, encodeSQ, decodeSQ, runQuantBenchmark } from './engine.mjs';

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

const corpus = [];
for (let i = 0; i < 200; i++) {
  corpus.push(`${TOPICS[i % TOPICS.length]} idx_${i}`);
}

async function main() {
  const engine = await createEngine();

  console.log('\n[seed] embedding 200 tweets…');
  for (let i = 0; i < corpus.length; i++) {
    const rec = engine.create('tweet', { text: corpus[i], idx: i });
    const vec = await Promise.resolve(engine.embed(corpus[i]));
    engine.storeEmbedding(rec.id, vec);
  }
  console.log(`[seed] ${engine.count('tweet')} tweets · ${engine.stats().vectorsStored} vectors`);

  engine.rebuildQuantIndex();
  const m = await runQuantBenchmark(engine);
  console.log('\n[quant] dashboard metrics:', JSON.stringify(m, null, 2));

  const query = 'kafka distributed streaming partition topic';
  const qvec  = await Promise.resolve(engine.embed(query));
  const floatHits = engine.topK(qvec, 5);
  const sqHits    = engine.topK_SQ(qvec, 5);
  const pqHits    = engine.topK_PQ(qvec, 5);

  console.log(`\n[demo] query: "${query.slice(0, 50)}…"`);
  console.log('[demo] float top-1:', engine.selectOne(floatHits[0].id).text.slice(0, 60));
  console.log('[demo] SQ top-1 score:', sqHits[0].score.toFixed(4), 'PQ top-1 score:', pqHits[0].score.toFixed(4));

  const v = engine.embed('quantization benchmark scalar product');
  const c = encodeSQ(v);
  const r = decodeSQ(c);
  console.log(`\n[demo] SQ round-trip cosine: ${cosineSimilarity(v, r).toFixed(4)}`);

  console.log('\n[bench] batch embed (50 × 100 texts)…');
  const N = 100, ITERS = 50;
  const bench = corpus.slice(0, N);
  await Promise.resolve(engine.batchEmbed(bench.slice(0, 10)));
  const times = [];
  for (let i = 0; i < ITERS; i++) {
    const t0 = performance.now();
    await Promise.resolve(engine.batchEmbed(bench));
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const totalMs = times.reduce((s, x) => s + x, 0);
  const tps = Math.round((ITERS * N) / (totalMs / 1000));
  console.log(`[bench] throughput ≈ ${tps.toLocaleString()} texts/sec  P99 batch ${times[Math.floor(ITERS * 0.99)].toFixed(1)}ms`);

  console.log('\n[done] Run: node test_lesson.mjs');
}

main().catch(err => { console.error(err); process.exit(1); });
