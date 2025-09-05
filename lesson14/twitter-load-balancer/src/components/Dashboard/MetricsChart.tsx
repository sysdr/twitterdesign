import React, { useState, useEffect } from 'react';
import { RoutingMetrics, Server } from '../../types';

interface Props {
  metrics: RoutingMetrics;
  servers: Server[];
}

interface DataPoint {
  timestamp: string;
  requestsPerSecond: number;
  responseTime: number;
  errorRate: number;
}

export const MetricsChart: React.FC<Props> = ({ metrics, servers }) => {
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);
  
  useEffect(() => {
    const newDataPoint: DataPoint = {
      timestamp: new Date().toLocaleTimeString(),
      requestsPerSecond: metrics.requestsPerSecond,
      responseTime: metrics.averageResponseTime,
      errorRate: metrics.errorRate
    };
    
    setHistoricalData(prev => [...prev.slice(-19), newDataPoint]);
  }, [metrics]);

  return (
    <div className="metrics-chart">
      <h3>Real-time Metrics</h3>
      
      <div className="chart-container">
        <div className="chart">
          <div className="chart-header">Requests per Second</div>
          <div className="chart-content">
            <div className="chart-bars">
              {historicalData.map((point, index) => (
                <div 
                  key={index}
                  className="chart-bar"
                  style={{ 
                    height: `${Math.min((point.requestsPerSecond / 1000) * 100, 100)}%`,
                    backgroundColor: '#3b82f6'
                  }}
                  title={`${point.timestamp}: ${point.requestsPerSecond} req/s`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="server-distribution">
          <h4>Server Load Distribution</h4>
          <div className="distribution-bars">
            {servers.map(server => {
              const load = metrics.serverDistribution[server.id] || 0;
              const maxLoad = Math.max(...Object.values(metrics.serverDistribution));
              const percentage = maxLoad > 0 ? (load / maxLoad) * 100 : 0;
              
              return (
                <div key={server.id} className="distribution-item">
                  <span className="server-label">{server.id}</span>
                  <div className="distribution-bar">
                    <div 
                      className="distribution-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: server.status === 'healthy' ? '#22c55e' : '#ef4444'
                      }}
                    />
                  </div>
                  <span className="load-value">{load}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
