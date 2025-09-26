import React, { useState, useEffect } from 'react';

interface CacheAnalyticsData {
  hitRateHistory: Array<{ timestamp: number; hitRate: number }>;
  topCachedContent: Array<{ key: string; hits: number; size: number }>;
  invalidationEvents: Array<{ type: string; count: number }>;
}

export const CacheAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<CacheAnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/cdn/analytics?range=${timeRange}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  return (
    <div className="cache-analytics">
      <div className="analytics-header">
        <h3>Cache Analytics</h3>
        <div className="time-range-selector">
          <button 
            className={timeRange === '1h' ? 'active' : ''}
            onClick={() => setTimeRange('1h')}
          >
            1H
          </button>
          <button 
            className={timeRange === '6h' ? 'active' : ''}
            onClick={() => setTimeRange('6h')}
          >
            6H
          </button>
          <button 
            className={timeRange === '24h' ? 'active' : ''}
            onClick={() => setTimeRange('24h')}
          >
            24H
          </button>
        </div>
      </div>

      {analytics && (
        <>
          <div className="hit-rate-chart">
            <h4>Hit Rate Over Time</h4>
            <div className="chart-container">
              <HitRateChart data={analytics.hitRateHistory} />
            </div>
          </div>

          <div className="top-content">
            <h4>Most Cached Content</h4>
            <div className="content-list">
              {analytics.topCachedContent.map((item, index) => (
                <div key={item.key} className="content-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="key">{item.key}</span>
                  <span className="hits">{item.hits} hits</span>
                  <span className="size">{formatSize(item.size)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="invalidation-stats">
            <h4>Invalidation Events</h4>
            <div className="invalidation-grid">
              {analytics.invalidationEvents.map((event) => (
                <div key={event.type} className="invalidation-item">
                  <span className="type">{event.type}</span>
                  <span className="count">{event.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const HitRateChart: React.FC<{ data: Array<{ timestamp: number; hitRate: number }> }> = ({ data }) => {
  if (!data.length) return <div>No data available</div>;

  const validData = data.filter(d => !isNaN(d.hitRate) && isFinite(d.hitRate));
  if (!validData.length) return <div>No valid data available</div>;

  const maxHitRate = Math.max(...validData.map(d => d.hitRate));
  const minHitRate = Math.min(...validData.map(d => d.hitRate));
  
  // Ensure we have a valid range
  if (maxHitRate === minHitRate) {
    return <div>No variation in data</div>;
  }

  return (
    <div className="hit-rate-chart-svg">
      <svg width="100%" height="200" viewBox="0 0 800 200">
        <defs>
          <linearGradient id="hitRateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Chart lines */}
        <polyline
          fill="none"
          stroke="#4CAF50"
          strokeWidth="2"
          points={validData.map((point, index) => {
            const x = (index / (validData.length - 1)) * 780 + 10;
            const y = 190 - ((point.hitRate - minHitRate) / (maxHitRate - minHitRate)) * 180;
            return `${x},${y}`;
          }).join(' ')}
        />
        
        {/* Chart area */}
        <polygon
          fill="url(#hitRateGradient)"
          points={`10,190 ${validData.map((point, index) => {
            const x = (index / (validData.length - 1)) * 780 + 10;
            const y = 190 - ((point.hitRate - minHitRate) / (maxHitRate - minHitRate)) * 180;
            return `${x},${y}`;
          }).join(' ')} 790,190`}
        />
      </svg>
    </div>
  );
};

const formatSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};
