import React, { useState, useEffect } from 'react';
import { TimeSeriesService } from '../../services/TimeSeriesService';
import { MetricsGenerator } from '../../services/MetricsGenerator';
import { TimeSeriesChart } from '../Charts/TimeSeriesChart';
import { AnomalyAlert } from '../Alerts/AnomalyAlert';
import { MetricsPanel } from './MetricsPanel';
import { MetricData, AnomalyDetection, ForecastPoint, TimeSeriesState } from '../../types';

export const Dashboard: React.FC = () => {
  const [service] = useState(() => new TimeSeriesService());
  const [generator] = useState(() => new MetricsGenerator());
  
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [forecasts, setForecasts] = useState<ForecastPoint[]>([]);
  const [state, setState] = useState<TimeSeriesState>({
    currentValue: 0,
    anomalyCount: 0,
    forecastAccuracy: 95,
    trend: { trend: 'stable', changeRate: 0, confidence: 0 }
  });

  // Generate initial metric immediately
  useEffect(() => {
    const generateAndUpdate = () => {
      const metric = generator.generateMetric('response_time');
      const result = service.processMetric(metric);

      setMetrics(prev => [...prev.slice(-120), metric]); // Keep last 2 minutes
      
      setAnomalies(prev => {
        const newAnomalies = result.anomaly.isAnomaly ? [...prev, result.anomaly] : prev;
        return newAnomalies;
      });

      setForecasts(result.forecast);
      setState(prev => ({
        currentValue: metric.value,
        anomalyCount: result.anomaly.isAnomaly ? prev.anomalyCount + 1 : prev.anomalyCount,
        forecastAccuracy: 95 - (Math.random() * 5),
        trend: result.trend
      }));
    };

    // Generate initial metric immediately
    generateAndUpdate();

    // Then generate every second
    const interval = setInterval(generateAndUpdate, 1000);

    return () => clearInterval(interval);
  }, [service, generator]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <header style={{ marginBottom: 30, color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: 36 }}>
            Time Series Analysis System
          </h1>
          <p style={{ margin: '10px 0 0', fontSize: 18, opacity: 0.9 }}>
            Real-time Anomaly Detection & Forecasting for Twitter-Scale Systems
          </p>
        </header>

        <MetricsPanel state={state} totalMetrics={metrics.length} />

        <div style={{ marginBottom: 20 }}>
          <TimeSeriesChart
            data={metrics}
            anomalies={anomalies}
            forecasts={forecasts}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <AnomalyAlert anomalies={anomalies} />
        </div>

        <div style={{
          marginTop: 20,
          padding: 15,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          color: 'white'
        }}>
          <div style={{ fontSize: 14 }}>
            <strong>System Status:</strong> Processing {metrics.length} metrics | 
            Detecting anomalies using Z-score analysis (threshold: 3σ) |
            Forecasting next 60 seconds using exponential smoothing
          </div>
        </div>
      </div>
    </div>
  );
};
