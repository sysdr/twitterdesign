import React from 'react';
import { Server } from '../../types';

interface Props {
  server: Server;
  currentLoad: number;
}

export const ServerCard: React.FC<Props> = ({ server, currentLoad }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'unhealthy': return '#ef4444';
      case 'recovering': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getLoadPercentage = (): number => {
    return Math.min((currentLoad / 100) * 100, 100);
  };

  return (
    <div className="server-card">
      <div className="server-header">
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor(server.status) }}
        />
        <h3>{server.id}</h3>
        <span className="region-badge">{server.region}</span>
      </div>
      
      <div className="server-details">
        <div className="detail-item">
          <span className="label">Host:</span>
          <span className="value">{server.host}:{server.port}</span>
        </div>
        
        <div className="detail-item">
          <span className="label">Status:</span>
          <span className={`status ${server.status}`}>{server.status}</span>
        </div>
        
        <div className="detail-item">
          <span className="label">Response Time:</span>
          <span className="value">{server.responseTime}ms</span>
        </div>
        
        <div className="detail-item">
          <span className="label">Current Load:</span>
          <span className="value">{currentLoad} requests</span>
        </div>
      </div>

      <div className="load-meter">
        <div className="load-bar">
          <div 
            className="load-fill"
            style={{ 
              width: `${getLoadPercentage()}%`,
              backgroundColor: getLoadPercentage() > 80 ? '#ef4444' : '#22c55e'
            }}
          />
        </div>
        <span className="load-percentage">{Math.round(getLoadPercentage())}%</span>
      </div>
    </div>
  );
};
