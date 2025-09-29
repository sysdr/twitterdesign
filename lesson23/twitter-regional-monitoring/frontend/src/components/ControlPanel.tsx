import React, { useState } from 'react';

const ControlPanel: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateIssue = async (regionIndex: number, severity: 'minor' | 'major') => {
    setIsSimulating(true);
    try {
      const response = await fetch('http://localhost:5000/api/simulate-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionIndex, severity })
      });
      
      if (response.ok) {
        console.log(`Simulated ${severity} issue in region ${regionIndex}`);
      }
    } catch (error) {
      console.error('Failed to simulate issue:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const resetRegions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reset-regions', {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('All regions reset to normal');
      }
    } catch (error) {
      console.error('Failed to reset regions:', error);
    }
  };

  const regions = [
    { name: 'US East', index: 0 },
    { name: 'Europe', index: 1 },
    { name: 'Asia Pacific', index: 2 }
  ];

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginTop: '24px'
    }}>
      <h2 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937'
      }}>
        🔧 Control Panel - Testing & Simulation
      </h2>

      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={resetRegions}
          style={{
            padding: '12px 24px',
            backgroundColor: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            marginRight: '16px'
          }}
        >
          🔄 Reset All Regions
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {regions.map(region => (
          <div key={region.index} style={{
            padding: '16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>
              {region.name}
            </h3>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => simulateIssue(region.index, 'minor')}
                disabled={isSimulating}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSimulating ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: isSimulating ? 0.5 : 1
                }}
              >
                ⚠️ Minor Issue
              </button>
              
              <button
                onClick={() => simulateIssue(region.index, 'major')}
                disabled={isSimulating}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSimulating ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: isSimulating ? 0.5 : 1
                }}
              >
                🚨 Major Issue
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControlPanel;
