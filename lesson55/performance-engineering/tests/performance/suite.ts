import { MetricsCollector } from '../../src/collectors/MetricsCollector';
import { PerformanceAnalyzer } from '../../src/analyzers/PerformanceAnalyzer';
import { TestOrchestrator } from '../../src/orchestrator/TestOrchestrator';

async function runPerformanceTests() {
  console.log('Starting Performance Test Suite\n');

  const collector = new MetricsCollector();
  const analyzer = new PerformanceAnalyzer(collector);
  const orchestrator = new TestOrchestrator(collector, analyzer);

  // Test 1: Smoke Test
  console.log('Test 1: Smoke Test (100 users, 60s)');
  const smokeResult = await orchestrator.runTest({
    name: 'Smoke Test',
    concurrentUsers: 100,
    duration: 60,
    endpoints: ['api.tweet.create', 'api.timeline.fetch'],
    rampUp: 10
  });

  console.log(`\nSmoke Test Complete:`);
  console.log(`  Budget Compliant: ${smokeResult.budgetCompliance ? 'YES ✓' : 'NO ✗'}`);
  console.log(`  P95 Latency: ${smokeResult.p95}ms (budget: 50ms)`);

  // Short pause
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 2: Load Test
  console.log('\n\nTest 2: Load Test (500 users, 120s)');
  const loadResult = await orchestrator.runTest({
    name: 'Load Test',
    concurrentUsers: 500,
    duration: 120,
    endpoints: ['api.tweet.create', 'api.timeline.fetch', 'db.query.user'],
    rampUp: 30
  });

  console.log(`\nLoad Test Complete:`);
  console.log(`  Budget Compliant: ${loadResult.budgetCompliance ? 'YES ✓' : 'NO ✗'}`);
  console.log(`  P95 Latency: ${loadResult.p95}ms (budget: 50ms)`);
  console.log(`  Throughput: ${loadResult.throughput.toFixed(1)} req/s`);

  // Analyze bottlenecks
  const metrics = collector.getRecentMetrics();
  const bottlenecks = analyzer.analyzeBottlenecks(metrics);

  console.log('\n\nBottleneck Analysis:');
  bottlenecks.forEach((b, i) => {
    console.log(`\n${i + 1}. ${b.component} (${b.percentage.toFixed(1)}% of total latency)`);
    console.log(`   Average Latency: ${b.latency.toFixed(2)}ms`);
    if (b.suggestions.length > 0) {
      console.log('   Suggestions:');
      b.suggestions.forEach(s => console.log(`     - ${s}`));
    }
  });

  console.log('\n\n✅ Performance Test Suite Complete');
  process.exit(0);
}

runPerformanceTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
