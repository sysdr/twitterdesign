import React from 'react';

function PipelineCard({ pipeline }) {
  const getStateColor = (state) => {
    switch(state) {
      case 'active': return '#28a745';
      case 'paused': return '#ffc107';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="pipeline-card" style={{borderLeftColor: getStateColor(pipeline.state)}}>
      <div className="pipeline-name">{pipeline.name}</div>
      <div style={{fontSize: '0.75rem', color: '#999', marginBottom: '12px'}}>
        State: <strong style={{color: getStateColor(pipeline.state)}}>{pipeline.state}</strong>
      </div>
      <div className="pipeline-stats">
        <div>
          <div style={{color: '#999', fontSize: '0.75rem'}}>Processed</div>
          <div style={{fontWeight: '600'}}>{pipeline.stats.processed.toLocaleString()}</div>
        </div>
        <div>
          <div style={{color: '#999', fontSize: '0.75rem'}}>Failed</div>
          <div style={{fontWeight: '600', color: '#dc3545'}}>{pipeline.stats.failed}</div>
        </div>
      </div>
    </div>
  );
}

export default PipelineCard;
