import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { AccuracyPanel } from './components/AccuracyPanel';
import { ValidationChart } from './components/ValidationChart';
import { ABTestPanel } from './components/ABTestPanel';
import { ModelAccuracy, ValidationResult, ABTest } from './types';

const API_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

function App() {
  const [accuracies, setAccuracies] = useState<ModelAccuracy[]>([]);
  const [validations, setValidations] = useState<Record<string, ValidationResult[]>>({});
  const [tests, setTests] = useState<ABTest[]>([]);
  const { data: wsData, connected } = useWebSocket(WS_URL);

  // Fetch initial data
  useEffect(() => {
    fetchAccuracies();
    fetchTests();
    fetchValidations();
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    if (!wsData) return;

    const message = wsData as any;
    
    if (message.type === 'validation') {
      if (message.accuracy) {
        setAccuracies(prev => {
          const filtered = prev.filter(a => 
            !(a.modelName === message.accuracy.modelName && 
              a.modelVersion === message.accuracy.modelVersion)
          );
          return [...filtered, message.accuracy];
        });
      }

      if (message.results && message.results.length > 0) {
        const result = message.results[0];
        setValidations(prev => ({
          ...prev,
          [message.modelName]: [
            ...(prev[message.modelName] || []).slice(-49),
            result
          ]
        }));
      }
    } else if (message.type === 'ab_test_update') {
      setTests(prev => {
        const filtered = prev.filter(t => t.id !== message.test.id);
        return [...filtered, message.test];
      });
    }
  }, [wsData]);

  const fetchAccuracies = async () => {
    try {
      const response = await fetch(`${API_URL}/accuracy`);
      const data = await response.json();
      setAccuracies(data);
    } catch (error) {
      console.error('Failed to fetch accuracies:', error);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await fetch(`${API_URL}/tests`);
      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    }
  };

  const fetchValidations = async () => {
    const models = ['timeline_latency', 'cache_hit_rate', 'queue_depth'];
    
    for (const model of models) {
      try {
        const response = await fetch(`${API_URL}/validations/${model}`);
        const data = await response.json();
        setValidations(prev => ({ ...prev, [model]: data }));
      } catch (error) {
        console.error(`Failed to fetch validations for ${model}:`, error);
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px', 
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                Mathematical Model Validation Dashboard
              </h1>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                Real-time validation of mathematical models against production metrics
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              background: connected ? '#f0fdf4' : '#fef2f2',
              fontSize: '14px',
              fontWeight: 600
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connected ? '#10b981' : '#ef4444'
              }} />
              {connected ? 'Live' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Accuracy Overview */}
        <AccuracyPanel accuracies={accuracies} />

        {/* Validation Charts */}
        {Object.entries(validations).map(([modelName, results]) => (
          results.length > 0 && (
            <ValidationChart 
              key={modelName}
              modelName={modelName}
              validations={results}
            />
          )
        ))}

        {/* A/B Tests */}
        <ABTestPanel tests={tests} />

        {/* Footer Info */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Lesson 48: Mathematical Modeling Validation | Twitter System Design Course
          <br />
          Validating predictions with 95%+ accuracy threshold
        </div>
      </div>
    </div>
  );
}

export default App;
