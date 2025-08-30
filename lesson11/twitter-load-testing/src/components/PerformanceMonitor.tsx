import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface QueryPerformance {
  query: string;
  avg_time: number;
  call_count: number;
  total_time: number;
}

const PerformanceMonitor: React.FC = () => {
  const [queryMetrics, setQueryMetrics] = useState<QueryPerformance[]>([]);
  const [connectionMetrics, setConnectionMetrics] = useState({
    total: 0,
    idle: 0,
    waiting: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [queryResponse, connectionResponse] = await Promise.all([
          fetch('/api/metrics/queries'),
          fetch('/api/metrics/connections')
        ]);
        
        if (queryResponse.ok) {
          const queryData = await queryResponse.json();
          setQueryMetrics(queryData);
        }
        
        if (connectionResponse.ok) {
          const connectionData = await connectionResponse.json();
          setConnectionMetrics(connectionData);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-monitor">
      <h2>Performance Monitoring</h2>
      
      <div className="connection-metrics">
        <h3>Database Connection Pool</h3>
        <div className="connection-stats">
          <div className="stat-item">
            <label>Total Connections:</label>
            <span>{connectionMetrics.total}</span>
          </div>
          <div className="stat-item">
            <label>Idle Connections:</label>
            <span>{connectionMetrics.idle}</span>
          </div>
          <div className="stat-item">
            <label>Waiting Clients:</label>
            <span>{connectionMetrics.waiting}</span>
          </div>
        </div>
      </div>

      <div className="query-performance">
        <h3>Database Query Performance</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={queryMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="query" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avg_time" fill="#8884d8" name="Avg Time (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="optimization-recommendations">
        <h3>Optimization Recommendations</h3>
        <div className="recommendations-list">
          {queryMetrics
            .filter(q => q.avg_time > 100)
            .map((query, index) => (
              <div key={index} className="recommendation-item">
                <strong>Slow Query Detected:</strong> {query.query}
                <br />
                <span>Average time: {query.avg_time.toFixed(2)}ms</span>
                <br />
                <em>Recommendation: Add indexes or optimize query structure</em>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
