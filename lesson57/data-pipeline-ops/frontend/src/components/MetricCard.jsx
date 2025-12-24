import React from 'react';

function MetricCard({ title, value, unit, alert }) {
  return (
    <div className="card" style={alert ? {borderLeft: '4px solid #dc3545'} : {}}>
      <div className="card-title">{title}</div>
      <div className="card-value">
        {value}
        <span className="card-unit">{unit}</span>
      </div>
    </div>
  );
}

export default MetricCard;
