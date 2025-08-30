import { useState } from 'react';
import LoadTestDashboard from './components/LoadTestDashboard';
import PerformanceMonitor from './components/PerformanceMonitor';
import BottleneckAnalyzer from './components/BottleneckAnalyzer';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Twitter Load Testing & Optimization</h1>
        <nav className="nav-tabs">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            Load Test Dashboard
          </button>
          <button 
            className={activeTab === 'performance' ? 'active' : ''} 
            onClick={() => setActiveTab('performance')}
          >
            Performance Monitor
          </button>
          <button 
            className={activeTab === 'bottlenecks' ? 'active' : ''} 
            onClick={() => setActiveTab('bottlenecks')}
          >
            Bottleneck Analyzer
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'dashboard' && <LoadTestDashboard />}
        {activeTab === 'performance' && <PerformanceMonitor />}
        {activeTab === 'bottlenecks' && <BottleneckAnalyzer />}
      </main>
    </div>
  );
}

export default App;
