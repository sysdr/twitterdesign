import React, { useState, useCallback } from 'react';
import { PoolManager } from '../ConnectionPool/PoolManager';
import { QueryAnalyzer } from '../QueryOptimizer/QueryAnalyzer';
import { PerformanceCharts } from '../Charts/PerformanceCharts';
import { PoolMetrics, QueryStats } from '../../types';

export const PerformanceDashboard: React.FC = () => {
  const [metricsHistory, setMetricsHistory] = useState<PoolMetrics[]>([]);
  const [lastQuery, setLastQuery] = useState<QueryStats | null>(null);
  
  const handleMetricsUpdate = useCallback((metrics: PoolMetrics) => {
    setMetricsHistory(prev => {
      const updated = [...prev, metrics];
      return updated.slice(-100);
    });
  }, []);
  
  const handleQueryExecuted = useCallback((stats: QueryStats) => {
    setLastQuery(stats);
  }, []);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '30px'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        color: 'white'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>
          Database Performance Modeling
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Little's Law • M/M/c Queuing • Query Cost Estimation
        </p>
      </div>
      
      {/* Little's Law Reference */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        padding: '15px 25px',
        borderRadius: '10px',
        marginBottom: '25px',
        textAlign: 'center'
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '600' }}>
          L = λ × W
        </span>
        <span style={{ marginLeft: '20px', color: '#6b7280' }}>
          (Connections in Use = Arrival Rate × Service Time)
        </span>
      </div>
      
      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '25px',
        marginBottom: '25px'
      }}>
        <PoolManager onMetricsUpdate={handleMetricsUpdate} />
        <QueryAnalyzer onQueryExecuted={handleQueryExecuted} />
      </div>
      
      {/* Charts */}
      <PerformanceCharts metricsHistory={metricsHistory} />
      
      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '25px',
        color: 'white',
        opacity: 0.8,
        fontSize: '14px'
      }}>
        Lesson 40: Mathematical Database Optimization | Twitter System Design Course
      </div>
    </div>
  );
};
