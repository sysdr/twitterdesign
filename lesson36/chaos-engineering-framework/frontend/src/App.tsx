import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { MetricsChart } from './components/MetricsChart';
import { SystemHealth } from './components/SystemHealth';
import { ExperimentControls } from './components/ExperimentControls';
import { useWebSocket } from './hooks/useWebSocket';
import { ExperimentMetrics } from './types/chaos';

function App() {
  const { data, connected } = useWebSocket('ws://localhost:3001');
  const [metricsHistory, setMetricsHistory] = useState<Array<ExperimentMetrics & { timestamp: number }>>([]);

  useEffect(() => {
    if (data?.metrics) {
      setMetricsHistory(prev => [
        ...prev,
        { ...data.metrics, timestamp: Date.now() }
      ].slice(-100));
    }
  }, [data]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #10b981 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <Activity size={32} color="#667eea" />
            <h1 style={{ margin: 0, color: '#1f2937' }}>
              Chaos Engineering Dashboard
            </h1>
          </div>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Systematic failure injection and resilience testing for production systems
          </p>
          
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            background: connected ? '#d1fae5' : '#fee2e2',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            <strong>{connected ? '🟢 Connected' : '🔴 Disconnected'}</strong>
          </div>
        </div>

        {/* System Health Score */}
        {data?.health && (
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>Overall System Health</h2>
            <div style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: data.health.overall > 80 ? '#22c55e' : data.health.overall > 50 ? '#f59e0b' : '#ef4444',
              textAlign: 'center'
            }}>
              {data.health.overall.toFixed(0)}%
            </div>
            
            <SystemHealth health={data.health} />
          </div>
        )}

        {/* Metrics Chart */}
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0 }}>Real-time Metrics</h2>
          {data?.metrics && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {data.metrics.errorRate.toFixed(2)}%
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Error Rate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {data.metrics.latencyP95}ms
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>P95 Latency</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {data.metrics.latencyP99}ms
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>P99 Latency</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {data.metrics.requestCount}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Requests</div>
              </div>
            </div>
          )}
          <MetricsChart history={metricsHistory} />
        </div>

        {/* Experiment Controls */}
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <ExperimentControls activeExperiments={data?.activeExperiments || []} />
        </div>
      </div>
    </div>
  );
}

export default App;
