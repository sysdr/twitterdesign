import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stats } from '../types';

export function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(loadStats, 5000); // Update every 5 seconds
    loadStats();
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Failed to load stats');
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="stats-panel">
      <button 
        className="stats-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        📊 System Stats
      </button>
      
      {isOpen && (
        <div className="stats-dropdown">
          <h3>Real-Time System Statistics</h3>
          {isLoading && <div>Loading...</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {stats && (
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.onlineUsers}</div>
                <div className="stat-label">Online Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.activeConnections}</div>
                <div className="stat-label">WebSocket Connections</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.totalTweets}</div>
                <div className="stat-label">Total Tweets</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.totalEvents}</div>
                <div className="stat-label">Events Processed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{Math.round(stats.uptime)}s</div>
                <div className="stat-label">System Uptime</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
