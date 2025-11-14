import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Pause, TrendingUp, Zap, Activity } from 'lucide-react';

interface SystemMetrics {
  timestamp: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  throughput: number;
}

interface Configuration {
  cacheTTL: number;
  batchSize: number;
  workerThreads: number;
}

interface Status {
  isOptimizing: boolean;
  currentConfig: Configuration;
  trialCount: number;
  activeTests: number;
}

const App: React.FC = () => {
  const [status, setStatus] = useState<Status | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [performanceScore, setPerformanceScore] = useState<number>(0);
  const [bestConfig, setBestConfig] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, metricsRes, bestRes] = await Promise.all([
        fetch('http://localhost:3001/api/status'),
        fetch('http://localhost:3001/api/metrics'),
        fetch('http://localhost:3001/api/optimizer/best')
      ]);

      const statusData = await statusRes.json();
      const metricsData = await metricsRes.json();
      const bestData = await bestRes.json();

      setStatus(statusData);
      setMetrics(metricsData.recent || []);
      setPerformanceScore(metricsData.performanceScore || 0);
      setBestConfig(bestData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const toggleOptimization = async () => {
    try {
      const endpoint = status?.isOptimizing ? 'stop-optimization' : 'start-optimization';
      await fetch(`http://localhost:3001/api/${endpoint}`, { method: 'POST' });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle optimization:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const chartData = metrics.slice(-30).map(m => ({
    time: formatTime(m.timestamp),
    P50: m.latencyP50.toFixed(1),
    P95: m.latencyP95.toFixed(1),
    P99: m.latencyP99.toFixed(1)
  }));

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={36} color="#1d9bf0" />
          Statistical Performance Optimizer
        </h1>
        <p style={{ color: '#71767b', fontSize: '16px' }}>
          Automated Bayesian optimization with A/B testing for Twitter system configuration
        </p>
      </header>

      {/* Control Panel */}
      <div style={{ 
        background: '#16181c', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '20px',
        border: '1px solid #2f3336'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Control Panel</h2>
          <button
            onClick={toggleOptimization}
            style={{
              background: status?.isOptimizing ? '#f4212e' : '#1d9bf0',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '20px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {status?.isOptimizing ? <Pause size={18} /> : <Play size={18} />}
            {status?.isOptimizing ? 'Stop Optimization' : 'Start Optimization'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ background: '#1e2732', padding: '15px', borderRadius: '8px' }}>
            <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Status</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: status?.isOptimizing ? '#00ba7c' : '#71767b' }}>
              {status?.isOptimizing ? 'Optimizing' : 'Idle'}
            </div>
          </div>
          
          <div style={{ background: '#1e2732', padding: '15px', borderRadius: '8px' }}>
            <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Trials Completed</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{status?.trialCount || 0} / 30</div>
          </div>
          
          <div style={{ background: '#1e2732', padding: '15px', borderRadius: '8px' }}>
            <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Active A/B Tests</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{status?.activeTests || 0}</div>
          </div>
          
          <div style={{ background: '#1e2732', padding: '15px', borderRadius: '8px' }}>
            <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Performance Score</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00ba7c' }}>
              {performanceScore.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Current Configuration */}
      <div style={{ 
        background: '#16181c', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '20px',
        border: '1px solid #2f3336'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={20} />
          Current Configuration
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Cache TTL</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d9bf0' }}>
              {status?.currentConfig.cacheTTL || 0}s
            </div>
          </div>
          <div>
            <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Batch Size</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d9bf0' }}>
              {status?.currentConfig.batchSize || 0}
            </div>
          </div>
          <div>
            <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Worker Threads</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d9bf0' }}>
              {status?.currentConfig.workerThreads || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Best Configuration Found */}
      {bestConfig && bestConfig.configuration && (
        <div style={{ 
          background: '#16181c', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          border: '1px solid #00ba7c'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', color: '#00ba7c' }}>
            <TrendingUp size={20} />
            Best Configuration Found
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Cache TTL</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ba7c' }}>
                {bestConfig.configuration.cacheTTL}s
              </div>
            </div>
            <div>
              <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Batch Size</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ba7c' }}>
                {bestConfig.configuration.batchSize}
              </div>
            </div>
            <div>
              <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Worker Threads</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ba7c' }}>
                {bestConfig.configuration.workerThreads}
              </div>
            </div>
            <div>
              <div style={{ color: '#71767b', fontSize: '13px', marginBottom: '5px' }}>Performance Score</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ba7c' }}>
                {bestConfig.performance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latency Chart */}
      <div style={{ 
        background: '#16181c', 
        padding: '20px', 
        borderRadius: '12px',
        border: '1px solid #2f3336'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
          Latency Performance (Last 30 minutes)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2f3336" />
            <XAxis 
              dataKey="time" 
              stroke="#71767b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#71767b"
              style={{ fontSize: '12px' }}
              label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#71767b' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#16181c', 
                border: '1px solid #2f3336',
                borderRadius: '8px',
                color: '#e7e9ea'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="P50" stroke="#1d9bf0" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="P95" stroke="#f91880" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="P99" stroke="#ffad1f" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <footer style={{ marginTop: '30px', textAlign: 'center', color: '#71767b', fontSize: '14px' }}>
        <p>Statistical Performance Optimization - Lesson 38</p>
        <p>Bayesian optimization with A/B testing framework</p>
      </footer>
    </div>
  );
};

export default App;
