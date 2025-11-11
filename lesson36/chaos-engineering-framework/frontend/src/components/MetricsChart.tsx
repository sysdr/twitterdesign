import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExperimentMetrics } from '../types/chaos';

interface MetricsChartProps {
  history: Array<ExperimentMetrics & { timestamp: number }>;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ history }) => {
  const data = history.slice(-30).map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString(),
    'Error Rate (%)': h.errorRate.toFixed(2),
    'P50 (ms)': h.latencyP50,
    'P95 (ms)': h.latencyP95,
    'P99 (ms)': h.latencyP99
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Error Rate (%)" stroke="#ff4444" strokeWidth={2} />
          <Line type="monotone" dataKey="P95 (ms)" stroke="#4444ff" strokeWidth={2} />
          <Line type="monotone" dataKey="P99 (ms)" stroke="#ff8844" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
