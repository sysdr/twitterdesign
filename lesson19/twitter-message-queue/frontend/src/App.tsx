import React, { useState, useEffect } from 'react';
import './App.css';
import socketService from './services/socketService';
import { Tweet, MessageMetrics } from './types';
import TweetPublisher from './components/TweetPublisher';
import TweetStream from './components/TweetStream';
import MetricsDashboard from './components/MetricsDashboard';

function App() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [metrics, setMetrics] = useState<MessageMetrics>({
    messagesPerSecond: 0,
    totalMessages: 0,
    activePartitions: 0,
    consumerLag: 0,
    averageLatency: 0
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketService.onTweetReceived((tweet: Tweet) => {
      setTweets(prev => [tweet, ...prev.slice(0, 99)]);
    });

    socketService.onMetricsUpdate((metricsUpdate: MessageMetrics) => {
      setMetrics(metricsUpdate);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handlePublishTweet = (content: string, username: string) => {
    if (connected) {
      socketService.publishTweet({
        userId: `user_${Date.now()}`,
        username,
        content
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Twitter Message Queue System
            </h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <TweetPublisher onPublish={handlePublishTweet} />
            <TweetStream tweets={tweets} />
          </div>
          <div>
            <MetricsDashboard metrics={metrics} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
