// Main Failure Probability Analysis System

import { MetricsCollector } from './collectors/MetricsCollector';
import { StatisticalAnalyzer } from './analyzers/StatisticalAnalyzer';
import { FailurePredictor } from './predictors/FailurePredictor';
import { RedundancyOptimizer } from './optimizers/RedundancyOptimizer';
import express from 'express';
import { WebSocketServer } from 'ws';
import * as http from 'http';
import * as path from 'path';

export class FailureProbabilitySystem {
  private collector: MetricsCollector;
  private analyzer: StatisticalAnalyzer;
  private predictor: FailurePredictor;
  private optimizer: RedundancyOptimizer;
  private wsServer: WebSocketServer | null = null;
  private predictionHistory: any[] = [];
  
  constructor() {
    this.collector = new MetricsCollector(1000); // Collect every second
    this.analyzer = new StatisticalAnalyzer();
    this.predictor = new FailurePredictor();
    this.optimizer = new RedundancyOptimizer();
  }
  
  async start(port: number = 3000): Promise<void> {
    const app = express();
    const server = http.createServer(app);
    
    // WebSocket server for real-time updates
    this.wsServer = new WebSocketServer({ server });
    
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(express.json());
    
    // API endpoints
    app.get('/api/current-prediction', (req, res) => {
      const metrics = this.collector.getAllMetrics();
      if (metrics.length === 0) {
        return res.json({
          probability1Hour: 0.001,
          riskLevel: 'low',
          recommendations: ['System initializing...']
        });
      }
      
      const analysis = this.analyzer.analyzeFailureRate(metrics);
      const prediction = this.predictor.predict(metrics, analysis);
      const redundancy = this.optimizer.optimizeRedundancy(prediction);
      
      res.json({
        prediction,
        analysis,
        redundancy,
        currentMetrics: metrics[metrics.length - 1]
      });
    });
    
    app.get('/api/metrics-history', (req, res) => {
      const count = parseInt(req.query.count as string) || 100;
      res.json(this.collector.getRecentMetrics(count));
    });
    
    app.get('/api/prediction-history', (req, res) => {
      res.json(this.predictionHistory);
    });
    
    app.post('/api/simulate-load', (req, res) => {
      const { load } = req.body;
      this.collector.simulateLoad(load);
      res.json({ success: true, load });
    });
    
    app.post('/api/inject-error', (req, res) => {
      this.collector.injectError();
      res.json({ success: true });
    });
    
    // Start metrics collection
    this.collector.startCollection((metric) => {
      // Analyze and predict every 10 seconds
      if (metric.timestamp % 10000 < 1000) {
        this.performAnalysisAndPredict();
      }
      
      // Send real-time updates to all connected clients
      this.broadcastUpdate({
        type: 'metric',
        data: metric
      });
    });
    
    // Start server
    server.listen(port, () => {
      console.log(`\n✓ Failure Probability System running on http://localhost:${port}`);
      console.log('  Dashboard: http://localhost:${port}');
      console.log('  API: http://localhost:${port}/api/current-prediction\n');
    });
  }
  
  private performAnalysisAndPredict(): void {
    const metrics = this.collector.getAllMetrics();
    if (metrics.length < 10) return;
    
    const analysis = this.analyzer.analyzeFailureRate(metrics);
    const prediction = this.predictor.predict(metrics, analysis);
    const redundancy = this.optimizer.optimizeRedundancy(prediction);
    
    // Store prediction history
    this.predictionHistory.push({
      timestamp: Date.now(),
      ...prediction,
      redundancy
    });
    
    // Keep last 1000 predictions
    if (this.predictionHistory.length > 1000) {
      this.predictionHistory.shift();
    }
    
    // Broadcast prediction
    this.broadcastUpdate({
      type: 'prediction',
      data: { prediction, analysis, redundancy }
    });
    
    // Log significant events
    if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
      console.log(`\n⚠️  ${prediction.riskLevel.toUpperCase()} RISK DETECTED`);
      console.log(`   Failure Probability (1hr): ${(prediction.probability1Hour * 100).toFixed(2)}%`);
      console.log(`   Recommendations:`);
      prediction.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
      console.log();
    }
  }
  
  private broadcastUpdate(message: any): void {
    if (!this.wsServer) return;
    
    const data = JSON.stringify(message);
    this.wsServer.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    });
  }
}

// Start system if run directly
if (require.main === module) {
  const system = new FailureProbabilitySystem();
  system.start(3000).catch(console.error);
}
