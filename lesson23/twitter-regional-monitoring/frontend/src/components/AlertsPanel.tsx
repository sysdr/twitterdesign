import React from 'react';
import { Alert } from '../types/index.ts';
import SocketService from '../services/SocketService.ts';

interface Props {
  alerts: Alert[];
}

const AlertsPanel: React.FC<Props> = ({ alerts }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const handleAcknowledge = (alertId: string) => {
    SocketService.acknowledgeAlert(alertId);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginTop: '24px'
    }}>
      <h2 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937'
      }}>
        Active Alerts ({alerts.length})
      </h2>

      {alerts.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '32px',
          color: '#6b7280',
          fontSize: '16px'
        }}>
          ✅ No active alerts - All systems operating normally
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.sort((a, b) => b.timestamp - a.timestamp).map(alert => (
            <div
              key={alert.id}
              style={{
                padding: '16px',
                border: '2px solid',
                borderColor: getSeverityColor(alert.severity),
                borderRadius: '8px',
                backgroundColor: `${getSeverityColor(alert.severity)}10`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getSeverityIcon(alert.severity)}</span>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '18px', 
                      fontWeight: '600',
                      color: getSeverityColor(alert.severity)
                    }}>
                      {alert.title}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: getSeverityColor(alert.severity),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {alert.severity}
                    </span>
                  </div>
                  
                  <p style={{ margin: '0 0 8px 0', color: '#4b5563' }}>
                    {alert.description}
                  </p>
                  
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    <div>Time: {formatTimestamp(alert.timestamp)}</div>
                    {alert.regionId && <div>Region: {alert.regionId}</div>}
                    {alert.correlatedAlerts.length > 0 && (
                      <div>Correlated alerts: {alert.correlatedAlerts.length}</div>
                    )}
                    {alert.acknowledgedBy && (
                      <div style={{ color: getSeverityColor('info') }}>
                        Acknowledged by: {alert.acknowledgedBy}
                      </div>
                    )}
                  </div>
                </div>
                
                {!alert.acknowledgedBy && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
