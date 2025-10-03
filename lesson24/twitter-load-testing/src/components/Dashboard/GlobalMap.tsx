import React from 'react';
import { Region } from '../../types';

interface Props {
  regions: Region[];
}

export const GlobalMap: React.FC<Props> = ({ regions }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#28a745';
      case 'degraded': return '#ffc107';
      case 'offline': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3>Global Region Status</h3>
      
      {/* Simplified world map representation */}
      <div style={{
        width: '100%',
        height: '300px',
        backgroundColor: '#e8f4f8',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden',
        marginTop: '15px'
      }}>
        {regions.map(region => {
          // Simplified positioning based on approximate coordinates
          const x = ((region.location.lng + 180) / 360) * 100;
          const y = ((90 - region.location.lat) / 180) * 100;
          
          return (
            <div
              key={region.id}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: getStatusColor(region.status),
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                cursor: 'pointer'
              }}
              title={`${region.name} - ${region.status}`}
            />
          );
        })}
        
        {/* Simple continent outlines */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '15%',
          height: '30%',
          backgroundColor: '#c0c0c0',
          opacity: 0.3,
          borderRadius: '20% 40% 60% 20%'
        }} title="North America" />
        
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '45%',
          width: '12%',
          height: '25%',
          backgroundColor: '#c0c0c0',
          opacity: 0.3,
          borderRadius: '30% 20% 40% 50%'
        }} title="Europe" />
        
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '75%',
          width: '20%',
          height: '35%',
          backgroundColor: '#c0c0c0',
          opacity: 0.3,
          borderRadius: '40% 30% 20% 60%'
        }} title="Asia" />
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        marginTop: '15px',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '50%' }} />
          <span>Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#ffc107', borderRadius: '50%' }} />
          <span>Degraded</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#dc3545', borderRadius: '50%' }} />
          <span>Offline</span>
        </div>
      </div>
    </div>
  );
};
