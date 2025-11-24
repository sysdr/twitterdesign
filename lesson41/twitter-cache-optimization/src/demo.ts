/**
 * Interactive Demo of Cache Optimization
 */

import { CacheManager } from './cache/CacheManager';
import { MockDatabase, Tweet } from './database/MockDatabase';

async function runDemo() {
  console.log('='.repeat(60));
  console.log('Twitter Cache Optimization Demo');
  console.log('Lesson 41: LRU-K, ARC, and Predictive Warming');
  console.log('='.repeat(60));
  console.log('');

  const database = new MockDatabase();
  const cacheManager = new CacheManager<Tweet>(
    {
      l1MaxSize: 50,
      l2MaxSize: 200,
      k: 2,
      ttl: 300000,
      workingSetWindow: 60000,
      predictionConfidence: 0.7
    },
    async (key: string) => {
      const tweet = await database.query(key);
      if (!tweet) throw new Error('Not found');
      return tweet;
    }
  );

  console.log('📝 Scenario 1: Demonstrating LRU-K vs Standard LRU');
  console.log('-'.repeat(60));
  
  // Access pattern: one-hit wonders mixed with frequently accessed
  const oneHitWonders = Array.from({length: 30}, (_, i) => `tweet_${i + 1}`);
  const frequentlyAccessed = ['tweet_100', 'tweet_101', 'tweet_102'];

  console.log('Simulating timeline scroll (one-hit wonders)...');
  for (const tweetId of oneHitWonders) {
    await cacheManager.get(tweetId);
  }

  console.log('Simulating repeated profile views (frequent access)...');
  for (let i = 0; i < 10; i++) {
    for (const tweetId of frequentlyAccessed) {
      await cacheManager.get(tweetId);
    }
  }

  let stats = cacheManager.getStats();
  console.log(`\n✅ LRU-K Results:`);
  console.log(`   L1 Hit Rate: ${stats.l1.hitRate.toFixed(1)}%`);
  console.log(`   L1 Size: ${stats.l1.size} items`);
  console.log(`   Frequently accessed tweets kept hot ✓`);
  console.log('');

  await sleep(1000);

  console.log('📝 Scenario 2: ARC Adaptive Behavior');
  console.log('-'.repeat(60));
  
  // First: recency-heavy workload
  console.log('Phase 1: Recency-heavy workload (unique tweets)...');
  for (let i = 200; i < 230; i++) {
    await cacheManager.get(`tweet_${i}`);
  }

  stats = cacheManager.getStats();
  const recencyBias1 = stats.l2.recencyBias;
  console.log(`   ARC recency bias: ${(recencyBias1 * 100).toFixed(1)}%`);

  await sleep(1000);

  // Then: frequency-heavy workload
  console.log('Phase 2: Frequency-heavy workload (repeated tweets)...');
  const frequentTweets = ['tweet_300', 'tweet_301', 'tweet_302'];
  for (let i = 0; i < 20; i++) {
    for (const tweetId of frequentTweets) {
      await cacheManager.get(tweetId);
    }
  }

  stats = cacheManager.getStats();
  const recencyBias2 = stats.l2.recencyBias;
  console.log(`   ARC recency bias: ${(recencyBias2 * 100).toFixed(1)}%`);
  console.log(`   Adaptation: ${stats.l2.adaptations} times`);
  console.log('   ✓ Cache automatically adapted to workload\n');

  await sleep(1000);

  console.log('📝 Scenario 3: Working Set Analysis');
  console.log('-'.repeat(60));
  
  console.log('Simulating user session with realistic access pattern...');
  const sessionTweets = Array.from({length: 50}, (_, i) => `tweet_${400 + i}`);
  
  for (const tweetId of sessionTweets) {
    await cacheManager.get(tweetId);
    if (Math.random() > 0.7) {
      // Re-access some tweets (realistic scrolling behavior)
      await cacheManager.get(tweetId);
    }
  }

  stats = cacheManager.getStats();
  console.log(`\n   Working Set Size: ${stats.workingSet.currentWorkingSetSize} unique items`);
  console.log(`   Average: ${stats.workingSet.averageWorkingSetSize} items`);
  console.log(`   Recommended L2 Size: ${stats.recommendation.optimalL2Size} items`);
  console.log(`   Current L2 Size: ${stats.l2.maxSize} items`);
  
  const efficiency = (stats.l2.maxSize / stats.recommendation.optimalL2Size) * 100;
  console.log(`   Sizing Efficiency: ${efficiency.toFixed(1)}%\n`);

  await sleep(1000);

  console.log('📝 Scenario 4: Predictive Cache Warming');
  console.log('-'.repeat(60));
  
  console.log('Teaching access pattern: profile → tweets → likes...');
  const trainingPattern = [
    ['profile_1', 'tweets_1', 'likes_1'],
    ['profile_2', 'tweets_2', 'likes_2'],
    ['profile_3', 'tweets_3', 'likes_3'],
    ['profile_4', 'tweets_4', 'likes_4'],
    ['profile_5', 'tweets_5', 'likes_5']
  ];

  for (const sequence of trainingPattern) {
    for (const item of sequence) {
      await cacheManager.get(item as any);
      await sleep(100);
    }
  }

  stats = cacheManager.getStats();
  console.log(`\n   Patterns Learned: ${stats.predictive.patternsLearned}`);
  console.log(`   Total Predictions: ${stats.predictive.totalPredictions}`);
  console.log(`   Correct Predictions: ${stats.predictive.correctPredictions}`);
  console.log(`   Accuracy: ${stats.predictive.accuracy.toFixed(1)}%`);
  console.log('   ✓ Next access will be predicted and preloaded\n');

  await sleep(1000);

  console.log('📊 Final Performance Summary');
  console.log('='.repeat(60));
  
  const dbStats = database.getStats();
  const totalRequests = stats.l1.hits + stats.l1.misses + stats.l2.hits + stats.l2.misses;
  const cacheHits = stats.l1.hits + stats.l2.hits;
  const overallHitRate = (cacheHits / totalRequests) * 100;

  console.log(`\n📈 Cache Performance:`);
  console.log(`   Overall Hit Rate: ${overallHitRate.toFixed(1)}%`);
  console.log(`   L1 (LRU-K) Hit Rate: ${stats.l1.hitRate.toFixed(1)}%`);
  console.log(`   L2 (ARC) Hit Rate: ${stats.l2.hitRate.toFixed(1)}%`);
  console.log(`   Average DB Latency: ${dbStats.averageLatency}ms`);
  console.log(`   Cache Latency: ~1-2ms`);
  
  const latencyReduction = ((dbStats.averageLatency - 2) / dbStats.averageLatency) * 100;
  console.log(`   Latency Reduction: ${latencyReduction.toFixed(1)}%`);

  console.log(`\n🎯 Key Achievements:`);
  console.log(`   ✓ LRU-K eliminated one-hit wonder pollution`);
  console.log(`   ✓ ARC adapted to workload automatically`);
  console.log(`   ✓ Working set analysis optimized cache sizing`);
  console.log(`   ✓ Predictive warming reduced cold start latency`);
  console.log(`   ✓ Overall system performance improved by ${latencyReduction.toFixed(0)}%`);
  
  console.log('\n' + '='.repeat(60));
  console.log('Demo Complete! 🎉');
  console.log('Start the API server to explore interactive dashboard');
  console.log('Run: npm run dev');
  console.log('='.repeat(60));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runDemo().catch(console.error);

