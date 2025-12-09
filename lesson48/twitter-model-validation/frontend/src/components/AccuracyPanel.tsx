import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ModelAccuracy } from '../types';

interface AccuracyPanelProps {
  accuracies: ModelAccuracy[];
}

export const AccuracyPanel: React.FC<AccuracyPanelProps> = ({ accuracies }) => {
  const formatModelName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const toNumber = (value: unknown, fallback = 0) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600 }}>
        Model Accuracy Overview
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {accuracies.map(acc => {
          const overallAccuracy = toNumber(acc.overallAccuracy, 0);
          const mape = toNumber(acc.mape, 0);
          const validationCount = toNumber(acc.validationCount, 0);
          const history = acc.accuracyHistory ?? [];

          return (
          <div key={`${acc.modelName}_${acc.modelVersion}`} style={{
            border: `2px solid ${overallAccuracy >= 95 ? '#10b981' : '#ef4444'}`,
            borderRadius: '6px',
            padding: '15px',
            background: overallAccuracy >= 95 ? '#f0fdf4' : '#fef2f2'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {formatModelName(acc.modelName)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Version {acc.modelVersion}
              </div>
            </div>

            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
              {overallAccuracy.toFixed(1)}%
            </div>
            
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              MAPE: {mape.toFixed(2)}% | Validations: {validationCount}
            </div>

            {history.length > 0 && (
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={history}>
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke={overallAccuracy >= 95 ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                    labelFormatter={(label: number) => formatTimestamp(label)}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {overallAccuracy < 95 && (
              <div style={{
                marginTop: '10px',
                padding: '8px',
                background: '#fee2e2',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#991b1b'
              }}>
                ⚠️ Below 95% threshold - needs recalibration
              </div>
            )}
          </div>
        );})}
      </div>
    </div>
  );
};
