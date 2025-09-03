const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const regions = [
  {
    id: 'us-east',
    name: 'US East (Virginia)',
    status: 'healthy',
    latency: Math.floor(Math.random() * 50) + 20,
    activeUsers: Math.floor(Math.random() * 5000) + 1000,
    capacity: 10000
  },
  {
    id: 'eu-central',
    name: 'EU Central (Frankfurt)',
    status: 'healthy',
    latency: Math.floor(Math.random() * 50) + 20,
    activeUsers: Math.floor(Math.random() * 4000) + 800,
    capacity: 8000
  },
  {
    id: 'asia-pacific',
    name: 'Asia Pacific (Singapore)',
    status: 'healthy',
    latency: Math.floor(Math.random() * 50) + 20,
    activeUsers: Math.floor(Math.random() * 3000) + 600,
    capacity: 6000
  }
];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/regions', (req, res) => {
  regions.forEach(region => {
    region.latency = Math.floor(Math.random() * 50) + 20;
    region.activeUsers = Math.floor(Math.random() * (region.capacity * 0.8)) + (region.capacity * 0.2);
  });
  res.json(regions);
});

app.get('/api/cdn-stats', (req, res) => {
  const stats = {};
  regions.forEach(region => {
    stats[region.id] = {
      size: Math.floor(Math.random() * 1000) + 100,
      hitRate: Math.random() * 0.3 + 0.7
    };
  });
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
