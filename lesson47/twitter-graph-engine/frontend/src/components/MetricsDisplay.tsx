import React from 'react';
import { GraphMetrics } from '../types';

interface MetricsDisplayProps {
  metrics: GraphMetrics;
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics }) => {
  return (
    <div className="metrics-display">
      <h2>Graph Metrics</h2>
      <div className="metrics-grid">
        <div className="metric">
          <span className="metric-label">Nodes:</span>
          <span className="metric-value">{metrics.nodeCount.toLocaleString()}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Edges:</span>
          <span className="metric-value">{metrics.edgeCount.toLocaleString()}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Avg Degree:</span>
          <span className="metric-value">{metrics.avgDegree.toFixed(2)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Max Degree:</span>
          <span className="metric-value">{metrics.maxDegree}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Density:</span>
          <span className="metric-value">{(metrics.density * 100).toFixed(4)}%</span>
        </div>
      </div>
    </div>
  );
};
