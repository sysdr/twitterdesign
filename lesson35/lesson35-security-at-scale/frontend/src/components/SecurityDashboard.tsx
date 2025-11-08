import React, { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, AlertTriangle, LogOut, Shield, Users } from 'lucide-react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import type { SecurityEvent, ThreatScore, User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  panel: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  headerTitle: {
    margin: 0,
    color: '#1f2937',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerSubtitle: {
    margin: '8px 0 0 0',
    color: '#6b7280'
  },
  logoutButton: {
    padding: '12px 24px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeaderCell: {
    padding: '12px',
    textAlign: 'left',
    color: '#6b7280'
  },
  tableCell: {
    padding: '12px',
    color: '#374151'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500
  }
} satisfies Record<string, CSSProperties>;

const eventTypeColors: Record<string, string> = {
  login_attempt: '#10b981',
  failed_login: '#f59e0b',
  rate_limit_exceeded: '#ef4444',
  suspicious_activity: '#8b5cf6',
  blocked_action: '#dc2626'
};

export const SecurityDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [threatScore, setThreatScore] = useState<ThreatScore | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const { data: wsData, connected } = useWebSocket('ws://localhost:3000');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [score, eventsData] = await Promise.all([api.getThreatScore(), api.getSecurityEvents()]);
        setThreatScore(score);
        setEvents(eventsData.events);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      }
    };

    void fetchData();
  }, []);

  useEffect(() => {
    if (wsData?.recentEvents) {
      setEvents(wsData.recentEvents);
    }
  }, [wsData]);

  const eventTypeCounts = useMemo(() => {
    return events.reduce<Record<string, number>>((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const pieData = useMemo(
    () =>
      Object.entries(eventTypeCounts).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').toUpperCase(),
        value
      })),
    [eventTypeCounts]
  );

  const threatFactorsData = useMemo(
    () =>
      threatScore
        ? [
            { name: 'Account Age', value: threatScore.factors.accountAge },
            { name: 'Activity', value: threatScore.factors.activityPattern },
            { name: 'Device', value: threatScore.factors.deviceFingerprint },
            { name: 'Location', value: threatScore.factors.locationPattern },
            { name: 'Engagement', value: threatScore.factors.engagementRate }
          ]
        : [],
    [threatScore]
  );

  const riskLabel =
    (threatScore?.score ?? 0) < 5
      ? 'Low Risk'
      : (threatScore?.score ?? 0) < 10
      ? 'Medium Risk'
      : 'High Risk';

  const summaryCards = [
    {
      key: 'threat-score',
      icon: <Shield size={24} />,
      title: 'Threat Score',
      primary: threatScore ? threatScore.score.toFixed(1) : '0.0',
      secondary: riskLabel,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      key: 'events-total',
      icon: <Activity size={24} />,
      title: 'Total Events',
      primary: events.length.toString(),
      secondary: 'Last 100 events',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      key: 'failed-logins',
      icon: <AlertTriangle size={24} />,
      title: 'Failed Logins',
      primary: (eventTypeCounts['failed_login'] || 0).toString(),
      secondary: 'Potential threats',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      key: 'active-sessions',
      icon: <Users size={24} />,
      title: 'Active Sessions',
      primary: (eventTypeCounts['login_attempt'] || 0).toString(),
      secondary: 'Current users',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  return (
    <div style={styles.container}>
      <div style={{ ...styles.panel, ...styles.header }}>
        <div>
          <h1 style={styles.headerTitle}>
            <Shield size={32} />
            Security at Scale Dashboard
          </h1>
          <p style={styles.headerSubtitle}>
            Welcome, {user.username} · {connected ? '🟢 Live' : '🔴 Offline'}
          </p>
        </div>
        <button type="button" onClick={onLogout} style={styles.logoutButton}>
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <div style={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <div
            key={card.key}
            style={{
              background: card.gradient,
              borderRadius: '12px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
              {card.icon}
              <span style={{ fontSize: '14px', opacity: 0.9 }}>{card.title}</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{card.primary}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>{card.secondary}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={styles.panel}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Threat Score Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={threatFactorsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.panel}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Event Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name }) => name} outerRadius={80} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => {
                  const colors = Object.values(eventTypeColors);
                  return <Cell key={`pie-cell-${entry.name}`} fill={colors[index % colors.length]} />;
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.panel}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Recent Security Events</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={styles.tableHeaderCell}>Type</th>
                <th style={styles.tableHeaderCell}>IP Address</th>
                <th style={styles.tableHeaderCell}>Location</th>
                <th style={styles.tableHeaderCell}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 10).map((event) => (
                <tr key={event.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={styles.tableCell}>
                    <span
                      style={{
                        ...styles.badge,
                        background: `${eventTypeColors[event.type] ?? '#1f2937'}20`,
                        color: eventTypeColors[event.type] ?? '#1f2937'
                      }}
                    >
                      {event.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ ...styles.tableCell, fontFamily: 'monospace' }}>{event.ipAddress}</td>
                  <td style={styles.tableCell}>
                    {event.location ? `${event.location.city}, ${event.location.country}` : 'Unknown'}
                  </td>
                  <td style={{ ...styles.tableCell, color: '#6b7280' }}>{new Date(event.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

