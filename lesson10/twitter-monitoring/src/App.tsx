import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './App.css';

interface Metrics {
  timestamp: number;
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
  latency: number;
}

interface AlertStatus {
  name: string;
  status: 'firing' | 'resolved';
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [alerts, setAlerts] = useState<AlertStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        setMetrics(prev => [...prev.slice(-19), data].slice(-20));
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setIsConnected(false);
      }
    };

    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts');
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };

    const interval = setInterval(() => {
      fetchMetrics();
      fetchAlerts();
    }, 2000);

    fetchMetrics();
    fetchAlerts();

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4757';
      case 'warning': return '#ffa502';
      default: return '#3742fa';
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🐦 Twitter Clone Monitoring Dashboard</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="metric-card">
          <h3>📊 System Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} />
              <YAxis />
              <Tooltip labelFormatter={formatTime} />
              <Line type="monotone" dataKey="cpu" stroke="#3742fa" name="CPU %" />
              <Line type="monotone" dataKey="memory" stroke="#ff4757" name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="metric-card">
          <h3>🚀 Request Metrics</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} />
              <YAxis />
              <Tooltip labelFormatter={formatTime} />
              <Bar dataKey="requests" fill="#1dd1a1" name="Requests/sec" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="metric-card">
          <h3>⚡ Response Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} />
              <YAxis />
              <Tooltip labelFormatter={formatTime} />
              <Line type="monotone" dataKey="latency" stroke="#ffa502" name="Latency (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="metric-card alerts-card">
          <h3>🚨 Active Alerts</h3>
          <div className="alerts-container">
            {alerts.length === 0 ? (
              <div className="no-alerts">✅ All systems normal</div>
            ) : (
              alerts.map((alert, index) => (
                <div 
                  key={index} 
                  className="alert-item"
                  style={{ borderLeft: `4px solid ${getAlertColor(alert.severity)}` }}
                >
                  <div className="alert-header">
                    <span className="alert-name">{alert.name}</span>
                    <span className={`alert-status ${alert.status}`}>{alert.status.toUpperCase()}</span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="metric-card summary-card">
          <h3>📈 Live Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{metrics.length > 0 ? metrics[metrics.length - 1].requests : 0}</div>
              <div className="stat-label">Requests/sec</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{metrics.length > 0 ? metrics[metrics.length - 1].latency : 0}ms</div>
              <div className="stat-label">Avg Latency</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{metrics.length > 0 ? metrics[metrics.length - 1].errors : 0}</div>
              <div className="stat-label">Error Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
          </div>
        </div>

        <div className="metric-card trace-card">
          <h3>🔍 Recent Traces</h3>
          <div className="trace-list">
            <div className="trace-item">
              <span className="trace-id">#trace-001</span>
              <span className="trace-service">Tweet Service</span>
              <span className="trace-duration">125ms</span>
            </div>
            <div className="trace-item">
              <span className="trace-id">#trace-002</span>
              <span className="trace-service">Media Upload</span>
              <span className="trace-duration">245ms</span>
            </div>
            <div className="trace-item">
              <span className="trace-id">#trace-003</span>
              <span className="trace-service">Timeline Gen</span>
              <span className="trace-duration">89ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
