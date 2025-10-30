import React from 'react';
import { CacheStats } from '../../types';

interface MetricsPanelProps {
  stats: CacheStats;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ stats }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="metrics-panel">
      <h2>📈 Real-time Metrics</h2>
      
      <div className="metrics-grid">
        <div className="metric-card overall">
          <h3>Overall Performance</h3>
          <div className="metric-row">
            <span>Hit Rate:</span>
            <span className={`metric-value ${stats.hitRate > 99 ? 'excellent' : 'good'}`}>
              {stats.hitRate.toFixed(2)}%
            </span>
          </div>
          <div className="metric-row">
            <span>Requests:</span>
            <span className="metric-value">{formatNumber(stats.totalRequests)}</span>
          </div>
          <div className="metric-row">
            <span>Hits:</span>
            <span className="metric-value success">{formatNumber(stats.totalHits)}</span>
          </div>
          <div className="metric-row">
            <span>Misses:</span>
            <span className="metric-value warning">{formatNumber(stats.totalMisses)}</span>
          </div>
        </div>

        {Object.entries(stats.tierStats).map(([tier, tierStats]) => (
          <div key={tier} className={`metric-card tier-${tier.toLowerCase()}`}>
            <h3>{tier} Cache</h3>
            <div className="metric-row">
              <span>Entries:</span>
              <span className="metric-value">{formatNumber(tierStats.entries)}</span>
            </div>
            <div className="metric-row">
              <span>Hits:</span>
              <span className="metric-value success">{formatNumber(tierStats.hits)}</span>
            </div>
            <div className="metric-row">
              <span>Misses:</span>
              <span className="metric-value warning">{formatNumber(tierStats.misses)}</span>
            </div>
            <div className="metric-row">
              <span>Hit Rate:</span>
              <span className="metric-value">
                {tierStats.hits + tierStats.misses > 0 
                  ? ((tierStats.hits / (tierStats.hits + tierStats.misses)) * 100).toFixed(1)
                  : '0'}%
              </span>
            </div>
          </div>
        ))}

        <div className="metric-card bloom-filter">
          <h3>🌸 Bloom Filter</h3>
          <div className="metric-row">
            <span>Memory:</span>
            <span className="metric-value">{formatBytes(stats.bloomFilterStats.memoryUsage)}</span>
          </div>
          <div className="metric-row">
            <span>Checks:</span>
            <span className="metric-value">{formatNumber(stats.bloomFilterStats.totalChecks)}</span>
          </div>
          <div className="metric-row">
            <span>False Positive:</span>
            <span className="metric-value">
              {(stats.bloomFilterStats.falsePositiveRate * 100).toFixed(3)}%
            </span>
          </div>
          <div className="metric-row">
            <span>Efficiency:</span>
            <span className="metric-value excellent">
              {((1 - stats.bloomFilterStats.falsePositiveRate) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
