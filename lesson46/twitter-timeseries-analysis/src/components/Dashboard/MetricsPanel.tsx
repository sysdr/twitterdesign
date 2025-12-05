import React from 'react';
import { TimeSeriesState } from '../../types';

interface Props {
  state: TimeSeriesState;
  totalMetrics: number;
}

export const MetricsPanel: React.FC<Props> = ({ state, totalMetrics }) => {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return '#ef4444';
      case 'decreasing': return '#10b981';
      case 'stable': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↑';
      case 'decreasing': return '↓';
      case 'stable': return '→';
      default: return '—';
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 20,
      marginBottom: 20
    }}>
      <MetricCard
        title="Current Value"
        value={state.currentValue.toFixed(2)}
        color="#3b82f6"
      />
      <MetricCard
        title="Anomalies Detected"
        value={state.anomalyCount.toString()}
        color={state.anomalyCount > 5 ? '#ef4444' : '#10b981'}
      />
      <MetricCard
        title="Forecast Accuracy"
        value={`${state.forecastAccuracy.toFixed(1)}%`}
        color="#10b981"
      />
      <div style={{
        background: 'white',
        padding: 20,
        borderRadius: 8,
        border: `3px solid ${getTrendColor(state.trend.trend)}`
      }}>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 5 }}>Trend</div>
        <div style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: getTrendColor(state.trend.trend),
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <span>{getTrendIcon(state.trend.trend)}</span>
          <span style={{ fontSize: 24 }}>{state.trend.trend}</span>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 5 }}>
          {state.trend.changeRate.toFixed(2)}% change
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string; color: string }> = ({
  title,
  value,
  color
}) => (
  <div style={{
    background: 'white',
    padding: 20,
    borderRadius: 8,
    borderLeft: `4px solid ${color}`
  }}>
    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 5 }}>{title}</div>
    <div style={{ fontSize: 32, fontWeight: 'bold', color }}>{value}</div>
  </div>
);
