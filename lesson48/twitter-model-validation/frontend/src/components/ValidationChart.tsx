import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ValidationResult } from '../types';

interface ValidationChartProps {
  validations: ValidationResult[];
  modelName: string;
}

export const ValidationChart: React.FC<ValidationChartProps> = ({ validations, modelName }) => {
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

  const chartData = validations.map(v => ({
    timestamp: toNumber(v.timestamp),
    predicted: toNumber(v.predictedValue),
    actual: toNumber(v.actualValue),
    error: toNumber(v.percentageError)
  }));

  const latest = validations.length > 0 ? validations[validations.length - 1] : undefined;
  const latestPredicted = toNumber(latest?.predictedValue);
  const latestActual = toNumber(latest?.actualValue);
  const latestError = toNumber(latest?.percentageError);

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 600 }}>
        {formatModelName(modelName)} - Predicted vs Actual
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTimestamp}
            style={{ fontSize: '12px' }}
          />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip 
            formatter={(value: number) => toNumber(value).toFixed(2)}
            labelFormatter={(label: number) => formatTimestamp(label)}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#3b82f6" 
            name="Predicted"
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#10b981" 
            name="Actual"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {latest && (
        <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '14px' }}>
          <div>
            <span style={{ color: '#666' }}>Latest Predicted:</span>
            <strong style={{ marginLeft: '8px' }}>
              {latestPredicted.toFixed(2)}
            </strong>
          </div>
          <div>
            <span style={{ color: '#666' }}>Latest Actual:</span>
            <strong style={{ marginLeft: '8px' }}>
              {latestActual.toFixed(2)}
            </strong>
          </div>
          <div>
            <span style={{ color: '#666' }}>Error:</span>
            <strong 
              style={{ 
                marginLeft: '8px',
                color: latestError < 5 ? '#10b981' : '#ef4444'
              }}
            >
              {latestError.toFixed(2)}%
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
