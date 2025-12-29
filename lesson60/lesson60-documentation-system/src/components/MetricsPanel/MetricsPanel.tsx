import React from 'react';
import { DocumentationMetrics } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  metrics: DocumentationMetrics;
}

export const MetricsPanel: React.FC<Props> = ({ metrics }) => {
  const healthScore = (
    metrics.coverage * 0.4 +
    Math.max(0, 100 - metrics.freshness * 2) * 0.3 +
    metrics.accuracy * 0.3
  );

  const chartData = [
    { name: 'Coverage', value: metrics.coverage },
    { name: 'Accuracy', value: metrics.accuracy },
    { name: 'Freshness', value: Math.max(0, 100 - metrics.freshness * 2) }
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Documentation Health Metrics</h2>

      <div style={styles.scoreCard}>
        <div style={styles.scoreCircle}>
          <span style={styles.scoreValue}>{healthScore.toFixed(1)}</span>
          <span style={styles.scoreLabel}>Health Score</span>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard
          title="Coverage"
          value={`${metrics.coverage.toFixed(1)}%`}
          subtitle={`${metrics.documentedComponents}/${metrics.totalComponents} components`}
          color="#48bb78"
        />
        <MetricCard
          title="Accuracy"
          value={`${metrics.accuracy.toFixed(1)}%`}
          subtitle="Runbook success rate"
          color="#4299e1"
        />
        <MetricCard
          title="Freshness"
          value={`${metrics.freshness} days`}
          subtitle="Since last update"
          color="#ed8936"
        />
        <MetricCard
          title="Usage"
          value={metrics.usage.toString()}
          subtitle="Page views (30 days)"
          color="#9f7aea"
        />
      </div>

      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Documentation Quality Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#667eea" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.insights}>
        <h3 style={styles.insightTitle}>Key Insights</h3>
        <ul style={styles.insightList}>
          <li>✅ {metrics.documentedComponents} components fully documented</li>
          <li>{metrics.staleDocuments > 0 ? '⚠️' : '✅'} {metrics.staleDocuments} stale documents need updating</li>
          <li>📊 Average incident resolution: {metrics.timeToResolution.toFixed(1)} minutes</li>
          <li>🎯 Target: 95% coverage, 100% accuracy, &lt;7 day freshness</li>
        </ul>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  color: string;
}> = ({ title, value, subtitle, color }) => (
  <div style={{ ...styles.metricCard, borderLeft: `4px solid ${color}` }}>
    <h3 style={styles.metricTitle}>{title}</h3>
    <p style={{ ...styles.metricValue, color }}>{value}</p>
    <p style={styles.metricSubtitle}>{subtitle}</p>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px'
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '30px',
    textAlign: 'center'
  },
  scoreCard: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px'
  },
  scoreCircle: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white'
  },
  scoreLabel: {
    fontSize: '16px',
    color: 'white',
    opacity: 0.9,
    marginTop: '10px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  metricCard: {
    background: '#f7fafc',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  metricTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    marginBottom: '10px'
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  metricSubtitle: {
    fontSize: '14px',
    color: '#a0aec0'
  },
  chartContainer: {
    marginBottom: '40px'
  },
  chartTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '20px'
  },
  insights: {
    background: '#f7fafc',
    padding: '25px',
    borderRadius: '12px',
    borderLeft: '4px solid #667eea'
  },
  insightTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '15px'
  },
  insightList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  }
};
