import React from 'react';
import { ArchitectureNode } from '../../types';

interface Props {
  nodes: ArchitectureNode[];
}

export const ArchitectureDiagram: React.FC<Props> = ({ nodes }) => {
  const getNodeColor = (node: ArchitectureNode): string => {
    if (node.health === 'down') return '#fc8181';
    if (node.health === 'degraded') return '#f6ad55';
    
    switch (node.type) {
      case 'database': return '#90cdf4';
      case 'cache': return '#9ae6b4';
      case 'queue': return '#fbb6ce';
      default: return '#e9d8fd';
    }
  };

  const getHealthEmoji = (health: string): string => {
    switch (health) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'down': return '❌';
      default: return '❓';
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>System Architecture</h2>
      
      <div style={styles.diagramContainer}>
        <svg viewBox="0 0 800 600" style={styles.svg}>
          <defs>
            <filter id="shadow">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          <rect width="800" height="600" fill="white"/>
          
          {/* Draw connections */}
          {nodes.map((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI;
            const x1 = 400 + 200 * Math.cos(angle);
            const y1 = 300 + 200 * Math.sin(angle);
            
            return node.dependencies.map(depName => {
              const depIndex = nodes.findIndex(n => n.name === depName);
              if (depIndex >= 0) {
                const depAngle = (depIndex / nodes.length) * 2 * Math.PI;
                const x2 = 400 + 200 * Math.cos(depAngle);
                const y2 = 300 + 200 * Math.sin(depAngle);
                
                return (
                  <line
                    key={`${node.id}-${depName}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#cbd5e0"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                );
              }
              return null;
            });
          })}
          
          {/* Draw nodes */}
          {nodes.map((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI;
            const x = 400 + 200 * Math.cos(angle);
            const y = 300 + 200 * Math.sin(angle);
            const color = getNodeColor(node);
            
            return (
              <g key={node.id} transform={`translate(${x},${y})`} filter="url(#shadow)">
                <circle r="40" fill={color} stroke="#2d3748" strokeWidth="2"/>
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#2d3748"
                >
                  {node.name}
                </text>
                <text
                  textAnchor="middle"
                  y="20"
                  fontSize="9"
                  fill="#4a5568"
                >
                  {node.type}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={styles.nodeDetails}>
        <h3 style={styles.detailsTitle}>Component Details</h3>
        <div style={styles.nodeGrid}>
          {nodes.map(node => (
            <div key={node.id} style={{
              ...styles.nodeCard,
              borderLeft: `4px solid ${getNodeColor(node)}`
            }}>
              <div style={styles.nodeCardHeader}>
                <span style={styles.nodeName}>{node.name}</span>
                <span>{getHealthEmoji(node.health)}</span>
              </div>
              <div style={styles.nodeMetrics}>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Uptime:</span>
                  <span style={styles.metricValue}>{node.metrics.uptime.toFixed(2)}%</span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Latency:</span>
                  <span style={styles.metricValue}>{node.metrics.latency.toFixed(0)}ms</span>
                </div>
                <div style={styles.metric}>
                  <span style={styles.metricLabel}>Error Rate:</span>
                  <span style={styles.metricValue}>{(node.metrics.errorRate * 100).toFixed(3)}%</span>
                </div>
              </div>
              {node.dependencies.length > 0 && (
                <div style={styles.dependencies}>
                  <span style={styles.depLabel}>Dependencies:</span>
                  <span style={styles.depValue}>{node.dependencies.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '30px'
  },
  diagramContainer: {
    background: '#f7fafc',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px'
  },
  svg: {
    width: '100%',
    height: 'auto'
  },
  nodeDetails: {
    marginTop: '30px'
  },
  detailsTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '20px'
  },
  nodeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  nodeCard: {
    background: '#f7fafc',
    padding: '20px',
    borderRadius: '12px'
  },
  nodeCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  nodeName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748'
  },
  nodeMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  metric: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px'
  },
  metricLabel: {
    color: '#718096'
  },
  metricValue: {
    fontWeight: '600',
    color: '#2d3748'
  },
  dependencies: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e2e8f0',
    fontSize: '14px'
  },
  depLabel: {
    color: '#718096',
    marginRight: '8px'
  },
  depValue: {
    color: '#2d3748',
    fontWeight: '500'
  }
};
