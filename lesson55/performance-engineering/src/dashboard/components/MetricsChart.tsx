import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  metrics: any[];
}

export const MetricsChart: React.FC<Props> = ({ metrics }) => {
  const chartData = useMemo(() => {
    // Group metrics by 10-second windows
    const windows = new Map<number, any[]>();
    
    metrics.forEach(metric => {
      if (metric.type !== 'timing') return;
      
      const window = Math.floor(metric.timestamp / 10000) * 10000;
      if (!windows.has(window)) {
        windows.set(window, []);
      }
      windows.get(window)!.push(metric.value);
    });

    // Calculate percentiles for each window
    const data: any[] = [];
    windows.forEach((values, window) => {
      const sorted = [...values].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
      
      data.push({
        time: new Date(window).toLocaleTimeString(),
        p50,
        p95,
        p99
      });
    });

    return data.slice(-30); // Last 30 windows
  }, [metrics]);

  return (
    <div className="metrics-chart">
      <h3>Latency Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="p50" stroke="#10b981" name="P50" />
          <Line type="monotone" dataKey="p95" stroke="#f59e0b" name="P95" />
          <Line type="monotone" dataKey="p99" stroke="#ef4444" name="P99" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
