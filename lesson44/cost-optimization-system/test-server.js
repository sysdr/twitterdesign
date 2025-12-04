// Quick test to verify server can start and send metrics
const http = require('http');

console.log('Testing server health endpoint...');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✓ Server is running');
      console.log('  Status:', json.status);
      console.log('  Timestamp:', json.timestamp);
      process.exit(0);
    } catch (e) {
      console.log('✗ Invalid response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.log('✗ Server not running or not accessible');
  console.log('  Error:', e.message);
  console.log('');
  console.log('Start the server with: node server/index.js');
  process.exit(1);
});

req.setTimeout(2000, () => {
  req.destroy();
  console.log('✗ Connection timeout');
  process.exit(1);
});

req.end();


