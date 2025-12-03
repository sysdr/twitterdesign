// Comprehensive test suite for Failure Probability System

import { MetricsCollector } from '../src/collectors/MetricsCollector';
import { StatisticalAnalyzer } from '../src/analyzers/StatisticalAnalyzer';
import { FailurePredictor } from '../src/predictors/FailurePredictor';
import { RedundancyOptimizer } from '../src/optimizers/RedundancyOptimizer';

describe('Failure Probability Analysis System', () => {
  
  describe('MetricsCollector', () => {
    test('collects metrics correctly', (done) => {
      const collector = new MetricsCollector(100);
      
      collector.startCollection((metric) => {
        expect(metric.timestamp).toBeDefined();
        expect(metric.cpuUsage).toBeGreaterThanOrEqual(0);
        expect(metric.cpuUsage).toBeLessThanOrEqual(100);
        expect(metric.memoryUsage).toBeGreaterThanOrEqual(0);
        done();
      });
      
      collector.simulateLoad(50);
    });
    
    test('tracks recent metrics', () => {
      const collector = new MetricsCollector();
      const recent = collector.getRecentMetrics(10);
      expect(Array.isArray(recent)).toBe(true);
    });
  });
  
  describe('StatisticalAnalyzer', () => {
    test('fits exponential distribution', () => {
      const analyzer = new StatisticalAnalyzer();
      const collector = new MetricsCollector();
      
      // Generate sample metrics
      for (let i = 0; i < 50; i++) {
        collector.simulateLoad(Math.random() * 100);
      }
      
      const metrics = collector.getAllMetrics();
      const distribution = analyzer.fitExponentialDistribution(metrics);
      
      expect(distribution.type).toBe('exponential');
      expect(distribution.lambda).toBeGreaterThan(0);
      expect(distribution.aic).toBeDefined();
    });
    
    test('analyzes failure rate trends', () => {
      const analyzer = new StatisticalAnalyzer();
      const collector = new MetricsCollector();
      
      // Generate increasing load pattern
      for (let i = 0; i < 100; i++) {
        collector.simulateLoad(i);
      }
      
      const metrics = collector.getAllMetrics();
      const analysis = analyzer.analyzeFailureRate(metrics);
      
      expect(analysis.currentFailureRate).toBeDefined();
      expect(['increasing', 'stable', 'decreasing']).toContain(analysis.trend);
      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });
  });
  
  describe('FailurePredictor', () => {
    test('generates predictions with correct structure', () => {
      const predictor = new FailurePredictor();
      const analyzer = new StatisticalAnalyzer();
      const collector = new MetricsCollector();
      
      for (let i = 0; i < 50; i++) {
        collector.simulateLoad(60);
      }
      
      const metrics = collector.getAllMetrics();
      const analysis = analyzer.analyzeFailureRate(metrics);
      const prediction = predictor.predict(metrics, analysis);
      
      expect(prediction.probability1Hour).toBeGreaterThanOrEqual(0);
      expect(prediction.probability1Hour).toBeLessThanOrEqual(1);
      expect(prediction.timeToFailure).toBeGreaterThanOrEqual(0);
      expect(['low', 'medium', 'high', 'critical']).toContain(prediction.riskLevel);
      expect(Array.isArray(prediction.recommendations)).toBe(true);
    });
    
    test('increases probability under high load', () => {
      const predictor = new FailurePredictor();
      const analyzer = new StatisticalAnalyzer();
      const collector = new MetricsCollector();
      
      // Low load scenario
      for (let i = 0; i < 30; i++) {
        collector.simulateLoad(20);
      }
      const lowLoadMetrics = collector.getAllMetrics();
      const lowLoadAnalysis = analyzer.analyzeFailureRate(lowLoadMetrics);
      const lowLoadPrediction = predictor.predict(lowLoadMetrics, lowLoadAnalysis);
      
      // High load scenario
      for (let i = 0; i < 30; i++) {
        collector.simulateLoad(90);
      }
      const highLoadMetrics = collector.getAllMetrics();
      const highLoadAnalysis = analyzer.analyzeFailureRate(highLoadMetrics);
      const highLoadPrediction = predictor.predict(highLoadMetrics, highLoadAnalysis);
      
      expect(highLoadPrediction.probability1Hour).toBeGreaterThan(lowLoadPrediction.probability1Hour);
    });
  });
  
  describe('RedundancyOptimizer', () => {
    test('scales instances based on risk level', () => {
      const optimizer = new RedundancyOptimizer();
      
      const lowRiskPrediction = {
        probability1Hour: 0.005,
        probability6Hour: 0.02,
        probability24Hour: 0.08,
        timeToFailure: 50,
        riskLevel: 'low' as const,
        recommendations: [],
        confidence: 0.9
      };
      
      const highRiskPrediction = {
        probability1Hour: 0.25,
        probability6Hour: 0.50,
        probability24Hour: 0.80,
        timeToFailure: 2,
        riskLevel: 'critical' as const,
        recommendations: [],
        confidence: 0.95
      };
      
      const lowRiskConfig = optimizer.optimizeRedundancy(lowRiskPrediction);
      const highRiskConfig = optimizer.optimizeRedundancy(highRiskPrediction);
      
      expect(highRiskConfig.activeInstances).toBeGreaterThan(lowRiskConfig.activeInstances);
      expect(highRiskConfig.standbyInstances).toBeGreaterThan(lowRiskConfig.standbyInstances);
      expect(highRiskConfig.circuitBreakerEnabled).toBe(true);
    });
    
    test('calculates system reliability correctly', () => {
      const optimizer = new RedundancyOptimizer();
      
      // Parallel system reliability
      const reliability = optimizer.calculateSystemReliability(0.99, 3, 'parallel');
      expect(reliability).toBeGreaterThan(0.99);
      
      // Series system reliability
      const seriesReliability = optimizer.calculateSystemReliability(0.99, 3, 'series');
      expect(seriesReliability).toBeLessThan(0.99);
    });
  });
  
  describe('Integration Tests', () => {
    test('complete system workflow', (done) => {
      const collector = new MetricsCollector(100);
      const analyzer = new StatisticalAnalyzer();
      const predictor = new FailurePredictor();
      const optimizer = new RedundancyOptimizer();
      
      let updateCount = 0;
      
      collector.startCollection((metric) => {
        updateCount++;
        
        if (updateCount === 20) {
          const metrics = collector.getAllMetrics();
          const analysis = analyzer.analyzeFailureRate(metrics);
          const prediction = predictor.predict(metrics, analysis);
          const redundancy = optimizer.optimizeRedundancy(prediction);
          
          expect(prediction).toBeDefined();
          expect(redundancy).toBeDefined();
          expect(redundancy.activeInstances).toBeGreaterThan(0);
          
          done();
        }
      });
      
      collector.simulateLoad(70);
    }, 10000);
  });
});
