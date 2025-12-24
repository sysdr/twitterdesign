import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/status',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const status = JSON.parse(data);
    console.log('\n📊 Pipeline Status Dashboard');
    console.log('═══════════════════════════════════════');
    console.log(`State: ${status.state}`);
    console.log(`\nMetrics:`);
    console.log(`  Processed: ${status.metrics.processed.toLocaleString()} events`);
    console.log(`  Throughput: ${status.metrics.throughput.toLocaleString()}/sec`);
    console.log(`  Error Rate: ${status.metrics.errorRate}%`);
    console.log(`\nActive Pipelines: ${status.pipelines.length}`);
    status.pipelines.forEach(p => {
      console.log(`  • ${p.name}: ${p.state} (${p.stats.processed} processed)`);
    });
    console.log('═══════════════════════════════════════\n');
  });
});

req.on('error', (error) => {
  console.error('Error connecting to pipeline API:', error.message);
  process.exit(1);
});

req.end();
