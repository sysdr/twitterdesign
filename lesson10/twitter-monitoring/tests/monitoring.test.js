const axios = require('axios');

describe('Monitoring Stack Tests', () => {
  const baseUrl = 'http://localhost:3001';
  
  test('Metrics endpoint returns data', async () => {
    const response = await axios.get(`${baseUrl}/api/metrics`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('timestamp');
    expect(response.data).toHaveProperty('cpu');
    expect(response.data).toHaveProperty('memory');
  });

  test('Prometheus metrics endpoint works', async () => {
    const response = await axios.get(`${baseUrl}/metrics`);
    expect(response.status).toBe(200);
    expect(response.data).toContain('twitter_http_requests_total');
  });

  test('Health check passes', async () => {
    const response = await axios.get(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('healthy');
  });
});
