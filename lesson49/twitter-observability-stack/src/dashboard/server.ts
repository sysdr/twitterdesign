import express from 'express';
import path from 'path';
import axios from 'axios';

const app = express();
const PORT = process.env.DASHBOARD_PORT || 8080;
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Serve static files from public directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use(express.json());

// API proxy endpoints to fetch data from the main API
app.get('/api/dashboard/slo-status', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/slo-status`);
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/predictions', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/predictions`);
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/metrics`);
    res.set('Content-Type', 'text/plain');
    res.send(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/health', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Serve dashboard HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export function startDashboardServer(): void {
  app.listen(PORT, () => {
    console.log(`Dashboard server running on http://localhost:${PORT}`);
  });
}

