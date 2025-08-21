import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    errors: ['rate<0.1'],             // Error rate under 10%
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function() {
  // Test health endpoint
  let response = http.get(`${BASE_URL}/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // Test public tweets endpoint
  response = http.get(`${BASE_URL}/v1/tweets`);
  check(response, {
    'tweets fetch status is 200': (r) => r.status === 200,
    'response has data': (r) => JSON.parse(r.body).data !== undefined,
    'rate limit headers present': (r) => r.headers['X-Ratelimit-Limit'] !== undefined,
  }) || errorRate.add(1);

  // Test API info
  response = http.get(`${BASE_URL}/info`);
  check(response, {
    'info status is 200': (r) => r.status === 200,
    'info has versions': (r) => JSON.parse(r.body).versions.length > 0,
  }) || errorRate.add(1);

  // Test v2 tweets endpoint
  response = http.get(`${BASE_URL}/v2/tweets`);
  check(response, {
    'v2 tweets status is 200': (r) => r.status === 200,
    'v2 API version header correct': (r) => r.headers['X-Api-Version'] === 'v2',
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
Load Test Summary:
==================
Requests: ${data.metrics.http_reqs.values.count}
Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms avg
95th percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
    `,
  };
}
