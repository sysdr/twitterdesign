import React from 'react';
import axios from 'axios';

function FailoverController({ status, onRefresh }) {
  const handleFailover = async () => {
    if (window.confirm('Are you sure you want to initiate failover? This will switch to standby region.')) {
      try {
        await axios.post('http://localhost:3001/api/failover/initiate', {
          reason: 'Manual trigger from dashboard'
        });
        onRefresh();
      } catch (error) {
        console.error('Failover failed:', error);
      }
    }
  };

  const handleFailback = async () => {
    if (window.confirm('Failback to primary region?')) {
      try {
        await axios.post('http://localhost:3001/api/failover/failback');
        onRefresh();
      } catch (error) {
        console.error('Failback failed:', error);
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <span>🔄</span> Failover Control
        </h2>
        <span className={`badge ${status.state === 'HEALTHY' ? 'healthy' : 'failing'}`}>
          {status.state}
        </span>
      </div>

      <div className="stat-grid">
        <div className="stat-item">
          <div className="stat-label">Current Primary</div>
          <div className="stat-value" style={{fontSize: '18px'}}>
            {status.currentPrimary}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Total Failovers</div>
          <div className="stat-value">{status.metrics.totalFailovers}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Success Rate</div>
          <div className="stat-value">
            {status.metrics.totalFailovers > 0 
              ? ((status.metrics.successfulFailovers / status.metrics.totalFailovers) * 100).toFixed(1)
              : 100}%
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Avg RTO</div>
          <div className="stat-value">
            {(status.metrics.averageRTO / 1000 / 60).toFixed(2)}
            <span className="stat-unit">min</span>
          </div>
        </div>
      </div>

      <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
        <button 
          className="btn btn-danger"
          onClick={handleFailover}
          disabled={status.inFailover || status.currentPrimary === 'standby'}
          style={{flex: 1}}
        >
          {status.inFailover ? 'Failing Over...' : 'Initiate Failover'}
        </button>
        <button 
          className="btn btn-success"
          onClick={handleFailback}
          disabled={status.inFailover || status.currentPrimary === 'primary'}
          style={{flex: 1}}
        >
          Failback to Primary
        </button>
      </div>

      {status.failoverHistory.length > 0 && (
        <div style={{marginTop: '20px'}}>
          <h3 style={{fontSize: '14px', marginBottom: '10px', color: '#666'}}>
            Recent Failovers
          </h3>
          <div className="timeline">
            {status.failoverHistory.slice(-3).reverse().map((failover, idx) => (
              <div key={idx} className="timeline-item">
                <div style={{fontSize: '13px', color: '#2c3e50'}}>
                  <strong>{failover.success ? '✓' : '✗'}</strong> {failover.reason}
                </div>
                <div style={{fontSize: '12px', color: '#999'}}>
                  RTO: {(failover.rto / 1000 / 60).toFixed(2)} min | 
                  {new Date(failover.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FailoverController;
