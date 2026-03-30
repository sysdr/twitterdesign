import { performance } from 'node:perf_hooks';
import { createEngine } from './engine.mjs';

const engine = await createEngine();

// ── Seed 200 users ────────────────────────────────────────────────────────
console.log('Seeding 200 users...');
const userIds = [];
for (let i = 0; i < 200; i++) {
  const u = engine.create('user', { handle: `user_${i}`, createdAt: Date.now() });
  userIds.push(u.id);
}
console.log(`[✓] Seeded ${userIds.length} users`);

// ── Seed initial events ───────────────────────────────────────────────────
for (let i = 0; i < 50; i++) {
  engine.executeCommand('PostTweet', {
    userId:  userIds[i],
    content: `Seeding tweet ${i} — NEXUS write path demonstration`,
  });
}
for (let i = 0; i < 50; i++) {
  engine.executeCommand('LikeTweet', {
    userId:  userIds[(i + 10) % 200],
    tweetId: `tweet:${i.toString(36).padStart(8, '0')}`,
  });
}
for (let i = 0; i < 50; i++) {
  engine.executeCommand('FollowUser', {
    followerId: userIds[i],
    followeeId: userIds[(i + 1) % 200],
  });
}
console.log(`[✓] Initial events seeded`);

// ── Benchmark ─────────────────────────────────────────────────────────────
function benchmark(label, fn, n = 500) {
  const lats = [];
  for (let i = 0; i < n; i++) {
    const t = performance.now();
    fn(i);
    lats.push(performance.now() - t);
  }
  lats.sort((a, b) => a - b);
  return {
    label,
    p50: lats[Math.floor(n * 0.50)],
    p99: lats[Math.floor(n * 0.99)],
  };
}

const results = [
  benchmark('PostTweet', i =>
    engine.executeCommand('PostTweet', {
      userId:  userIds[i % 200],
      content: `Benchmark tweet ${i} — write path latency measurement`,
    })
  ),
  benchmark('LikeTweet', i =>
    engine.executeCommand('LikeTweet', {
      userId:  userIds[i % 200],
      tweetId: `tweet:${(i % 100).toString(36).padStart(8, '0')}`,
    })
  ),
  benchmark('FollowUser', i =>
    engine.executeCommand('FollowUser', {
      followerId: userIds[i % 200],
      followeeId: userIds[(i + 1) % 200],
    })
  ),
  benchmark('DeleteTweet', i =>
    engine.executeCommand('DeleteTweet', {
      userId:  userIds[i % 200],
      tweetId: `tweet:${(i % 100).toString(36).padStart(8, '0')}`,
    })
  ),
];

console.log('\n── Command Handler Benchmarks (500 iterations each) ─────────────────');
let allPass = true;
for (const r of results) {
  const pass = r.p99 < 10;
  if (!pass) allPass = false;
  const mark = pass ? '✓' : '✗';
  console.log(
    `  [${mark}] ${r.label.padEnd(12)}` +
    `  P50: ${r.p50.toFixed(3)}ms` +
    `  P99: ${r.p99.toFixed(3)}ms`
  );
}
console.log('─────────────────────────────────────────────────────────────────────');

const s = engine.stats();
console.log(`\nTotal events published: ${s.totalEvents}`);
if (s.eventCounts) {
  for (const [topic, count] of Object.entries(s.eventCounts))
    console.log(`  ${topic}: ${count}`);
}

if (!allPass) {
  console.error('\n[✗] Some handlers exceeded 10ms P99 target');
  process.exit(1);
}
console.log('\n[done] All handlers < 10ms P99 ✓  Run: node test_lesson.mjs to verify');
