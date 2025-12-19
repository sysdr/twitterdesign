import React, { useState, useEffect } from 'react';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { TestRunner } from './components/TestRunner';
import { OptimizationPanel } from './components/OptimizationPanel';
import { MetricsChart } from './components/MetricsChart';
import './App.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wsConnected, setWsConnected] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [optimizations, setOptimizations] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4001');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'init':
          setMetrics(message.data.metrics);
          setTestResults(message.data.testResults);
          setOptimizations(message.data.optimizations);
          break;
        case 'metrics':
          setMetrics(prev => [...prev.slice(-1000), ...message.data]);
          break;
        case 'testComplete':
          setTestResults(prev => [...prev, message.data]);
          break;
        case 'optimizations':
          setOptimizations(message.data);
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    return () => ws.close();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚡ Performance Engineering System</h1>
        <div className="connection-status">
          <span className={wsConnected ? 'connected' : 'disconnected'}>
            {wsConnected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'tests' ? 'active' : ''}
          onClick={() => setActiveTab('tests')}
        >
          Test Runner
        </button>
        <button
          className={activeTab === 'optimizations' ? 'active' : ''}
          onClick={() => setActiveTab('optimizations')}
        >
          Optimizations
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <>
            <PerformanceDashboard metrics={metrics} testResults={testResults} />
            <MetricsChart metrics={metrics} />
          </>
        )}
        {activeTab === 'tests' && (
          <TestRunner testResults={testResults} />
        )}
        {activeTab === 'optimizations' && (
          <OptimizationPanel optimizations={optimizations} />
        )}
      </main>
    </div>
  );
};
