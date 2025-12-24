export class LineageTracker {
  constructor() {
    this.lineageGraph = new Map();
    this.operations = [];
  }

  async recordIngestion(event) {
    const record = {
      id: event.id,
      operation: 'ingest',
      source: 'data-stream',
      timestamp: Date.now(),
      metadata: {
        type: event.type,
        userId: event.userId
      }
    };
    
    this.lineageGraph.set(event.id, [record]);
    this.operations.push(record);
    
    // Keep only last 10000 operations in memory
    if (this.operations.length > 10000) {
      this.operations = this.operations.slice(-10000);
    }
  }

  async recordTransformation(sourceId, operation, destinationId) {
    const record = {
      id: destinationId,
      operation,
      source: sourceId,
      timestamp: Date.now()
    };
    
    const lineage = this.lineageGraph.get(sourceId) || [];
    lineage.push(record);
    this.lineageGraph.set(destinationId, lineage);
    this.operations.push(record);
  }

  async recordStorage(eventId, destinations) {
    for (const dest of destinations) {
      const record = {
        id: `${eventId}_${dest}`,
        operation: 'store',
        source: eventId,
        destination: dest,
        timestamp: Date.now()
      };
      
      const lineage = this.lineageGraph.get(eventId) || [];
      lineage.push(record);
      this.operations.push(record);
    }
  }

  async getLineage(eventId) {
    return this.lineageGraph.get(eventId) || [];
  }

  getRecentOperations(limit = 100) {
    return this.operations.slice(-limit);
  }

  getStats() {
    return {
      totalOperations: this.operations.length,
      trackedEvents: this.lineageGraph.size,
      recentOperations: this.getRecentOperations(10)
    };
  }
}
