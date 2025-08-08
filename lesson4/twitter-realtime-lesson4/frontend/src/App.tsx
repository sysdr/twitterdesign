import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Timeline } from './components/Timeline/Timeline';
import { NotificationPanel } from './components/Notifications/NotificationPanel';
import { StatsPanel } from './components/StatsPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { Event } from './types';
import './App.css';

function App() {
  const [currentUserId, setCurrentUserId] = useState('user1');
  const [notifications, setNotifications] = useState<Event[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const defaultWs = `${protocol}://${window.location.hostname}:8001`;
  const wsUrl = (import.meta as any).env?.VITE_WS_URL || defaultWs;

  const handleEvent = useCallback((event: Event) => {
    console.log('📥 Timeline update:', event);
  }, []);

  const handleNotification = useCallback((notification: any) => {
    console.log('🔔 New notification:', notification);
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const wsConfig = useMemo(() => ({
    url: wsUrl,
    userId: currentUserId,
    onEvent: handleEvent,
    onNotification: handleNotification,
    reconnectInterval: 3000
  }), [wsUrl, currentUserId, handleEvent, handleNotification]);

  const { isConnected, connectionId, lastMessage } = useWebSocket(wsConfig);

  useEffect(() => {
    setConnectionStatus(isConnected ? 'Connected' : 'Disconnected');
  }, [isConnected]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    setNotifications([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🐦 Twitter Real-Time Demo</h1>
        <div className="header-controls">
          <div className="user-switcher">
            <select 
              value={currentUserId} 
              onChange={(e) => switchUser(e.target.value)}
            >
              <option value="user1">Alice Dev</option>
              <option value="user2">Bob Codes</option>
              <option value="user3">Charlie Tech</option>
            </select>
          </div>
          <NotificationPanel 
            notifications={notifications} 
            onClear={clearNotifications} 
          />
          <StatsPanel />
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {connectionStatus}
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="sidebar">
          <div className="connection-info">
            <h3>Connection Info</h3>
            <p>User: @{currentUserId === 'user1' ? 'alice_dev' : 
                       currentUserId === 'user2' ? 'bob_codes' : 'charlie_tech'}</p>
            <p>Connection ID: {connectionId}</p>
            <p>Status: {connectionStatus}</p>
            <p>Last Message: {lastMessage?.type || 'None'}</p>
          </div>
          
          <div className="demo-instructions">
            <h3>🎮 Demo Instructions</h3>
            <ol>
              <li>Switch between users to see different perspectives</li>
              <li>Post tweets and see real-time delivery</li>
              <li>Like tweets to trigger notifications</li>
              <li>Watch the system stats update live</li>
              <li>Open multiple browser tabs to simulate concurrent users</li>
            </ol>
          </div>
        </div>

        <div className="timeline-container">
          <Timeline 
            userId={currentUserId} 
            onTweetUpdate={(event) => console.log('Tweet update:', event)}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
