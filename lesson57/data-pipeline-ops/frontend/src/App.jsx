import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MetricCard from './components/MetricCard';
import PipelineCard from './components/PipelineCard';

function App() {
  const [metrics, setMetrics] = useState({
    throughput: 0,
    errorRate: 0,
    dataQuality: 100,
    eventsProcessed: 0,
    latency: { p50: 0, p95: 0, p99: 0 },
    validationStats: {},
    recoveryStats: {},
    storageStats: {}
  });
  
  const [pipelines, setPipelines] = useState([]);
  const [connected, setConnected] = useState(false);
  const [throughputHistory, setThroughputHistory] = useState([]);

  useEffect(() => {
    // Fetch initial pipeline data
    fetch('http://localhost:3001/pipelines')
      .then(res => res.json())
      .then(data => setPipelines(data))
      .catch(err => console.error('Error fetching pipelines:', err));

    // WebSocket for real-time metrics
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onopen = () => {
      console.log('Connected to pipeline metrics');
      setConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(data);
      
      // Update throughput history for chart
      setThroughputHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString(),
          throughput: data.throughput,
          errorRate: parseFloat(data.errorRate)
        }];
        return newHistory.slice(-30); // Keep last 30 data points
      });
    };
    
    ws.onerror = () => setConnected(false);
    ws.onclose = () => setConnected(false);
    
    return () => ws.close();
  }, []);

  return (
    <div className="app">
      <div className="header">
        <h1>🚀 Data Pipeline Operations</h1>
        <p>Real-time monitoring of Twitter-scale data processing</p>
      </div>

      <div className="dashboard">
        <MetricCard
          title="Throughput"
          value={metrics.throughput.toLocaleString()}
          unit="events/sec"
        />
        
        <MetricCard
          title="Error Rate"
          value={metrics.errorRate}
          unit="%"
          alert={parseFloat(metrics.errorRate) > 1}
        />
        
        <MetricCard
          title="Data Quality"
          value={metrics.dataQuality.toFixed(1)}
          unit="%"
        />
        
        <MetricCard
          title="Events Processed"
          value={metrics.eventsProcessed.toLocaleString()}
          unit="total"
        />
        
        <MetricCard
          title="P95 Latency"
          value={metrics.latency.p95}
          unit="ms"
        />
        
        <MetricCard
          title="Recovery Rate"
          value={metrics.recoveryStats.recoveryRate || '100'}
          unit="%"
        />
      </div>

      <div className="chart-card">
        <h3 style={{marginBottom: '20px'}}>Throughput & Error Rate Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={throughputHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="throughput" 
              stroke="#667eea" 
              strokeWidth={2}
              name="Throughput (events/sec)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="errorRate" 
              stroke="#dc3545" 
              strokeWidth={2}
              name="Error Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3 style={{marginBottom: '20px'}}>Active Pipelines</h3>
        <div className="pipelines-grid">
          {pipelines.map(pipeline => (
            <PipelineCard key={pipeline.name} pipeline={pipeline} />
          ))}
        </div>
      </div>

      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <span style={{marginRight: '8px'}}>{connected ? '🟢' : '🔴'}</span>
        {connected ? 'Live Data' : 'Disconnected'}
      </div>
    </div>
  );
}

export default App;
