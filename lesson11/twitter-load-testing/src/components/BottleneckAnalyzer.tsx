import React, { useState, useEffect } from 'react';
import { PerformanceBottleneck } from '../types';

const BottleneckAnalyzer: React.FC = () => {
  const [bottlenecks, setBottlenecks] = useState<PerformanceBottleneck[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBottlenecks = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/bottlenecks');
        if (response.ok) {
          const data = await response.json();
          setBottlenecks(data);
        }
      } catch (error) {
        console.error('Failed to fetch bottlenecks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBottlenecks();
    const interval = setInterval(fetchBottlenecks, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      case 'low': return '#44aa44';
      default: return '#666666';
    }
  };

  return (
    <div className="bottleneck-analyzer">
      <h2>Bottleneck Analysis</h2>
      
      {loading && <div className="loading">Analyzing performance bottlenecks...</div>}
      
      {bottlenecks.length === 0 && !loading && (
        <div className="no-bottlenecks">
          ✅ No performance bottlenecks detected!
        </div>
      )}

      <div className="bottlenecks-list">
        {bottlenecks.map((bottleneck, index) => (
          <div 
            key={index} 
            className="bottleneck-item"
            style={{ borderLeft: `4px solid ${getSeverityColor(bottleneck.severity)}` }}
          >
            <div className="bottleneck-header">
              <h3>{bottleneck.component}</h3>
              <span className={`severity-badge ${bottleneck.severity}`}>
                {bottleneck.severity.toUpperCase()}
              </span>
            </div>
            
            <div className="bottleneck-details">
              <div className="metric-info">
                <strong>Metric:</strong> {bottleneck.metric}
              </div>
              <div className="values">
                <span>Current: {bottleneck.current_value.toFixed(2)}</span>
                <span>Threshold: {bottleneck.threshold.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="recommendation">
              <strong>Recommendation:</strong>
              <p>{bottleneck.recommendation}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="analysis-summary">
        <h3>Performance Summary</h3>
        <div className="summary-stats">
          <div className="stat">
            <label>Critical Issues:</label>
            <span>{bottlenecks.filter(b => b.severity === 'critical').length}</span>
          </div>
          <div className="stat">
            <label>High Priority:</label>
            <span>{bottlenecks.filter(b => b.severity === 'high').length}</span>
          </div>
          <div className="stat">
            <label>Medium Priority:</label>
            <span>{bottlenecks.filter(b => b.severity === 'medium').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottleneckAnalyzer;
