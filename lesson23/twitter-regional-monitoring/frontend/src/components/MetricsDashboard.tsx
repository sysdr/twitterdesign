import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Metric } from '../types/index.ts';

interface Props {
  metrics: Metric[];
  selectedRegion: string | null;
}

const MetricsDashboard: React.FC<Props> = ({ metrics, selectedRegion }) => {
  const processMetricsForChart = (metricType: string) => {
    const filteredMetrics = metrics
      .filter(m => m.type === metricType)
      .filter(m => !selectedRegion || m.regionId === selectedRegion)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-20); // Last 20 data points

    const dataMap = new Map();
    
    filteredMetrics.forEach(metric => {
      const timeKey = new Date(metric.timestamp).toLocaleTimeString();
      if (!dataMap.has(timeKey)) {
        dataMap.set(timeKey, { time: timeKey });
      }
      dataMap.get(timeKey)[metric.regionId] = metric.value;
    });

    return Array.from(dataMap.values());
  };

  const metricTypes = [
    { key: 'api_latency', label: 'API Latency (ms)', color: '#8884d8' },
    { key: 'error_rate', label: 'Error Rate (%)', color: '#ef4444' },
    { key: 'cpu_usage', label: 'CPU Usage (%)', color: '#22c55e' },
    { key: 'memory_usage', label: 'Memory Usage (%)', color: '#f59e0b' }
  ];

  const regions = ['us-east', 'europe', 'asia-pacific'];
  const regionColors = { 'us-east': '#3b82f6', 'europe': '#10b981', 'asia-pacific': '#f59e0b' };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ 
        margin: '0 0 24px 0', 
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937'
      }}>
        Performance Metrics {selectedRegion && `- ${selectedRegion}`}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        {metricTypes.map(metricType => (
          <div key={metricType.key}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              {metricType.label}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={processMetricsForChart(metricType.key)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                {(selectedRegion ? [selectedRegion] : regions).map(region => (
                  <Line
                    key={region}
                    type="monotone"
                    dataKey={region}
                    stroke={regionColors[region as keyof typeof regionColors]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={region}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricsDashboard;
