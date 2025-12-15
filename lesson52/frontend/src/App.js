import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import HealthMonitor from './components/HealthMonitor';
import BackupManager from './components/BackupManager';
import FailoverController from './components/FailoverController';
import DRTester from './components/DRTester';
import MetricsDashboard from './components/MetricsDashboard';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
      fetchDashboard();
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [fetchDashboard]);

  if (!dashboardData) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading DR Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>🛡️ Disaster Recovery Automation Dashboard</h1>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <div className="dashboard-grid">
        <HealthMonitor health={dashboardData.health} />
        <MetricsDashboard metrics={dashboardData.metrics} />
        <BackupManager 
          stats={dashboardData.backupStats} 
          onRefresh={fetchDashboard}
        />
        <FailoverController 
          status={dashboardData.failoverStatus} 
          onRefresh={fetchDashboard}
        />
        <DRTester 
          history={dashboardData.drTestHistory} 
          onRefresh={fetchDashboard}
        />
      </div>
    </div>
  );
}

export default App;
