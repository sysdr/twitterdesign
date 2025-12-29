import { CodeParser } from '../parsers/codeParser';
import { RunbookGenerator } from '../generators/runbookGenerator';
import { MetricsCalculator } from '../generators/metricsCalculator';
import { ArchitectureDiagramGenerator } from '../generators/architectureDiagramGenerator';

async function generateDocumentation() {
  console.log('\n=== Documentation Generation ===\n');

  // Sample annotated components
  const sampleSources = new Map<string, string>([
    ['TweetFeed.tsx', `
      /**
       * @component TweetFeed
       * @purpose Displays real-time tweet timeline
       * @scalability Handles 1000 concurrent users via caching
       * @dependencies Redis, PostgreSQL
       * @monitoring /metrics/feed-latency
       * @runbook docs/runbooks/tweet-feed-issues.md
       */
    `],
    ['Database.tsx', `
      /**
       * @component Database
       * @purpose PostgreSQL connection pool management
       * @scalability Connection pooling with max 100 connections
       * @dependencies PostgreSQL
       * @monitoring /metrics/db-connections
       * @runbook docs/runbooks/database-issues.md
       */
    `],
    ['Cache.tsx', `
      /**
       * @component Cache
       * @purpose Redis caching layer
       * @scalability 10GB memory, 100k ops/sec
       * @dependencies Redis
       * @monitoring /metrics/cache-hit-rate
       * @runbook docs/runbooks/cache-issues.md
       */
    `]
  ]);

  // Parse components
  console.log('📝 Parsing component annotations...');
  const parser = new CodeParser();
  const components = parser.parseAllComponents(sampleSources);
  console.log(`   Found ${components.length} documented components\n`);

  // Generate runbooks
  console.log('📚 Generating runbooks...');
  const runbookGen = new RunbookGenerator();
  components.forEach(comp => {
    const runbook = runbookGen.generateFromTemplate(
      `${comp.name} performance degradation`,
      comp.name
    );
    runbookGen.addRunbook(runbook);
  });
  console.log(`   Generated ${runbookGen.getAllRunbooks().length} runbooks\n`);

  // Calculate metrics
  console.log('📊 Calculating documentation metrics...');
  const metricsCalc = new MetricsCalculator();
  const metrics = metricsCalc.calculateMetrics(components, runbookGen.getAllRunbooks(), 60);
  console.log(`   Coverage: ${metrics.coverage.toFixed(1)}%`);
  console.log(`   Accuracy: ${metrics.accuracy.toFixed(1)}%`);
  console.log(`   Health Score: ${metricsCalc.generateHealthScore(metrics).toFixed(1)}/100\n`);

  // Generate architecture diagram
  console.log('🎨 Generating architecture diagram...');
  const diagramGen = new ArchitectureDiagramGenerator();
  const nodes = diagramGen.generateNodes(components);
  console.log(`   Created diagram with ${nodes.length} nodes\n`);

  console.log('✅ Documentation generation complete!\n');
}

generateDocumentation().catch(console.error);
