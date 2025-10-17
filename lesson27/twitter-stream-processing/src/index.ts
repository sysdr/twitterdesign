import { TrendingHashtagsProcessor } from './processors/TrendingHashtagsProcessor';
import { EngagementAnalyticsProcessor } from './processors/EngagementAnalyticsProcessor';
import { UserActivityProcessor } from './processors/UserActivityProcessor';
import { MetricsServer } from './utils/MetricsServer';
import { DataGenerator } from './utils/DataGenerator';

async function main() {
  console.log('Starting Twitter Stream Processing System...\n');

  // Start metrics server
  const metricsServer = new MetricsServer();
  await metricsServer.start();

  // Start data generator
  const dataGenerator = new DataGenerator();
  await dataGenerator.start();

  // Start stream processors
  const processors = [
    new TrendingHashtagsProcessor(),
    new EngagementAnalyticsProcessor(),
    new UserActivityProcessor()
  ];

  await Promise.all(processors.map(p => p.start()));

  console.log('\n✓ All processors started successfully');
  console.log('✓ Dashboard available at http://localhost:3000');
  console.log('✓ API available at http://localhost:4000');
  console.log('\nPress Ctrl+C to stop\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await Promise.all(processors.map(p => p.stop()));
    await dataGenerator.stop();
    await metricsServer.stop();
    process.exit(0);
  });
}

main().catch(console.error);
