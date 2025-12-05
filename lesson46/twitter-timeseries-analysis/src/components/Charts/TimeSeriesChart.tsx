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
  ReferenceDot,
  Area,
  ComposedChart
} from 'recharts';
import { MetricData, AnomalyDetection, ForecastPoint } from '../../types';
import { format } from 'date-fns';

interface Props {
  data: MetricData[];
  anomalies: AnomalyDetection[];
  forecasts: ForecastPoint[];
}

export const TimeSeriesChart: React.FC<Props> = ({ data, anomalies, forecasts }) => {
  // Combine historical and forecast data
  const chartData = data.map(d => ({
    timestamp: d.timestamp,
    value: d.value,
    time: format(new Date(d.timestamp), 'HH:mm:ss')
  }));

  const forecastData = forecasts.map(f => ({
    timestamp: f.timestamp,
    predicted: f.predicted,
    upper: f.confidenceUpper,
    lower: f.confidenceLower,
    time: format(new Date(f.timestamp), 'HH:mm:ss')
  }));

  const allData = [...chartData, ...forecastData];

  return (
    <div style={{ width: '100%', height: 400, background: 'white', padding: 20, borderRadius: 8 }}>
      <h3 style={{ margin: 0, marginBottom: 10 }}>Real-Time Metrics with Anomalies & Forecast</h3>
      <ResponsiveContainer>
        <ComposedChart data={allData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          
          {/* Actual values */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="Actual"
          />
          
          {/* Forecast */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Forecast"
          />
          
          {/* Confidence interval */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.1}
          />

          {/* Anomaly markers */}
          {anomalies.map((anomaly, idx) => (
            <ReferenceDot
              key={idx}
              x={format(new Date(anomaly.timestamp), 'HH:mm:ss')}
              y={anomaly.value}
              r={6}
              fill={
                anomaly.severity === 'high' ? '#ef4444' :
                anomaly.severity === 'medium' ? '#f59e0b' :
                '#84cc16'
              }
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
