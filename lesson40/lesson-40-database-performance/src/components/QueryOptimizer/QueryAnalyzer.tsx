import React, { useState, useEffect } from 'react';
import { QueryOptimizerService } from '../../services/QueryOptimizerService';
import { QueryStats } from '../../types';

interface Props {
  onQueryExecuted: (stats: QueryStats) => void;
}

export const QueryAnalyzer: React.FC<Props> = ({ onQueryExecuted }) => {
  const [service] = useState(() => {
    const s = new QueryOptimizerService();
    s.initializeSampleData();
    return s;
  });
  
  const [queryHistory, setQueryHistory] = useState<QueryStats[]>([]);
  const [selectedQuery, setSelectedQuery] = useState('');
  
  const sampleQueries = [
    "SELECT * FROM users WHERE id = 123",
    "SELECT * FROM users WHERE created_at > '2024-01-01'",
    "SELECT * FROM tweets WHERE user_id = 456",
    "SELECT * FROM tweets WHERE content LIKE '%hello%'",
    "SELECT COUNT(*) FROM users"
  ];
  
  const executeQuery = () => {
    if (!selectedQuery) return;
    
    const stats = service.executeQuery(selectedQuery);
    setQueryHistory(service.getQueryHistory());
    onQueryExecuted(stats);
  };
  
  useEffect(() => {
    // Run sample queries on mount
    sampleQueries.forEach(q => service.executeQuery(q));
    setQueryHistory(service.getQueryHistory());
  }, []);
  
  const accuracy = service.getEstimationAccuracy();
  const recommendations = service.getIndexRecommendations();
  
  return (
    <div style={{
      padding: '20px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1a1a2e' }}>Query Cost Analyzer</h3>
      
      {/* Query Input */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={selectedQuery}
          onChange={(e) => setSelectedQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            marginBottom: '10px'
          }}
        >
          <option value="">Select a query...</option>
          {sampleQueries.map((q, i) => (
            <option key={i} value={q}>{q}</option>
          ))}
        </select>
        
        <button
          onClick={executeQuery}
          disabled={!selectedQuery}
          style={{
            padding: '10px 20px',
            background: selectedQuery ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedQuery ? 'pointer' : 'not-allowed',
            fontWeight: '600'
          }}
        >
          Execute Query
        </button>
      </div>
      
      {/* Estimation Accuracy */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px' }}>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Avg Estimation Error</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e40af' }}>
            {(accuracy.avgError * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '8px' }}>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Max Estimation Error</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
            {(accuracy.maxError * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Query History */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Recent Queries</h4>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {queryHistory.slice(-5).reverse().map((q, i) => (
            <div key={i} style={{
              padding: '10px',
              background: '#f9fafb',
              borderRadius: '6px',
              marginBottom: '8px',
              fontSize: '13px'
            }}>
              <div style={{ fontFamily: 'monospace', marginBottom: '5px', color: '#374151' }}>
                {q.sql.substring(0, 50)}{q.sql.length > 50 ? '...' : ''}
              </div>
              <div style={{ display: 'flex', gap: '15px', color: '#6b7280' }}>
                <span>Est: {q.estimatedCost.toFixed(0)}</span>
                <span>Act: {q.actualCost.toFixed(0)}</span>
                <span>Time: {q.executionTime.toFixed(1)}ms</span>
                <span>Rows: {q.actualRows}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Index Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 10px 0' }}>Index Recommendations</h4>
          {recommendations.map((rec, i) => (
            <div key={i} style={{
              padding: '10px',
              background: '#f0fdf4',
              borderRadius: '6px',
              marginBottom: '8px',
              borderLeft: '4px solid #22c55e'
            }}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{rec.reasoning}</div>
              <div style={{ fontSize: '13px', color: '#059669' }}>{rec.expectedImprovement}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
