import React, { useState, useEffect, useCallback } from 'react';
import { ConnectionPoolService } from '../../services/ConnectionPoolService';
import { PoolMetrics, ConnectionPoolConfig } from '../../types';

interface Props {
  onMetricsUpdate: (metrics: PoolMetrics) => void;
}

export const PoolManager: React.FC<Props> = ({ onMetricsUpdate }) => {
  const [service] = useState(() => new ConnectionPoolService({
    minConnections: 5,
    maxConnections: 100,
    currentConnections: 20,
    acquireTimeout: 5000,
    idleTimeout: 30000
  }));
  
  const [config, setConfig] = useState<ConnectionPoolConfig>({
    minConnections: 5,
    maxConnections: 100,
    currentConnections: 20,
    acquireTimeout: 5000,
    idleTimeout: 30000
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [qps, setQps] = useState(100);
  const [lastMetrics, setLastMetrics] = useState<PoolMetrics | null>(null);
  
  // Generate load
  useEffect(() => {
    if (!isRunning) return;
    
    const intervalMs = 1000 / qps;
    const interval = setInterval(() => {
      service.simulateQuery();
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [isRunning, qps, service]);
  
  // Collect metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = service.getMetrics();
      setLastMetrics(metrics);
      onMetricsUpdate(metrics);
    }, 500);
    
    return () => clearInterval(interval);
  }, [service, onMetricsUpdate]);
  
  const handleConfigChange = useCallback((key: keyof ConnectionPoolConfig, value: number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    service.updateConfig(newConfig);
  }, [config, service]);
  
  const recommendations = service.getRecommendations();
  
  return (
    <div style={{
      padding: '20px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1a1a2e' }}>Connection Pool Manager</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Controls */}
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Pool Size: {config.currentConnections}
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={config.currentConnections}
              onChange={(e) => handleConfigChange('currentConnections', parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Load (QPS): {qps}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              value={qps}
              onChange={(e) => setQps(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              padding: '10px 20px',
              background: isRunning ? '#ef4444' : '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {isRunning ? 'Stop Load' : 'Start Load'}
          </button>
        </div>
        
        {/* Metrics */}
        {lastMetrics && (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '10px',
              fontSize: '14px'
            }}>
              <div style={{ padding: '10px', background: '#f0f9ff', borderRadius: '8px' }}>
                <div style={{ color: '#6b7280' }}>Utilization</div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: '700',
                  color: lastMetrics.utilization > 0.8 ? '#ef4444' : 
                         lastMetrics.utilization > 0.5 ? '#f59e0b' : '#22c55e'
                }}>
                  {(lastMetrics.utilization * 100).toFixed(1)}%
                </div>
              </div>
              
              <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ color: '#6b7280' }}>P99 Latency</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#166534' }}>
                  {lastMetrics.p99Latency.toFixed(1)}ms
                </div>
              </div>
              
              <div style={{ padding: '10px', background: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ color: '#6b7280' }}>Queue Prob</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#92400e' }}>
                  {(lastMetrics.queueProbability * 100).toFixed(1)}%
                </div>
              </div>
              
              <div style={{ padding: '10px', background: '#ede9fe', borderRadius: '8px' }}>
                <div style={{ color: '#6b7280' }}>Recommended</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#5b21b6' }}>
                  {lastMetrics.recommendedPoolSize}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Optimization Recommendations</h4>
          {recommendations.map((rec, i) => (
            <div key={i} style={{
              padding: '12px',
              background: rec.priority === 'high' ? '#fef2f2' : '#fffbeb',
              borderRadius: '8px',
              marginBottom: '8px',
              borderLeft: `4px solid ${rec.priority === 'high' ? '#ef4444' : '#f59e0b'}`
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {rec.type === 'pool_size' ? 'Pool Size' : 'Timeout'}: {rec.currentValue} → {rec.recommendedValue}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{rec.reasoning}</div>
              <div style={{ fontSize: '13px', color: '#059669', marginTop: '4px' }}>
                Expected: {rec.expectedImprovement}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
