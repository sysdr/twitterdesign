import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadTestMetrics } from '../types';

interface LoadTestDashboardProps {}

const LoadTestDashboard: React.FC<LoadTestDashboardProps> = () => {
  const [metrics, setMetrics] = useState<LoadTestMetrics[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [targetUsers, setTargetUsers] = useState(1000);
  const [duration, setDuration] = useState(300);

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      if (isRunning) {
        const newMetric: LoadTestMetrics = {
          timestamp: Date.now(),
          concurrent_users: Math.min(targetUsers, metrics.length * 10),
          requests_per_second: 50 + Math.random() * 100,
          avg_response_time: 80 + Math.random() * 120,
          p95_response_time: 150 + Math.random() * 100,
          p99_response_time: 200 + Math.random() * 200,
          error_rate: Math.random() * 0.02,
          cpu_usage: 0.3 + Math.random() * 0.4,
          memory_usage: 0.4 + Math.random() * 0.3,
          db_connections: 20 + Math.random() * 25
        };
        
        setMetrics(prev => [...prev.slice(-49), newMetric]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, targetUsers, metrics.length]);

  const startLoadTest = async () => {
    setIsRunning(true);
    setMetrics([]);
    
    try {
      const response = await fetch('/api/load-test/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsers, duration })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start load test');
      }
    } catch (error) {
      console.error('Load test start error:', error);
    }
  };

  const stopLoadTest = async () => {
    setIsRunning(false);
    
    try {
      await fetch('/api/load-test/stop', { method: 'POST' });
    } catch (error) {
      console.error('Load test stop error:', error);
    }
  };

  const latestMetrics = metrics[metrics.length - 1];

  return (
    <div className="load-test-dashboard">
      <div className="dashboard-controls">
        <div className="control-group">
          <label>Target Users:</label>
          <input 
            type="number" 
            value={targetUsers} 
            onChange={(e) => setTargetUsers(Number(e.target.value))}
            disabled={isRunning}
          />
        </div>
        <div className="control-group">
          <label>Duration (seconds):</label>
          <input 
            type="number" 
            value={duration} 
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={isRunning}
          />
        </div>
        <div className="control-actions">
          {!isRunning ? (
            <button className="start-btn" onClick={startLoadTest}>
              Start Load Test
            </button>
          ) : (
            <button className="stop-btn" onClick={stopLoadTest}>
              Stop Load Test
            </button>
          )}
        </div>
      </div>

      {latestMetrics && (
        <div className="metrics-summary">
          <div className="metric-card">
            <h3>Concurrent Users</h3>
            <div className="metric-value">{latestMetrics.concurrent_users}</div>
          </div>
          <div className="metric-card">
            <h3>Requests/sec</h3>
            <div className="metric-value">{latestMetrics.requests_per_second.toFixed(1)}</div>
          </div>
          <div className="metric-card">
            <h3>Avg Response</h3>
            <div className="metric-value">{latestMetrics.avg_response_time.toFixed(0)}ms</div>
          </div>
          <div className="metric-card">
            <h3>P95 Response</h3>
            <div className="metric-value">{latestMetrics.p95_response_time.toFixed(0)}ms</div>
          </div>
          <div className="metric-card">
            <h3>Error Rate</h3>
            <div className="metric-value">{(latestMetrics.error_rate * 100).toFixed(2)}%</div>
          </div>
        </div>
      )}

      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Response Time Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
              <YAxis />
              <Tooltip labelFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
              <Legend />
              <Line type="monotone" dataKey="avg_response_time" stroke="#8884d8" name="Average" />
              <Line type="monotone" dataKey="p95_response_time" stroke="#82ca9d" name="P95" />
              <Line type="monotone" dataKey="p99_response_time" stroke="#ffc658" name="P99" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>System Resource Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
              <YAxis />
              <Tooltip labelFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
              <Legend />
              <Line type="monotone" dataKey="cpu_usage" stroke="#ff7300" name="CPU %" />
              <Line type="monotone" dataKey="memory_usage" stroke="#00ff00" name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LoadTestDashboard;
