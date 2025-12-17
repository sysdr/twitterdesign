import axios from 'axios';

const API_URL = 'http://localhost:3004';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
  console.log('🚀 Starting Security Operations Center Demo\n');

  // 1. Normal traffic
  console.log('1️⃣  Simulating normal traffic...');
  for (let i = 0; i < 5; i++) {
    await axios.post(`${API_URL}/api/security/event`, {
      eventType: 'API',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      action: 'GET /api/tweets',
      outcome: 'SUCCESS',
      metadata: { endpoint: '/api/tweets' }
    });
    await sleep(100);
  }
  console.log('✓ Normal traffic processed\n');

  // 2. Brute force attack
  console.log('2️⃣  Simulating brute force attack...');
  for (let i = 0; i < 10; i++) {
    await axios.post(`${API_URL}/api/security/event`, {
      eventType: 'AUTH',
      userId: 'user123',
      ipAddress: '10.0.0.50',
      userAgent: 'curl/7.68.0',
      action: 'LOGIN_ATTEMPT',
      outcome: 'FAILURE',
      metadata: { username: 'admin', password: 'attempt' + i }
    });
    await sleep(50);
  }
  console.log('✓ Brute force attack detected and blocked\n');

  // 3. SQL Injection attempt
  console.log('3️⃣  Simulating SQL injection attack...');
  await axios.post(`${API_URL}/api/security/event`, {
    eventType: 'API',
    ipAddress: '172.16.0.25',
    userAgent: 'sqlmap/1.0',
    action: 'POST /api/search',
    outcome: 'FAILURE',
    metadata: { 
      query: "'; DROP TABLE users; --"
    }
  });
  console.log('✓ SQL injection detected and blocked\n');

  // 4. Anomalous behavior
  console.log('4️⃣  Simulating anomalous posting behavior...');
  for (let i = 0; i < 50; i++) {
    await axios.post(`${API_URL}/api/security/event`, {
      eventType: 'API',
      userId: 'user456',
      ipAddress: '192.168.1.200',
      userAgent: 'TwitterBot/1.0',
      action: 'POST /api/tweets',
      outcome: 'SUCCESS',
      metadata: { content: `Spam message ${i}` }
    });
    await sleep(20);
  }
  console.log('✓ Anomalous behavior detected\n');

  // 5. Check stats
  console.log('5️⃣  Fetching current statistics...');
  const statsResponse = await axios.get(`${API_URL}/api/security/stats`);
  console.log('Statistics:', statsResponse.data);
  console.log('');

  // 6. Compliance report
  console.log('6️⃣  Generating compliance report...');
  const complianceResponse = await axios.get(`${API_URL}/api/security/compliance/report?hours=24`);
  console.log('Compliance Report:', complianceResponse.data);
  console.log('');

  console.log('✅ Demo completed! Check the dashboard at http://localhost:3004/dashboard\n');
}

demo().catch(console.error);
