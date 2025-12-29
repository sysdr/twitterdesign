import React, { useState } from 'react';
import { Runbook } from '../../types';

interface Props {
  runbooks: Runbook[];
}

export const RunbookViewer: React.FC<Props> = ({ runbooks }) => {
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(runbooks[0] || null);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Operational Runbooks</h2>
      
      <div style={styles.layout}>
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Available Runbooks</h3>
          {runbooks.map(rb => (
            <div
              key={rb.id}
              onClick={() => setSelectedRunbook(rb)}
              style={{
                ...styles.runbookItem,
                ...(selectedRunbook?.id === rb.id ? styles.runbookItemActive : {})
              }}
            >
              <div style={styles.runbookHeader}>
                <span style={styles.runbookId}>{rb.id}</span>
                <span style={{
                  ...styles.runbookStatus,
                  color: rb.passRate >= 95 ? '#48bb78' : '#ed8936'
                }}>
                  {rb.passRate}%
                </span>
              </div>
              <p style={styles.runbookTitle}>{rb.title}</p>
            </div>
          ))}
        </div>

        <div style={styles.content}>
          {selectedRunbook ? (
            <>
              <div style={styles.runbookHeader}>
                <h3 style={styles.runbookDetailTitle}>{selectedRunbook.title}</h3>
                <span style={styles.runbookMeta}>
                  Last tested: {selectedRunbook.lastTested.toLocaleDateString()}
                </span>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>🔍 Symptom</h4>
                <p style={styles.sectionContent}>{selectedRunbook.symptom}</p>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>⚠️ Impact</h4>
                <p style={styles.sectionContent}>{selectedRunbook.impact}</p>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>🔧 Quick Actions</h4>
                <div style={styles.commandBox}>
                  <code style={styles.command}>docker-compose restart api</code>
                  <code style={styles.command}>curl http://localhost:3000/health</code>
                  <code style={styles.command}>docker logs api --tail 50</code>
                </div>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>📞 Escalation</h4>
                {selectedRunbook.escalation.map((contact, i) => (
                  <div key={i} style={styles.contact}>
                    <strong>{contact.role}:</strong> {contact.name}
                    <span style={styles.contactInfo}>
                      {contact.slack} • {contact.phone}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <p>Select a runbook to view details</p>
            </div>
          )}
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '30px'
  },
  sidebar: {
    background: '#f7fafc',
    padding: '20px',
    borderRadius: '12px',
    height: 'fit-content'
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '15px'
  },
  runbookItem: {
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '2px solid transparent'
  },
  runbookItemActive: {
    background: 'white',
    border: '2px solid #667eea',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
  },
  runbookHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px'
  },
  runbookId: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#718096'
  },
  runbookStatus: {
    fontSize: '12px',
    fontWeight: 'bold'
  },
  runbookTitle: {
    fontSize: '14px',
    color: '#2d3748',
    margin: 0
  },
  content: {
    background: '#f7fafc',
    padding: '30px',
    borderRadius: '12px'
  },
  runbookDetailTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '10px'
  },
  runbookMeta: {
    fontSize: '14px',
    color: '#718096'
  },
  section: {
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '12px'
  },
  sectionContent: {
    fontSize: '16px',
    color: '#4a5568',
    lineHeight: '1.6'
  },
  commandBox: {
    background: '#2d3748',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  command: {
    color: '#48bb78',
    fontFamily: 'monospace',
    fontSize: '14px'
  },
  contact: {
    marginBottom: '10px',
    fontSize: '14px',
    color: '#2d3748'
  },
  contactInfo: {
    marginLeft: '10px',
    color: '#718096'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#a0aec0',
    fontSize: '18px'
  }
};
