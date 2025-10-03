import React from 'react';
import { FailoverService } from '../../services/FailoverService';

interface Props {
  failoverService: FailoverService;
}

export const FailoverControls: React.FC<Props> = ({ failoverService }) => {
  const regions = failoverService.getRegions();

  const simulateFailure = (regionId: string) => {
    failoverService.simulateRegionalFailure(regionId);
  };

  const simulateDegradation = (regionId: string) => {
    failoverService.simulateRegionalDegradation(regionId);
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3>Failover Testing Controls</h3>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
        Simulate regional failures to test system resilience
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {regions.map(region => (
          <div
            key={region.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px',
              border: '1px solid #e1e8ed',
              borderRadius: '4px',
              backgroundColor: region.status === 'active' ? '#f8f9fa' : 
                            region.status === 'degraded' ? '#fff3cd' : '#f8d7da'
            }}
          >
            <div>
              <strong>{region.name}</strong>
              <span style={{ 
                marginLeft: '10px', 
                color: region.status === 'active' ? '#28a745' : 
                       region.status === 'degraded' ? '#856404' : '#721c24',
                fontSize: '12px',
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}>
                {region.status}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={() => simulateDegradation(region.id)}
                disabled={region.status !== 'active'}
                style={{
                  padding: '5px 10px',
                  backgroundColor: region.status === 'active' ? '#ffc107' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '12px',
                  cursor: region.status === 'active' ? 'pointer' : 'not-allowed'
                }}
              >
                Degrade
              </button>
              <button
                onClick={() => simulateFailure(region.id)}
                disabled={region.status !== 'active'}
                style={{
                  padding: '5px 10px',
                  backgroundColor: region.status === 'active' ? '#dc3545' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '12px',
                  cursor: region.status === 'active' ? 'pointer' : 'not-allowed'
                }}
              >
                Fail
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
