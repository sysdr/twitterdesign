import React, { useMemo } from 'react';

interface Props {
  metrics: any[];
  testResults: any[];
}

export const PerformanceDashboard: React.FC<Props> = ({ metrics, testResults }) => {
  const summary = useMemo(() => {
    if (metrics.length === 0) return null;

    const timingMetrics = metrics.filter(m => m.type === 'timing');
    const latencies = timingMetrics.map(m => m.value);
    
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const avg = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;

    return { p50, p95, p99, avg, count: latencies.length };
  }, [metrics]);

  const budgets = {
    p50: 30,
    p95: 50,
    p99: 75
  };

  const getStatusColor = (value: number, budget: number) => {
    const ratio = value / budget;
    if (ratio <= 0.8) return '#10b981';
    if (ratio <= 1.0) return '#f59e0b';
    return '#ef4444';
  };

  if (!summary) {
    return <div className="dashboard-empty">Collecting metrics...</div>;
  }

  return (
    <div className="performance-dashboard">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">P50 Latency</div>
          <div 
            className="metric-value"
            style={{ color: getStatusColor(summary.p50, budgets.p50) }}
          >
            {summary.p50.toFixed(1)}ms
          </div>
          <div className="metric-budget">Budget: {budgets.p50}ms</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">P95 Latency</div>
          <div 
            className="metric-value"
            style={{ color: getStatusColor(summary.p95, budgets.p95) }}
          >
            {summary.p95.toFixed(1)}ms
          </div>
          <div className="metric-budget">Budget: {budgets.p95}ms</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">P99 Latency</div>
          <div 
            className="metric-value"
            style={{ color: getStatusColor(summary.p99, budgets.p99) }}
          >
            {summary.p99.toFixed(1)}ms
          </div>
          <div className="metric-budget">Budget: {budgets.p99}ms</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Latency</div>
          <div className="metric-value">{summary.avg.toFixed(1)}ms</div>
          <div className="metric-budget">{summary.count} samples</div>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="recent-tests">
          <h3>Recent Test Results</h3>
          <div className="tests-list">
            {testResults.slice(-3).reverse().map((result, index) => (
              <div key={index} className="test-result">
                <div className="test-name">{result.testName}</div>
                <div className="test-stats">
                  <span>P95: {result.p95}ms</span>
                  <span>P99: {result.p99}ms</span>
                  <span>Throughput: {result.throughput.toFixed(1)} req/s</span>
                  <span className={result.budgetCompliance ? 'status-success' : 'status-error'}>
                    {result.budgetCompliance ? '✓ Compliant' : '✗ Violations'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
