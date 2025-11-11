import React from 'react';
import { Activity, Database, Zap, Server } from 'lucide-react';
import { SystemHealth as SystemHealthType } from '../types/chaos';

interface SystemHealthProps {
  health: SystemHealthType;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ health }) => {
  const services = Object.values(health.services);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'degraded': return '#f59e0b';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'api': return <Server size={24} />;
      case 'database': return <Database size={24} />;
      case 'cache': return <Zap size={24} />;
      default: return <Activity size={24} />;
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginTop: '1rem'
    }}>
      {services.map(service => (
        <div
          key={service.name}
          style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: `2px solid ${getStatusColor(service.status)}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ color: getStatusColor(service.status) }}>
              {getIcon(service.name)}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{service.name}</h3>
          </div>
          
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            <div>Status: <strong style={{ color: getStatusColor(service.status) }}>
              {service.status.toUpperCase()}
            </strong></div>
            <div>Latency: {service.latency}ms</div>
            <div>Error Rate: {service.errorRate.toFixed(2)}%</div>
          </div>
        </div>
      ))}
    </div>
  );
};
