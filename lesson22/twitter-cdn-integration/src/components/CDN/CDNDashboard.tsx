import React, { useState, useEffect } from 'react';
import { GlobalCDNMetrics, EdgeMetrics } from '../../services/monitoring/CDNMonitoringService';

interface Props {
  className?: string;
}

export const CDNDashboard: React.FC<Props> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<GlobalCDNMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/cdn/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`cdn-dashboard loading ${className}`}>
        <div className="loading-spinner">Loading CDN metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`cdn-dashboard error ${className}`}>
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={`cdn-dashboard ${className}`}>
      <div className="dashboard-header">
        <h2>CDN Performance Dashboard</h2>
        <div className="last-updated">
          Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleTimeString() : 'Never'}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card global-hit-rate">
          <h3>Global Hit Rate</h3>
          <div className="metric-value">
            {metrics?.totalHitRate.toFixed(2)}%
          </div>
          <div className="metric-indicator">
            <div 
              className="hit-rate-bar"
              style={{ width: `${metrics?.totalHitRate}%` }}
            />
          </div>
        </div>

        <div className="metric-card total-requests">
          <h3>Total Requests</h3>
          <div className="metric-value">
            {metrics?.totalRequests.toLocaleString()}
          </div>
        </div>

        <div className="metric-card bandwidth">
          <h3>Total Bandwidth</h3>
          <div className="metric-value">
            {formatBandwidth(metrics?.totalBandwidth || 0)}
          </div>
        </div>
      </div>

      <div className="edge-locations">
        <h3>Edge Location Performance</h3>
        <div className="edge-grid">
          {metrics?.edgeMetrics.map((edge) => (
            <EdgeLocationCard key={edge.edgeLocation} metrics={edge} />
          ))}
        </div>
      </div>
    </div>
  );
};

const EdgeLocationCard: React.FC<{ metrics: EdgeMetrics }> = ({ metrics }) => {
  return (
    <div className="edge-card">
      <div className="edge-header">
        <h4>{metrics.edgeLocation}</h4>
        <div className={`status ${getStatusClass(metrics.hitRate)}`}>
          {getStatus(metrics.hitRate)}
        </div>
      </div>
      
      <div className="edge-metrics">
        <div className="edge-metric">
          <span>Hit Rate</span>
          <span>{metrics.hitRate.toFixed(1)}%</span>
        </div>
        <div className="edge-metric">
          <span>Requests</span>
          <span>{metrics.totalRequests.toLocaleString()}</span>
        </div>
        <div className="edge-metric">
          <span>Avg Response</span>
          <span>{metrics.avgResponseTime.toFixed(0)}ms</span>
        </div>
        <div className="edge-metric">
          <span>Error Rate</span>
          <span>{metrics.errorRate.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};

const formatBandwidth = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

const getStatus = (hitRate: number): string => {
  if (hitRate >= 90) return 'Excellent';
  if (hitRate >= 80) return 'Good';
  if (hitRate >= 70) return 'Fair';
  return 'Poor';
};

const getStatusClass = (hitRate: number): string => {
  if (hitRate >= 90) return 'excellent';
  if (hitRate >= 80) return 'good';
  if (hitRate >= 70) return 'fair';
  return 'poor';
};
