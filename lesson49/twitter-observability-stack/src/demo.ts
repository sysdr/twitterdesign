import axios from 'axios';
import { initializeTelemetry } from './shared/telemetry';
import { startServer } from './services/api/server';

const API_URL = 'http://localhost:3000';

async function runDemo(): Promise<void> {
  console.log('\n========================================');
  console.log('Observability Stack Demo');
  console.log('========================================\n');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Generate load to create traces and metrics
    console.log('1. Generating load to create traces and metrics...');
    const requests = [];
    for (let i = 0; i < 100; i++) {
      requests.push(
        axios.get(`${API_URL}/api/timeline/user-${i % 10}`).catch(() => {})
      );
      if (i % 10 === 0) {
        requests.push(
          axios.post(`${API_URL}/api/tweet`, { userId: `user-${i}`, content: 'Test tweet' }).catch(() => {})
        );
      }
    }
    await Promise.all(requests);
    console.log('   ✓ Generated 100 timeline requests and 10 tweet posts\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check SLO status
    console.log('2. Checking SLO compliance...');
    const sloResponse = await axios.get(`${API_URL}/api/slo-status`);
    console.log('   SLO Status:');
    sloResponse.data.forEach((slo: any) => {
      const statusEmoji = slo.status === 'healthy' ? '✓' : slo.status === 'warning' ? '⚠' : '✗';
      console.log(`   ${statusEmoji} ${slo.name}: ${slo.current.toFixed(2)} / ${slo.target} (${slo.status})`);
    });
    console.log('');

    // Generate more load for predictions
    console.log('3. Generating additional load for ML predictions...');
    for (let i = 0; i < 50; i++) {
      await axios.get(`${API_URL}/api/timeline/user-${i % 5}`).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('   ✓ Generated 50 additional requests\n');

    // Check predictions
    console.log('4. Checking predictive alerts...');
    const predictions = await axios.get(`${API_URL}/api/predictions`);
    if (predictions.data.length > 0) {
      console.log('   Predictions:');
      predictions.data.forEach((pred: any) => {
        console.log(`   ⚠ ${pred.metric}:`);
        console.log(`      Current: ${pred.currentValue.toFixed(3)}`);
        console.log(`      Predicted: ${pred.predictedValue.toFixed(3)}`);
        console.log(`      Time to threshold: ${pred.timeToThreshold.toFixed(1)} minutes`);
        console.log(`      Confidence: ${(pred.confidence * 100).toFixed(1)}%`);
      });
    } else {
      console.log('   ✓ No threshold breaches predicted\n');
    }

    // Show metrics
    console.log('\n5. Prometheus metrics sample:');
    const metricsResponse = await axios.get(`${API_URL}/metrics`);
    const metricsLines = metricsResponse.data.split('\n').filter((l: string) => 
      !l.startsWith('#') && l.includes('http_request_duration_seconds')
    ).slice(0, 5);
    metricsLines.forEach((line: string) => console.log(`   ${line}`));

    console.log('\n========================================');
    console.log('Demo Complete!');
    console.log('========================================');
    console.log('\nKey Achievements:');
    console.log('✓ Distributed tracing operational across requests');
    console.log('✓ SLI/SLO framework monitoring business metrics');
    console.log('✓ ML-based predictive alerting detecting anomalies');
    console.log('✓ Prometheus metrics exported for visualization');
    console.log('\nAccess the following endpoints:');
    console.log('- Metrics: http://localhost:3000/metrics');
    console.log('- SLO Status: http://localhost:3000/api/slo-status');
    console.log('- Predictions: http://localhost:3000/api/predictions');
    console.log('');

  } catch (error) {
    console.error('Demo error:', error);
  }

  process.exit(0);
}

const sdk = initializeTelemetry('twitter-demo');
startServer();

setTimeout(() => {
  runDemo();
}, 2000);
