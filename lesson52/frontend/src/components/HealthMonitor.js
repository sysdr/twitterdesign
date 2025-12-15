import React from 'react';

function HealthMonitor({ health }) {
  // Safety guard for missing/partial data to avoid runtime errors
  const hasData =
    health &&
    health.primary &&
    health.primary.checks &&
    health.standby &&
    health.standby.checks;

  if (!hasData) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>🏥</span> Health Monitor
          </h2>
          <span className="badge degraded">NO DATA</span>
        </div>
        <p style={{ padding: '12px', color: '#666' }}>
          Waiting for health data from the backend...
        </p>
      </div>
    );
  }

  const getStateColor = (state) => {
    const colors = {
      'HEALTHY': 'healthy',
      'DEGRADED': 'degraded',
      'FAILING_OVER': 'failing',
      'STANDBY_ACTIVE': 'active',
      'CRITICAL': 'failing'
    };
    return colors[state] || 'degraded';
  };

  const getCheckIcon = (success) => {
    return success ? '✓' : '✗';
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <span>🏥</span> Health Monitor
        </h2>
        <span className={`badge ${getStateColor(health.state)}`}>
          {health.state}
        </span>
      </div>

      <div className="health-regions">
        <div className="region-card">
          <h3>Primary Region</h3>
          <div className={`status-indicator ${health.primary.status === 'HEALTHY' ? 'healthy' : 'failed'}`}>
            {health.primary.status}
          </div>
          <div className="checks">
            <div className="check-item">
              <span>{getCheckIcon(health.primary.checks.shallow?.success)}</span>
              <span>Shallow: {health.primary.checks.shallow?.latency ?? 'n/a'}ms</span>
            </div>
            <div className="check-item">
              <span>{getCheckIcon(health.primary.checks.medium?.success)}</span>
              <span>Medium Check</span>
            </div>
            <div className="check-item">
              <span>{getCheckIcon(health.primary.checks.deep?.success)}</span>
              <span>Deep Check</span>
            </div>
          </div>
        </div>

        <div className="region-card">
          <h3>Standby Region</h3>
          <div className={`status-indicator ${health.standby.status === 'HEALTHY' ? 'healthy' : 'failed'}`}>
            {health.standby.status}
          </div>
          <div className="checks">
            <div className="check-item">
              <span>{getCheckIcon(health.standby.checks.shallow?.success)}</span>
              <span>Shallow: {health.standby.checks.shallow?.latency ?? 'n/a'}ms</span>
            </div>
            {health.standby.checks.deep?.replicationLag !== undefined && (
              <div className="check-item">
                <span>⏱️</span>
                <span>Replication Lag: {health.standby.checks.deep.replicationLag.toFixed(2)}s</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .health-regions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }
        .region-card {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .region-card h3 {
          font-size: 16px;
          margin-bottom: 10px;
          color: #2c3e50;
        }
        .status-indicator {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 10px;
        }
        .status-indicator.healthy {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .status-indicator.failed {
          background: #ffebee;
          color: #c62828;
        }
        .checks {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .check-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #666;
        }
      `}</style>
    </div>
  );
}

export default HealthMonitor;
