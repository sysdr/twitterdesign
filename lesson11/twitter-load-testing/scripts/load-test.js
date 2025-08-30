const autocannon = require('autocannon');

async function runLoadTest() {
  console.log('🚀 Starting Twitter MVP Load Test...');
  
  const result = await autocannon({
    url: 'http://localhost:8000',
    connections: 100,
    pipelining: 10,
    duration: 30,
    requests: [
      {
        method: 'POST',
        path: '/api/auth/login',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'testpass' })
      },
      {
        method: 'GET',
        path: '/api/timeline',
        headers: { 'authorization': 'Bearer fake-token' }
      },
      {
        method: 'POST',
        path: '/api/tweets',
        headers: { 
          'content-type': 'application/json',
          'authorization': 'Bearer fake-token'
        },
        body: JSON.stringify({ content: 'Load test tweet' })
      }
    ]
  });

  console.log('📊 Load Test Results:');
  console.log(`Requests/sec: ${result.requests.average}`);
  console.log(`Latency (avg): ${result.latency.average}ms`);
  console.log(`Latency (p95): ${result.latency.p95}ms`);
  console.log(`Latency (p99): ${result.latency.p99}ms`);
  console.log(`Errors: ${result.non2xx}`);
}

runLoadTest().catch(console.error);
