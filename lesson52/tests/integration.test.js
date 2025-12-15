const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

describe('DR Automation Integration Tests', () => {
  test('Health check returns system status', async () => {
    const response = await axios.get(`${API_URL}/health`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('state');
    expect(response.data).toHaveProperty('primary');
    expect(response.data).toHaveProperty('standby');
  });

  test('Full backup completes successfully', async () => {
    const response = await axios.post(`${API_URL}/backup/full`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('type', 'full');
    expect(response.data).toHaveProperty('checksum');
  });

  test('Failover status is accessible', async () => {
    const response = await axios.get(`${API_URL}/failover/status`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('state');
    expect(response.data).toHaveProperty('currentPrimary');
  });

  test('DR test can be initiated', async () => {
    const response = await axios.post(`${API_URL}/dr-test/run`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('testId');
  });

  test('Backup stats are accurate', async () => {
    const response = await axios.get(`${API_URL}/backup/stats`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('totalBackups');
    expect(response.data).toHaveProperty('successRate');
  });
});
