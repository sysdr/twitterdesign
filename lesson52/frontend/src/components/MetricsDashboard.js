import React from 'react';

function MetricsDashboard({ metrics }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <span>📊</span> System Metrics
        </h2>
        <span style={{fontSize: '14px', color: '#666'}}>
          Uptime: {metrics.system.uptimeFormatted}
        </span>
      </div>

      <div className="metric-row">
        <div>
          <div style={{fontSize: '12px', color: '#666'}}>Requests/Second</div>
          <div style={{fontSize: '20px', fontWeight: '700', color: '#2c3e50'}}>
            {metrics.requests.perSecond.toFixed(1)}
          </div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontSize: '12px', color: '#666'}}>Avg Latency</div>
          <div style={{fontSize: '20px', fontWeight: '700', color: '#667eea'}}>
            {metrics.requests.avgLatency}ms
          </div>
        </div>
      </div>

      <div className="metric-row">
        <div>
          <div style={{fontSize: '12px', color: '#666'}}>Error Rate</div>
          <div style={{fontSize: '20px', fontWeight: '700', color: metrics.requests.errorRate < 1 ? '#4caf50' : '#f44336'}}>
            {metrics.requests.errorRate}%
          </div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontSize: '12px', color: '#666'}}>Total Requests</div>
          <div style={{fontSize: '20px', fontWeight: '700', color: '#2c3e50'}}>
            {metrics.requests.total.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{marginTop: '15px', padding: '12px', background: '#f8f9fa', borderRadius: '6px'}}>
        <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>
          BACKUP STATS
        </div>
        <div style={{fontSize: '14px', color: '#2c3e50'}}>
          Total Backups: {metrics.backups.total} | 
          Failovers: {metrics.failovers.total} 
          ({metrics.failovers.successful} successful)
        </div>
      </div>

      <div style={{marginTop: '10px'}}>
        <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>
          SYSTEM HEALTH
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{width: `${100 - parseFloat(metrics.requests.errorRate)}%`}}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default MetricsDashboard;
