import React, { useState, useEffect } from 'react';
import { DatabaseStats, Tweet, User } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardState {
  stats: DatabaseStats | null;
  tweets: Tweet[];
  users: User[];
  metrics: any;
  loading: boolean;
  error: string | null;
}

export const Dashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    stats: null,
    tweets: [],
    users: [],
    metrics: null,
    loading: true,
    error: null
  });

  const [newTweet, setNewTweet] = useState({ user_id: 1, content: '' });
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tweetsRes, usersRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/tweets'),
          fetch('/api/users')
        ]);

        const [stats, tweets, users] = await Promise.all([
          statsRes.json(),
          tweetsRes.json(),
          usersRes.json()
        ]);

        setState(prev => ({
          ...prev,
          stats,
          tweets,
          users,
          metrics: stats.metrics,
          loading: false,
          error: null
        }));

        // Update performance data
        const timestamp = new Date().toLocaleTimeString();
        setPerformanceData(prev => {
          const newData = [...prev, {
            time: timestamp,
            master_connections: stats.master.connections,
            slave1_connections: stats.slaves[0]?.connections || 0,
            slave2_connections: stats.slaves[1]?.connections || 0,
            replication_lag: stats.slaves[0]?.replication_lag || 0
          }].slice(-20); // Keep only last 20 data points
          return newData;
        });

      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleTweetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTweet.content.trim()) return;

    try {
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTweet)
      });

      if (response.ok) {
        setNewTweet(prev => ({ ...prev, content: '' }));
        // Refresh tweets after a short delay to account for replication lag
        setTimeout(() => {
          fetch('/api/tweets')
            .then(res => res.json())
            .then(tweets => setState(prev => ({ ...prev, tweets })));
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating tweet:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'lagging': case 'degraded': return '#f59e0b';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading Twitter Replication Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🐦 Twitter Master-Slave Replication Dashboard
        </h1>

        {state.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {state.error}
          </div>
        )}

        {/* Database Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Master Database */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Master Database</h3>
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getStatusColor(state.stats?.master.status || 'down') }}
              ></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{state.stats?.master.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connections:</span>
                <span className="font-medium">{state.stats?.master.connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium text-blue-600">Write + Read</span>
              </div>
            </div>
          </div>

          {/* Slave Databases */}
          {state.stats?.slaves.map((slave, index) => (
            <div key={slave.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Slave {index + 1}</h3>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getStatusColor(slave.status) }}
                ></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{slave.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connections:</span>
                  <span className="font-medium">{slave.connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Replication Lag:</span>
                  <span className={`font-medium ${slave.replication_lag > 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {slave.replication_lag.toFixed(2)}s
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Connections</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="master_connections" stroke="#3b82f6" name="Master" />
                <Line type="monotone" dataKey="slave1_connections" stroke="#10b981" name="Slave 1" />
                <Line type="monotone" dataKey="slave2_connections" stroke="#f59e0b" name="Slave 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Replication Lag</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="replication_lag" stroke="#ef4444" name="Lag (seconds)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tweet Creation Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Tweet (Writes to Master)</h3>
          <form onSubmit={handleTweetSubmit} className="flex gap-4">
            <select
              value={newTweet.user_id}
              onChange={(e) => setNewTweet(prev => ({ ...prev, user_id: parseInt(e.target.value) }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {state.users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
            <input
              type="text"
              value={newTweet.content}
              onChange={(e) => setNewTweet(prev => ({ ...prev, content: e.target.value }))}
              placeholder="What's happening?"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tweet
            </button>
          </form>
        </div>

        {/* Database Metrics */}
        {state.metrics && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{state.metrics.total_tweets}</div>
                <div className="text-gray-600">Total Tweets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{state.metrics.total_users}</div>
                <div className="text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{state.metrics.total_followers}</div>
                <div className="text-gray-600">Total Follows</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Tweets (Read from Slaves) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tweets (Read from Slaves)</h3>
          <div className="space-y-4">
            {state.tweets.slice(0, 10).map(tweet => (
              <div key={tweet.id} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">@{tweet.username}</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(tweet.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-800">{tweet.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
