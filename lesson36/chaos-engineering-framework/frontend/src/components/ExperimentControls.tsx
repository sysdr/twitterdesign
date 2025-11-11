import React, { useState, useEffect } from 'react';
import { Play, Square, AlertTriangle } from 'lucide-react';
import { ExperimentTemplate, ChaosExperiment } from '../types/chaos';
import { chaosApi } from '../services/api';

interface ExperimentControlsProps {
  activeExperiments: ChaosExperiment[];
}

export const ExperimentControls: React.FC<ExperimentControlsProps> = ({ activeExperiments }) => {
  const [templates, setTemplates] = useState<ExperimentTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await chaosApi.getExperiments();
    setTemplates(data);
  };

  const startExperiment = async (id: string) => {
    setLoading(true);
    try {
      await chaosApi.startExperiment(id);
    } finally {
      setLoading(false);
    }
  };

  const stopExperiment = async (id: string) => {
    await chaosApi.stopExperiment(id);
  };

  const emergencyStop = async () => {
    if (confirm('Are you sure you want to stop ALL experiments?')) {
      await chaosApi.emergencyStop();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Chaos Experiments</h2>
        <button
          onClick={emergencyStop}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          <AlertTriangle size={20} />
          EMERGENCY STOP
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {templates.map(template => {
          const active = activeExperiments.find(e => 
            e.failureType === template.failureType && e.status === 'running'
          );

          return (
            <div
              key={template.id}
              style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: active ? '2px solid #f59e0b' : '1px solid #e5e7eb'
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{template.name}</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                Target: {template.target}
              </p>
              
              {active ? (
                <div>
                  <div style={{ 
                    background: '#fef3c7',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem'
                  }}>
                    <strong>Running</strong><br />
                    Duration: {Math.floor((Date.now() - (active.startTime || 0)) / 1000)}s
                  </div>
                  <button
                    onClick={() => stopExperiment(active.id)}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Square size={16} />
                    Stop Experiment
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startExperiment(template.id)}
                  disabled={loading}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <Play size={16} />
                  Start Experiment
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
