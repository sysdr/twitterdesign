class BackupModel {
  constructor() {
    this.backups = [];
    this.currentId = 1;
  }

  create(backup) {
    const newBackup = {
      id: this.currentId++,
      timestamp: new Date().toISOString(),
      type: backup.type,
      size: backup.size,
      checksum: backup.checksum,
      status: 'completed',
      region: backup.region || 'primary',
      rpo: backup.rpo || 0
    };
    this.backups.push(newBackup);
    return newBackup;
  }

  getAll() {
    return this.backups.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  getLatest(type) {
    return this.backups
      .filter(b => b.type === type)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  }

  getStats() {
    return {
      total: this.backups.length,
      lastFullBackup: this.getLatest('full'),
      lastIncrementalBackup: this.getLatest('incremental'),
      lastWALBackup: this.getLatest('wal'),
      totalSize: this.backups.reduce((sum, b) => sum + (b.size || 0), 0)
    };
  }
}

module.exports = new BackupModel();
