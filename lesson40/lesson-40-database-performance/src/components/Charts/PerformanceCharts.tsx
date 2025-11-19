import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { PoolMetrics } from '../../types';

interface Props {
  metricsHistory: PoolMetrics[];
}

export const PerformanceCharts: React.FC<Props> = ({ metricsHistory }) => {
  const chartData = metricsHistory.slice(-50).map((m, i) => ({
    time: i,
    utilization: m.utilization * 100,
    p50: m.p50Latency,
    p95: m.p95Latency,
    p99: m.p99Latency,
    queueProb: m.queueProbability * 100,
    recommended: m.recommendedPoolSize,
    active: m.activeConnections
  }));
  
  return (
    <div style={{
      padding: '20px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1a1a2e' }}>Performance Metrics</h3>
      
      {/* Latency Chart */}
      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#6b7280' }}>
          Response Time Percentiles (ms)
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="p99"
              stackId="1"
              stroke="#ef4444"
              fill="#fecaca"
              name="P99"
            />
            <Area
              type="monotone"
              dataKey="p95"
              stackId="2"
              stroke="#f59e0b"
              fill="#fef3c7"
              name="P95"
            />
            <Area
              type="monotone"
              dataKey="p50"
              stackId="3"
              stroke="#22c55e"
              fill="#dcfce7"
              name="P50"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Utilization Chart */}
      <div>
        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#6b7280' }}>
          Pool Utilization & Queue Probability (%)
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="utilization"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Utilization"
            />
            <Line
              type="monotone"
              dataKey="queueProb"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="Queue Prob"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
