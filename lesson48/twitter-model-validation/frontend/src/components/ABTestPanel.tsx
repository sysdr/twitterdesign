import React from 'react';
import { ABTest } from '../types';

interface ABTestPanelProps {
  tests: ABTest[];
}

export const ABTestPanel: React.FC<ABTestPanelProps> = ({ tests }) => {
  const formatDuration = (start: number, end?: number) => {
    const duration = (end || Date.now()) - start;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600 }}>
        A/B Test Experiments
      </h2>

      {tests.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No active experiments
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {tests.map(test => (
            <div 
              key={test.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '15px',
                background: test.status === 'running' ? '#f0fdf4' : '#f9fafb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{test.name}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Duration: {formatDuration(test.startTime, test.endTime)}
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: test.status === 'running' ? '#10b981' : '#6b7280',
                  color: 'white'
                }}>
                  {test.status.toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{
                  padding: '12px',
                  background: test.winner === 'control' ? '#dbeafe' : '#f3f4f6',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                    Control (v{test.controlModel.version})
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    {test.metrics.control.overallAccuracy.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    MAPE: {test.metrics.control.mape.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Validations: {test.metrics.control.validationCount}
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  background: test.winner === 'treatment' ? '#dbeafe' : '#f3f4f6',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                    Treatment (v{test.treatmentModel.version})
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    {test.metrics.treatment.overallAccuracy.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    MAPE: {test.metrics.treatment.mape.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Validations: {test.metrics.treatment.validationCount}
                  </div>
                </div>
              </div>

              {test.winner && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  background: '#dbeafe',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1e40af',
                  textAlign: 'center'
                }}>
                  Winner: {test.winner === 'control' ? 'Control' : 'Treatment'} Model
                </div>
              )}

              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: '#f9fafb',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                Traffic Split: {test.trafficSplit.control}% control / {test.trafficSplit.treatment}% treatment
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
