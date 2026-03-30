import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { InProcessEngine, validatePayload } from './engine.mjs';

const G = '\x1b[32m', R = '\x1b[31m', X = '\x1b[0m';
let passed = 0, failed = 0;
const pass = m => { console.log(`${G}  [PASS]${X} ${m}`); passed++; };
const fail = (m, err) => {
  console.log(`${R}  [FAIL]${X} ${m}${err ? ': ' + err.message : ''}`);
  failed++;
};

// ── Fresh engine seeded independently ─────────────────────────────────────
const engine = new InProcessEngine();
const userIds = [];
for (let i = 0; i < 20; i++) {
  const u = engine.create('user', { handle: `tester_${i}` });
  userIds.push(u.id);
}

// ── Schema / Init ─────────────────────────────────────────────────────────
console.log('\n[Schema / Init]');
try {
  assert.equal(typeof engine.executeCommand, 'function');
  assert.equal(typeof engine.getEvents, 'function');
  assert.equal(typeof engine.getEventCount, 'function');
  assert.equal(typeof engine.stats, 'function');
  pass('engine exposes command and event primitives');
} catch (e) { fail('engine primitives missing', e); }

// ── Seed counts ────────────────────────────────────────────────────────────
console.log('\n[Seed Counts]');
try {
  assert.equal(engine.count('user'), 20);
  pass('20 users seeded correctly');
} catch (e) { fail('user seed count', e); }

// ── PostTweet ──────────────────────────────────────────────────────────────
console.log('\n[PostTweet]');
try {
  const ev = engine.executeCommand('PostTweet', { userId: userIds[0], content: 'Hello NEXUS' });
  assert.ok(typeof ev.eventId === 'string');
  assert.ok(ev.eventId.startsWith('event:'));
  assert.equal(ev.topic, 'tweet.created');
  assert.equal(ev.commandType, 'PostTweet');
  assert.equal(ev.payload.content, 'Hello NEXUS');
  assert.ok(typeof ev.latencyMs === 'number' && ev.latencyMs >= 0);
  pass('PostTweet returns valid event record');
} catch (e) { fail('PostTweet basic case', e); }

try {
  assert.ok(engine.getEventCount('tweet.created') >= 1);
  pass('tweet.created topic accumulates events');
} catch (e) { fail('tweet.created count', e); }

try {
  assert.throws(
    () => engine.executeCommand('PostTweet', { userId: userIds[0] }),
    /content/i
  );
  pass('PostTweet rejects missing content');
} catch (e) { fail('PostTweet missing content', e); }

try {
  assert.throws(
    () => engine.executeCommand('PostTweet', { userId: userIds[0], content: 'x'.repeat(281) }),
    /280/
  );
  pass('PostTweet rejects content > 280 characters');
} catch (e) { fail('PostTweet max length', e); }

try {
  assert.throws(
    () => engine.executeCommand('PostTweet', { userId: userIds[0], content: '' }),
    /content/i
  );
  pass('PostTweet rejects empty content');
} catch (e) { fail('PostTweet empty content', e); }

try {
  assert.throws(
    () => engine.executeCommand('PostTweet', { content: 'no user' }),
    /userId/i
  );
  pass('PostTweet rejects missing userId');
} catch (e) { fail('PostTweet missing userId', e); }

// ── LikeTweet ─────────────────────────────────────────────────────────────
console.log('\n[LikeTweet]');
try {
  const ev = engine.executeCommand('LikeTweet', {
    userId: userIds[1], tweetId: 'tweet:00000001',
  });
  assert.equal(ev.topic, 'tweet.liked');
  assert.equal(ev.payload.tweetId, 'tweet:00000001');
  pass('LikeTweet returns valid event');
} catch (e) { fail('LikeTweet basic case', e); }

try {
  assert.throws(
    () => engine.executeCommand('LikeTweet', { userId: userIds[0] }),
    /tweetId/i
  );
  pass('LikeTweet rejects missing tweetId');
} catch (e) { fail('LikeTweet missing tweetId', e); }

// ── FollowUser ────────────────────────────────────────────────────────────
console.log('\n[FollowUser]');
try {
  const ev = engine.executeCommand('FollowUser', {
    followerId: userIds[2], followeeId: userIds[3],
  });
  assert.equal(ev.topic, 'user.followed');
  assert.equal(ev.payload.followerId, userIds[2]);
  assert.equal(ev.payload.followeeId, userIds[3]);
  pass('FollowUser returns valid event');
} catch (e) { fail('FollowUser basic case', e); }

try {
  assert.throws(
    () => engine.executeCommand('FollowUser', {
      followerId: userIds[0], followeeId: userIds[0],
    }),
    /differ/i
  );
  pass('FollowUser rejects self-follow');
} catch (e) { fail('FollowUser self-follow', e); }

try {
  assert.throws(
    () => engine.executeCommand('FollowUser', { followerId: userIds[0] }),
    /followeeId/i
  );
  pass('FollowUser rejects missing followeeId');
} catch (e) { fail('FollowUser missing followeeId', e); }

// ── DeleteTweet ───────────────────────────────────────────────────────────
console.log('\n[DeleteTweet]');
try {
  const ev = engine.executeCommand('DeleteTweet', {
    userId: userIds[4], tweetId: 'tweet:00000001',
  });
  assert.equal(ev.topic, 'tweet.deleted');
  assert.equal(ev.payload.userId, userIds[4]);
  pass('DeleteTweet returns valid event');
} catch (e) { fail('DeleteTweet basic case', e); }

try {
  assert.throws(
    () => engine.executeCommand('DeleteTweet', { tweetId: 'tweet:00000001' }),
    /userId/i
  );
  pass('DeleteTweet rejects missing userId');
} catch (e) { fail('DeleteTweet missing userId', e); }

// ── Unknown command ───────────────────────────────────────────────────────
console.log('\n[Unknown Command]');
try {
  assert.throws(
    () => engine.executeCommand('BanUser', { userId: userIds[0] }),
    /Unknown command/
  );
  pass('Unknown command type throws correctly');
} catch (e) { fail('Unknown command handling', e); }

// ── Idempotency ───────────────────────────────────────────────────────────
console.log('\n[Idempotency]');
try {
  const key = 'test-idem-001';
  const ev1 = engine.executeCommand('PostTweet',
    { userId: userIds[0], content: 'Idempotent message' }, key);
  const ev2 = engine.executeCommand('PostTweet',
    { userId: userIds[0], content: 'Idempotent message' }, key);
  assert.equal(ev1.eventId, ev2.eventId);
  assert.equal(ev2.deduplicated, true);
  pass('Same idempotency key returns identical event record');
} catch (e) { fail('Idempotency returns same event', e); }

try {
  const key = 'test-idem-002';
  const before = engine.getEventCount('tweet.created');
  engine.executeCommand('PostTweet', { userId: userIds[0], content: 'Once' }, key);
  engine.executeCommand('PostTweet', { userId: userIds[0], content: 'Once' }, key);
  engine.executeCommand('PostTweet', { userId: userIds[0], content: 'Once' }, key);
  const after = engine.getEventCount('tweet.created');
  assert.equal(after - before, 1);
  pass('Idempotency key prevents duplicate event publication');
} catch (e) { fail('Idempotency event count', e); }

// ── Stats shape ───────────────────────────────────────────────────────────
console.log('\n[Stats]');
try {
  const s = engine.stats();
  assert.ok(typeof s.commands === 'number');
  assert.ok(typeof s.totalEvents === 'number');
  assert.ok(typeof s.eventCounts === 'object');
  assert.ok('tweet.created'  in s.eventCounts);
  assert.ok('tweet.liked'    in s.eventCounts);
  assert.ok('user.followed'  in s.eventCounts);
  assert.ok('tweet.deleted'  in s.eventCounts);
  pass('stats() shape correct with all four topics');
} catch (e) { fail('stats shape', e); }

// ── Performance: P99 < 10ms at 500 iterations ─────────────────────────────
console.log('\n[Performance — P99 < 10ms @ 500 iterations]');

const perfEngine = new InProcessEngine();
const perfUsers = [];
for (let i = 0; i < 100; i++) {
  perfUsers.push(perfEngine.create('user', { handle: `p${i}` }).id);
}

function bench(label, fn, n = 500) {
  const lats = [];
  for (let i = 0; i < n; i++) {
    const t = performance.now();
    fn(i);
    lats.push(performance.now() - t);
  }
  lats.sort((a, b) => a - b);
  return { p50: lats[Math.floor(n * 0.50)], p99: lats[Math.floor(n * 0.99)] };
}

const perfCases = [
  {
    label: 'PostTweet',
    fn: i => perfEngine.executeCommand('PostTweet', {
      userId:  perfUsers[i % 100],
      content: `Perf tweet ${i} — write path test`,
    }),
  },
  {
    label: 'LikeTweet',
    fn: i => perfEngine.executeCommand('LikeTweet', {
      userId:  perfUsers[i % 100],
      tweetId: `tweet:${(i % 100).toString(36).padStart(8, '0')}`,
    }),
  },
  {
    label: 'FollowUser',
    fn: i => perfEngine.executeCommand('FollowUser', {
      followerId: perfUsers[i % 100],
      followeeId: perfUsers[(i + 1) % 100],
    }),
  },
  {
    label: 'DeleteTweet',
    fn: i => perfEngine.executeCommand('DeleteTweet', {
      userId:  perfUsers[i % 100],
      tweetId: `tweet:${(i % 100).toString(36).padStart(8, '0')}`,
    }),
  },
];

for (const c of perfCases) {
  const { p50, p99 } = bench(c.label, c.fn);
  if (p99 < 10) {
    pass(`${c.label} P99 ${p99.toFixed(3)}ms < 10ms target`);
  } else {
    fail(`${c.label} P99 ${p99.toFixed(3)}ms exceeds 10ms target`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`  ${G}PASS${X}: ${passed}   ${failed > 0 ? R : ''}FAIL: ${failed}${X}`);
const label = failed === 0 ? `${G}[ALL PASS]${X} Day 09 verification complete.` : `${R}[FAILURES]${X} Fix failing tests.`;
console.log(`  ${label}`);
console.log('─'.repeat(60));

if (failed > 0) process.exit(1);
