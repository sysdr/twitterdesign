import React from 'react';
import { RegionalPerformance } from '../../types';

interface Props {
  regionalPerformance: RegionalPerformance[];
  isTestRunning: boolean;
}

export const RegionalMetrics: React.FC<Props> = ({ regionalPerformance, isTestRunning }) => {
  const getLatencyColor = (latency: number): string => {
    if (latency < 100) return '#28a745';
    if (latency < 300) return '#ffc107';
    return '#dc3545';
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate > 99) return '#28a745';
    if (rate > 95) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3>Regional Performance Metrics</h3>
      
      {!isTestRunning && regionalPerformance.length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          Start a load test to see performance metrics
        </p>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
        {regionalPerformance.map(performance => (
          <div
            key={performance.region}
            style={{
              border: '1px solid #e1e8ed',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: '#f8f9fa'
            }}
          >
            <h4 style={{ margin: '0 0 10px 0', color: '#14171a' }}>
              {performance.region.toUpperCase()}
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Avg Latency:</span>
                <span style={{ color: getLatencyColor(performance.averageLatency), fontWeight: 'bold' }}>
                  {performance.averageLatency}ms
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>P95 Latency:</span>
                <span style={{ color: getLatencyColor(performance.p95Latency), fontWeight: 'bold' }}>
                  {performance.p95Latency}ms
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Success Rate:</span>
                <span style={{ color: getSuccessRateColor(performance.successRate), fontWeight: 'bold' }}>
                  {performance.successRate}%
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Throughput:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {performance.throughput} req/min
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
