import React, { useState, useEffect } from 'react';
import { SystemState, Alert } from './types/index.ts';
import SocketService from './services/SocketService.ts';
import GlobalSystemOverview from './components/GlobalSystemOverview.tsx';
import MetricsDashboard from './components/MetricsDashboard.tsx';
import AlertsPanel from './components/AlertsPanel.tsx';
import ControlPanel from './components/ControlPanel.tsx';

const App: React.FC = () => {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize connection
    SocketService.connect();
    
    // Set up event listeners
    const handleSystemStateUpdate = (state: SystemState) => {
      setSystemState(state);
      setAlerts(state.activeAlerts);
      setConnected(true);
    };

    const handleNewAlerts = (newAlerts: Alert[]) => {
      setAlerts(prev => [...prev, ...newAlerts]);
    };

    const handleAlertsResolved = (resolvedAlerts: Alert[]) => {
      setAlerts(prev => prev.filter(alert => 
        !resolvedAlerts.find(resolved => resolved.id === alert.id)
      ));
    };

    const handleAlertAcknowledged = (acknowledgedAlert: Alert) => {
      setAlerts(prev => prev.map(alert => 
        alert.id === acknowledgedAlert.id ? acknowledgedAlert : alert
      ));
    };

    SocketService.on('system-state-update', handleSystemStateUpdate);
    SocketService.on('new-alerts', handleNewAlerts);
    SocketService.on('alerts-resolved', handleAlertsResolved);
    SocketService.on('alert-acknowledged', handleAlertAcknowledged);

    // Fetch initial state
    fetch('http://localhost:5000/api/system-state')
      .then(response => response.json())
      .then(state => setSystemState(state))
      .catch(error => console.error('Failed to fetch initial state:', error));

    return () => {
      SocketService.off('system-state-update', handleSystemStateUpdate);
      SocketService.off('new-alerts', handleNewAlerts);
      SocketService.off('alerts-resolved', handleAlertsResolved);
      SocketService.off('alert-acknowledged', handleAlertAcknowledged);
      SocketService.disconnect();
    };
  }, []);

  if (!systemState) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            Loading Regional Monitoring System...
          </div>
          <div style={{ fontSize: '16px', color: '#6b7280', marginTop: '8px' }}>
            {connected ? 'Connected to server' : 'Connecting to server...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6',
      padding: '24px'
    }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          textAlign: 'center'
        }}>
          🌍 Regional Monitoring & Alerting Dashboard
        </h1>
        <p style={{ 
          textAlign: 'center', 
          margin: '8px 0 0 0', 
          color: '#6b7280',
          fontSize: '18px'
        }}>
          Real-time monitoring across multiple geographic regions
        </p>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <GlobalSystemOverview systemState={systemState} />
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Filter by Region:
          </label>
          <select
            value={selectedRegion || ''}
            onChange={(e) => setSelectedRegion(e.target.value || null)}
            style={{
              padding: '8px 12px',
              border: '2px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Regions</option>
            {systemState.regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        <MetricsDashboard 
          metrics={systemState.metrics} 
          selectedRegion={selectedRegion}
        />
        
        <AlertsPanel alerts={alerts} />
        
        <ControlPanel />
      </div>
    </div>
  );
};

export default App;
