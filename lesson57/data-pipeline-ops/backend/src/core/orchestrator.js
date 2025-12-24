import { EventEmitter } from 'events';
import { DataIngestionManager } from './ingestion.js';
import { QualityValidator } from './validation.js';
import { TransformationEngine } from './transformation.js';
import { LineageTracker } from './lineage.js';
import { RecoveryManager } from './recovery.js';
import { StorageRouter } from './storage.js';

export class DataPipelineOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.ingestion = new DataIngestionManager();
    this.validator = new QualityValidator();
    this.transformer = new TransformationEngine();
    this.lineage = new LineageTracker();
    this.recovery = new RecoveryManager(this);
    this.storage = new StorageRouter();
    
    this.pipelines = new Map();
    this.state = 'stopped';
    this.metrics = {
      processed: 0,
      failed: 0,
      throughput: 0,
      errorRate: 0,
      latency: { p50: 0, p95: 0, p99: 0 }
    };
    this.latencyBuffer = [];
    this.maxLatencyBufferSize = 1000;
  }

  async start() {
    console.log('Starting Data Pipeline Orchestrator...');
    this.state = 'running';
    
    // Start ingestion pipelines
    await this.createPipeline('tweets', {
      source: 'tweet-events',
      validation: ['schema', 'range', 'freshness'],
      transformations: ['enrich-user', 'compute-metrics'],
      destinations: ['postgres', 's3']
    });
    
    await this.createPipeline('engagements', {
      source: 'engagement-events',
      validation: ['schema', 'range'],
      transformations: ['aggregate-metrics'],
      destinations: ['redis', 'postgres']
    });
    
    // Start processing loop
    this.processingLoop();
    
    console.log('✅ Pipeline orchestrator started');
  }

  async createPipeline(name, config) {
    const pipeline = {
      name,
      config,
      state: 'initializing',
      stats: { processed: 0, failed: 0, latency: [] }
    };
    
    this.pipelines.set(name, pipeline);
    pipeline.state = 'active';
    
    return pipeline;
  }

  async processingLoop() {
    while (this.state === 'running') {
      try {
        // Ingest batch of events
        const events = await this.ingestion.fetchBatch(100);
        
        for (const event of events) {
          const startTime = Date.now();
          
          try {
            // Validate data quality
            const validation = await this.validator.validate(event);
            
            if (!validation.valid) {
              this.metrics.failed++;
              await this.recovery.handleValidationFailure(event, validation);
              continue;
            }
            
            // Track lineage
            await this.lineage.recordIngestion(event);
            
            // Transform data
            const transformed = await this.transformer.transform(event);
            await this.lineage.recordTransformation(event.id, 'transform', transformed.id);
            
            // Route to storage
            await this.storage.route(transformed);
            await this.lineage.recordStorage(transformed.id, transformed.destinations);
            
            // Update metrics
            this.metrics.processed++;
            const latency = Date.now() - startTime;
            
            // Record latency
            this.latencyBuffer.push(latency);
            if (this.latencyBuffer.length > this.maxLatencyBufferSize) {
              this.latencyBuffer.shift();
            }
            
            this.updateMetrics(latency);
            
          } catch (error) {
            this.metrics.failed++;
            await this.recovery.handleProcessingError(event, error);
          }
        }
        
        await this.sleep(10);
        
      } catch (error) {
        console.error('Processing loop error:', error);
        await this.recovery.handleSystemError(error);
      }
    }
  }

  updateMetrics(latency) {
    const now = Date.now();
    if (!this.lastMetricUpdate) {
      this.lastMetricUpdate = now;
      this.lastProcessedCount = this.metrics.processed;
      this.lastFailedCount = this.metrics.failed;
      return;
    }
    
    // Calculate latency percentiles
    if (this.latencyBuffer.length > 0) {
      const sorted = [...this.latencyBuffer].sort((a, b) => a - b);
      const p50Index = Math.floor(sorted.length * 0.5);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);
      
      this.metrics.latency = {
        p50: sorted[p50Index] || 0,
        p95: sorted[p95Index] || 0,
        p99: sorted[p99Index] || 0
      };
    }
    
    const elapsed = (now - this.lastMetricUpdate) / 1000;
    if (elapsed >= 1) {
      // Calculate throughput as events per second (delta)
      const processedDelta = this.metrics.processed - (this.lastProcessedCount || 0);
      this.metrics.throughput = Math.round(processedDelta / elapsed);
      
      // Calculate error rate as percentage
      const total = this.metrics.processed + this.metrics.failed;
      this.metrics.errorRate = total > 0 
        ? parseFloat((this.metrics.failed / total * 100).toFixed(2))
        : 0;
      
      // Update tracking variables
      this.lastMetricUpdate = now;
      this.lastProcessedCount = this.metrics.processed;
      this.lastFailedCount = this.metrics.failed;
    }
    
    this.emit('metrics', this.metrics);
  }

  async shutdown() {
    console.log('Shutting down pipeline orchestrator...');
    this.state = 'stopping';
    await this.ingestion.close();
    await this.storage.close();
    console.log('✅ Graceful shutdown complete');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      state: this.state,
      pipelines: Array.from(this.pipelines.entries()).map(([name, p]) => ({
        name,
        state: p.state,
        stats: p.stats
      })),
      metrics: this.metrics
    };
  }
}
