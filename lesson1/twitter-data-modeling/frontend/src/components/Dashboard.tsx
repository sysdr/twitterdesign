import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  users: number;
  tweets: number;
  relationships: number;
  timestamp: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  follower_count: number;
  following_count: number;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    display_name: '',
    bio: '',
    privacy: 'public'
  });
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchStats();
    generatePerformanceData();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error.response?.data?.status === 'database_unavailable') {
        // Set mock data when database is unavailable
        setStats({
          users: 0,
          tweets: 0,
          relationships: 0,
          timestamp: new Date().toISOString(),
          databaseStatus: 'unavailable'
        });
      }
    }
  };

  const generatePerformanceData = () => {
    const data = [
      { operation: 'User Creation', time: Math.random() * 50 + 20 },
      { operation: 'Follow User', time: Math.random() * 30 + 10 },
      { operation: 'Timeline Query', time: Math.random() * 80 + 40 },
      { operation: 'Profile Lookup', time: Math.random() * 20 + 5 },
    ];
    setPerformanceData(data);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(`${API_BASE}/users`, newUser);
      const endTime = Date.now();
      
      console.log(`User created in ${endTime - startTime}ms`);
      setUsers(prev => [...prev, response.data.data]);
      setNewUser({ username: '', email: '', display_name: '', bio: '', privacy: 'public' });
      await fetchStats();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const performFollowDemo = async () => {
    if (users.length < 2) {
      alert('Need at least 2 users for follow demo');
      return;
    }

    try {
      const startTime = Date.now();
      await axios.post(`${API_BASE}/users/${users[1].id}/follow`, {
        followerId: users[0].id
      });
      const endTime = Date.now();
      
      console.log(`Follow operation completed in ${endTime - startTime}ms`);
      alert(`${users[0].username} now follows ${users[1].username}! (${endTime - startTime}ms)`);
      await fetchStats();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <h1>🐦 Twitter Data Modeling Dashboard</h1>
        <p>Real-time monitoring of social media data structures</p>
      </header>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.users.toLocaleString()}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.tweets.toLocaleString()}</div>
            <div className="stat-label">Total Tweets</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.relationships.toLocaleString()}</div>
            <div className="stat-label">Follow Relationships</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Session Users</div>
          </div>
        </div>
      )}
      
      {stats?.databaseStatus === 'unavailable' && (
        <div className="alert alert-warning">
          <strong>⚠️ Database Unavailable</strong>
          <p>The database is not currently available. Some features may be limited. 
          The dashboard is showing mock data for demonstration purposes.</p>
        </div>
      )}

      <div className="demo-section">
        <h2>📊 Performance Metrics</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="operation" />
            <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="time" fill="#4ECDC4" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="demo-section">
        <h2>👤 Create New User</h2>
        <form onSubmit={handleCreateUser} className="form-grid">
          <div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder="johndoe"
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>
          <div>
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={newUser.display_name}
                onChange={(e) => setNewUser(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label>Privacy</label>
              <select
                value={newUser.privacy}
                onChange={(e) => setNewUser(prev => ({ ...prev, privacy: e.target.value }))}
              >
                <option value="public">Public</option>
                <option value="protected">Protected</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </form>
        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={newUser.bio}
            onChange={(e) => setNewUser(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell us about yourself..."
            rows={3}
          />
        </div>
        <button type="submit" className="btn" disabled={loading} onClick={handleCreateUser}>
          {loading ? 'Creating...' : 'Create User'} 
        </button>
      </div>

      <div className="demo-section">
        <h2>🤝 Follow Relationship Demo</h2>
        <p>Test the bidirectional graph storage with real follow operations</p>
        <button className="btn" onClick={performFollowDemo} disabled={users.length < 2}>
          Demo Follow Operation
        </button>
        {users.length < 2 && <p>Create at least 2 users to test follow functionality</p>}
      </div>

      {users.length > 0 && (
        <div className="demo-section">
          <h2>👥 Created Users ({users.length})</h2>
          <div className="user-list">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <h4>@{user.username}</h4>
                <p>{user.display_name || user.email}</p>
                <p>Followers: {user.follower_count} | Following: {user.following_count}</p>
                <small>ID: {user.id}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
