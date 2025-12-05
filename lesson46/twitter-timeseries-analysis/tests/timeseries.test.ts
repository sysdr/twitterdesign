import { describe, it, expect } from 'vitest';
import { Statistics } from '../src/utils/statistics';
import { AnomalyDetector } from '../src/services/AnomalyDetector';
import { ForecastEngine } from '../src/services/ForecastEngine';

describe('Statistics', () => {
  it('calculates mean correctly', () => {
    const values = [1, 2, 3, 4, 5];
    expect(Statistics.mean(values)).toBe(3);
  });

  it('calculates standard deviation', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const stdDev = Statistics.standardDeviation(values);
    expect(stdDev).toBeCloseTo(2, 0);
  });

  it('calculates z-score', () => {
    const zScore = Statistics.zScore(10, 5, 2);
    expect(zScore).toBe(2.5);
  });
});

describe('AnomalyDetector', () => {
  it('detects high anomalies', () => {
    const detector = new AnomalyDetector();
    
    // Add normal values
    for (let i = 0; i < 100; i++) {
      detector.detect(Date.now(), 100 + (Math.random() - 0.5) * 10);
    }
    
    // Add anomalous value
    const result = detector.detect(Date.now(), 300);
    expect(result.isAnomaly).toBe(true);
    expect(result.severity).toBe('high');
  });

  it('does not flag normal values as anomalies', () => {
    const detector = new AnomalyDetector();
    
    // Add many normal values
    for (let i = 0; i < 100; i++) {
      const result = detector.detect(Date.now(), 100 + (Math.random() - 0.5) * 5);
      if (i > 50) { // After warmup period
        expect(result.isAnomaly).toBe(false);
      }
    }
  });
});

describe('ForecastEngine', () => {
  it('generates forecasts with confidence intervals', () => {
    const engine = new ForecastEngine();
    
    // Add some data
    for (let i = 0; i < 100; i++) {
      engine.addDataPoint(100 + Math.sin(i / 10) * 20);
    }
    
    const forecasts = engine.forecast(10);
    expect(forecasts.length).toBe(10);
    
    forecasts.forEach(f => {
      expect(f.confidenceUpper).toBeGreaterThan(f.predicted);
      expect(f.confidenceLower).toBeLessThan(f.predicted);
    });
  });
});
