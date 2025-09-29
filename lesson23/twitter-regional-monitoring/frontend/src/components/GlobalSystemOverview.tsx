import React from 'react';
import { SystemState } from '../types/index.ts';

interface Props {
  systemState: SystemState;
}

const GlobalSystemOverview: React.FC<Props> = ({ systemState }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'degraded': return '#f59e0b';
      case 'incident': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'incident': return '🚨';
      default: return '❓';
    }
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    }}>
      <h2 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937'
      }}>
        Global System Status {getStatusIcon(systemState.globalStatus)}
      </h2>
      
      <div style={{
        display: 'inline-block',
        padding: '8px 16px',
        backgroundColor: getStatusColor(systemState.globalStatus),
        color: 'white',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: '600',
        textTransform: 'capitalize',
        marginBottom: '24px'
      }}>
        {systemState.globalStatus}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {systemState.regions.map(region => (
          <div key={region.id} style={{
            padding: '16px',
            border: '2px solid',
            borderColor: getStatusColor(region.status),
            borderRadius: '8px',
            backgroundColor: `${getStatusColor(region.status)}15`
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
              {region.name}
            </h3>
            <div style={{ 
              fontSize: '14px', 
              color: getStatusColor(region.status),
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {region.status}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              {region.location.lat.toFixed(2)}, {region.location.lng.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalSystemOverview;
