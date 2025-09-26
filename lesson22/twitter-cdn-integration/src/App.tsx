import React, { useState } from 'react';
import { CDNDashboard } from './components/CDN/CDNDashboard';
import { CacheAnalytics } from './components/Analytics/CacheAnalytics';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');

  return (
    <div className="App">
      <header className="app-header">
        <h1>Twitter CDN Integration</h1>
        <p>Lesson 22: Content Delivery Network</p>
      </header>

      <nav className="tab-navigation">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          CDN Dashboard
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Cache Analytics
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && <CDNDashboard />}
        {activeTab === 'analytics' && <CacheAnalytics />}
      </main>
    </div>
  );
}

export default App;
