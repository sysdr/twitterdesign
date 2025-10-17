import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, TrendingUp, Users, Zap } from 'lucide-react';

interface Metrics {
  trending: Array<{ hashtag: string; count: number; windowStart: number }>;
  engagement: Array<{ likes: number; retweets: number; replies: number; windowStart: number }>;
  userActivity: Array<{ userId: string; score: number; actions: number }>;
  stats: {
    recordsProcessed: number;
    eventsPerSecond: number;
    latencyP99: number;
    activeWindows: number;
  };
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    trending: [],
    engagement: [],
    userActivity: [],
    stats: { recordsProcessed: 0, eventsPerSecond: 0, latencyP99: 0, activeWindows: 0 }
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    
    ws.onopen = () => {
      setConnected(true);
      console.log('Connected to metrics server');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'update' || message.type === 'init') {
        setMetrics(message.data);
      }
    };

    ws.onerror = () => setConnected(false);
    ws.onclose = () => setConnected(false);

    return () => ws.close();
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>
          <span className={`status-indicator ${connected ? '' : 'disconnected'}`}></span>
          Stream Processing Dashboard
        </h1>
        <p>Real-time analytics processing 1M+ events/second</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3><Activity size={16} /> Records Processed</h3>
          <div className="value">{formatNumber(metrics.stats.recordsProcessed)}</div>
          <div className="label">Total events</div>
        </div>

        <div className="stat-card">
          <h3><Zap size={16} /> Throughput</h3>
          <div className="value">{formatNumber(metrics.stats.eventsPerSecond)}</div>
          <div className="label">events/second</div>
        </div>

        <div className="stat-card">
          <h3><TrendingUp size={16} /> Latency P99</h3>
          <div className="value">{metrics.stats.latencyP99}ms</div>
          <div className="label">99th percentile</div>
        </div>

        <div className="stat-card">
          <h3><Users size={16} /> Active Windows</h3>
          <div className="value">{metrics.stats.activeWindows}</div>
          <div className="label">Time windows</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Engagement Metrics (5-second windows)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.engagement.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="windowStart" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="likes" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="retweets" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="replies" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Trending Hashtags</h3>
          <ul className="trending-list">
            {metrics.trending.slice(0, 10).map((item, i) => (
              <li key={i} className="trending-item">
                <span className="hashtag">{item.hashtag}</span>
                <span className="count">{formatNumber(item.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="chart-card">
        <h3>Top User Activity Scores</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.userActivity.slice(-15)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="userId" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#8b5cf6" />
            <Bar dataKey="actions" fill="#ec4899" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
