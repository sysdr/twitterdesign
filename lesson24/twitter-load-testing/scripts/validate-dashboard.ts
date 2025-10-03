import { LoadGeneratorService } from '../src/services/LoadGeneratorService';
import { FailoverService } from '../src/services/FailoverService';
import { MetricsService } from '../src/services/MetricsService';
import { LoadTestConfig } from '../src/types';

async function validateDashboard() {
  console.log('🔍 Validating Multi-Region Load Testing Dashboard...\n');

  // Initialize services
  const loadGenerator = new LoadGeneratorService();
  const failoverService = new FailoverService();
  const metricsService = new MetricsService();

  const regions = failoverService.getRegions();
  console.log(`✅ Initialized ${regions.length} regions`);

  // Configure load test
  const config: LoadTestConfig = {
    duration: 10, // 10 seconds for validation
    concurrentUsers: 50,
    rampUpTime: 2,
    regions: regions.map(r => r.id),
    scenarios: [
      {
        id: 'timeline',
        name: 'Timeline Loading',
        actions: [
          { type: 'get', endpoint: '/api/timeline', expectedStatus: 200 }
        ],
        weight: 0.4
      },
      {
        id: 'posting',
        name: 'Tweet Posting',
        actions: [
          { type: 'post', endpoint: '/api/tweets', payload: { content: 'Test tweet' }, expectedStatus: 201 }
        ],
        weight: 0.3
      }
    ]
  };

  console.log('🚀 Starting load test across all regions...\n');

  // Start tests in all regions
  const promises = regions.map(region => 
    loadGenerator.startRegionalTest(region, config)
  );

  // Wait for tests to complete
  await Promise.all(promises);

  console.log('✅ Load test completed\n');

  // Collect and validate metrics
  const metrics = loadGenerator.getMetrics();
  metricsService.addMetrics(metrics);
  const regionalPerformance = metricsService.getRegionalPerformance();

  console.log('📊 Dashboard Metrics Validation:\n');

  let hasErrors = false;

  regionalPerformance.forEach(perf => {
    console.log(`Region: ${perf.region.toUpperCase()}`);
    console.log(`  Average Latency: ${perf.averageLatency}ms`);
    console.log(`  P95 Latency: ${perf.p95Latency}ms`);
    console.log(`  P99 Latency: ${perf.p99Latency}ms`);
    console.log(`  Success Rate: ${perf.successRate}%`);
    console.log(`  Throughput: ${perf.throughput} req/min`);
    console.log();

    // Validate non-zero metrics
    if (perf.averageLatency === 0) {
      console.error(`❌ ERROR: ${perf.region} has zero average latency`);
      hasErrors = true;
    }
    if (perf.successRate === 0) {
      console.error(`❌ ERROR: ${perf.region} has zero success rate`);
      hasErrors = true;
    }
    if (perf.throughput === 0) {
      console.error(`❌ ERROR: ${perf.region} has zero throughput`);
      hasErrors = true;
    }
  });

  console.log('📈 Total Metrics Collected:', metrics.length);
  console.log();

  // Validate failover functionality
  console.log('🔄 Testing Failover Functionality...\n');
  
  const testRegion = regions[0];
  console.log(`Testing failure simulation for: ${testRegion.name}`);
  
  await failoverService.simulateRegionalFailure(testRegion.id);
  
  const updatedRegions = failoverService.getRegions();
  const failedRegion = updatedRegions.find(r => r.id === testRegion.id);
  
  if (failedRegion?.status === 'offline') {
    console.log('✅ Failover simulation working correctly');
  } else {
    console.error('❌ ERROR: Failover simulation failed');
    hasErrors = true;
  }

  console.log();

  if (!hasErrors && metrics.length > 0 && regionalPerformance.length > 0) {
    console.log('✅ Dashboard Validation PASSED');
    console.log('All metrics are non-zero and updating correctly');
    process.exit(0);
  } else {
    console.error('❌ Dashboard Validation FAILED');
    if (metrics.length === 0) {
      console.error('No metrics collected');
    }
    if (regionalPerformance.length === 0) {
      console.error('No regional performance data');
    }
    process.exit(1);
  }
}

validateDashboard().catch(error => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});

