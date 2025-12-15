import React from 'react';
import axios from 'axios';

function BackupManager({ stats, onRefresh }) {
  const handleBackup = async (type) => {
    try {
      await axios.post(`http://localhost:3001/api/backup/${type}`);
      onRefresh();
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <span>💾</span> Backup Manager
        </h2>
        <div>
          <button 
            className="btn btn-primary"
            onClick={() => handleBackup('full')}
            disabled={stats.backupRunning}
          >
            Full Backup
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-item">
          <div className="stat-label">Total Backups</div>
          <div className="stat-value">{stats.totalBackups}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Success Rate</div>
          <div className="stat-value">{stats.successRate}%</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Data Backed Up</div>
          <div className="stat-value">
            {(stats.totalDataBacked / 1024 / 1024).toFixed(2)}
            <span className="stat-unit">MB</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{fontSize: '16px'}}>
            {stats.backupRunning ? '🔄 Running' : '✓ Ready'}
          </div>
        </div>
      </div>

      {stats.lastBackup && (
        <div style={{marginTop: '15px', padding: '12px', background: '#f8f9fa', borderRadius: '6px'}}>
          <div style={{fontSize: '12px', color: '#666', marginBottom: '5px'}}>
            LAST BACKUP
          </div>
          <div style={{fontSize: '14px', color: '#2c3e50'}}>
            Type: {stats.lastBackup.type.toUpperCase()} | 
            Size: {(stats.lastBackup.size / 1024).toFixed(2)} KB | 
            Time: {new Date(stats.lastBackup.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default BackupManager;
