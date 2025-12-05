import React from 'react';
import { AnomalyDetection } from '../../types';
import { format } from 'date-fns';

interface Props {
  anomalies: AnomalyDetection[];
}

export const AnomalyAlert: React.FC<Props> = ({ anomalies }) => {
  const recentAnomalies = anomalies.slice(-5).reverse();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#84cc16';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: 20,
      borderRadius: 8,
      minHeight: 200
    }}>
      <h3 style={{ margin: 0, marginBottom: 15 }}>Anomaly Alerts</h3>
      {recentAnomalies.length === 0 ? (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
          No anomalies detected
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recentAnomalies.map((anomaly, idx) => (
            <div
              key={idx}
              style={{
                padding: 12,
                borderLeft: `4px solid ${getSeverityColor(anomaly.severity)}`,
                background: '#f9fafb',
                borderRadius: 4
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 12 }}>
                  {anomaly.severity} Severity
                </span>
                <span style={{ color: '#6b7280', fontSize: 12 }}>
                  {format(new Date(anomaly.timestamp), 'HH:mm:ss')}
                </span>
              </div>
              <div style={{ fontSize: 14 }}>
                Value: <strong>{anomaly.value.toFixed(2)}</strong> 
                {' '}(Expected: {anomaly.expectedValue.toFixed(2)})
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 5 }}>
                Z-Score: {anomaly.zScore.toFixed(2)}σ
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
