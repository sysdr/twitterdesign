import React, { useState, useEffect } from 'react';
import { CacheStats } from '../../types';
import { MetricsPanel } from '../MetricsPanel/MetricsPanel';
import { CacheViewer } from '../CacheViewer/CacheViewer';
import './CacheDashboard.css';

interface CacheDashboardProps {
  onStatsUpdate?: (stats: CacheStats) => void;
}

export const CacheDashboard: React.FC<CacheDashboardProps> = ({ onStatsUpdate }) => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connectToMetrics = async () => {
      try {
        const response = await fetch('/api/cache/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setIsConnected(true);
          onStatsUpdate?.(data);
        }
      } catch (error) {
        console.error('Failed to connect to cache metrics:', error);
        setIsConnected(false);
      }
    };

    connectToMetrics();
    const interval = setInterval(connectToMetrics, 2000);
    
    return () => clearInterval(interval);
  }, [onStatsUpdate]);

  const handleTestCache = async () => {
    try {
      await fetch('/api/cache/test', { method: 'POST' });
    } catch (error) {
      console.error('Cache test failed:', error);
    }
  };

  const handleWarmCache = async () => {
    try {
      await fetch('/api/cache/warm', { method: 'POST' });
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  };

  if (!stats) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading cache dashboard...</p>
      </div>
    );
  }

  return (
    <div className="cache-dashboard">
      <header className="dashboard-header">
        <h1>🚀 Advanced Cache System Dashboard</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </header>

      <div className="dashboard-controls">
        <button onClick={handleTestCache} className="control-button test-button">
          🧪 Test Cache Performance
        </button>
        <button onClick={handleWarmCache} className="control-button warm-button">
          🔥 Trigger Cache Warming
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="metrics-section">
          <MetricsPanel stats={stats} />
        </div>
        
        <div className="cache-viewer-section">
          <CacheViewer stats={stats} />
        </div>
      </div>

      <div className="performance-summary">
        <div className="summary-card">
          <h3>📊 Performance Summary</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Hit Rate:</span>
              <span className={`stat-value ${stats.hitRate > 99 ? 'excellent' : stats.hitRate > 95 ? 'good' : 'warning'}`}>
                {stats.hitRate.toFixed(2)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Requests:</span>
              <span className="stat-value">{stats.totalRequests.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bloom Filter Efficiency:</span>
              <span className="stat-value">
                {((1 - stats.bloomFilterStats.falsePositiveRate) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
