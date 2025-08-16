import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from 'react-query';
import apiService from '../services/api';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalSecurityEvents: number;
  rateLimitHits: number;
  systemUptime: number;
  databaseConnections: number;
  redisMemoryUsage: string;
  lastLoginTime: string | null;
  lastRegistrationTime: string | null;
}

interface UserMetrics {
  userId: string;
  username: string;
  loginCount: number;
  lastLoginAt: string | null;
  deviceCount: number;
  securityEventCount: number;
}

export const Dashboard: React.FC = () => {
  const { user, logout, isLoggingOut } = useAuth();
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  // Fetch system metrics
  const { data: systemMetrics, refetch: refetchSystemMetrics } = useQuery(
    'systemMetrics',
    () => apiService.get('/analytics/system').then(res => res.data.data),
    {
      refetchInterval: refreshInterval,
      refetchIntervalInBackground: true,
    }
  );

  // Fetch current user metrics
  const { data: userMetrics, refetch: refetchUserMetrics } = useQuery(
    'userMetrics',
    () => apiService.get('/analytics/me').then(res => res.data.data),
    {
      refetchInterval: refreshInterval,
      refetchIntervalInBackground: true,
      enabled: !!user,
    }
  );

  // Fetch top users
  const { data: topUsers, refetch: refetchTopUsers } = useQuery(
    'topUsers',
    () => apiService.get('/analytics/top-users?limit=5').then(res => res.data.data),
    {
      refetchInterval: refreshInterval * 2, // Refresh every 10 seconds
      refetchIntervalInBackground: true,
    }
  );

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Refresh all data
  const refreshAll = () => {
    refetchSystemMetrics();
    refetchUserMetrics();
    refetchTopUsers();
  };

  // Toggle refresh interval
  const toggleRefresh = () => {
    setRefreshInterval(prev => prev === 5000 ? 0 : 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-twitter-dark">Twitter Auth System Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-twitter-gray">Welcome, {user?.username}!</span>
              <button
                onClick={refreshAll}
                className="btn-primary text-sm"
              >
                🔄 Refresh
              </button>
              <button
                onClick={toggleRefresh}
                className={`btn-secondary text-sm ${refreshInterval > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {refreshInterval > 0 ? '🟢 Auto-refresh ON' : '🔴 Auto-refresh OFF'}
              </button>
              <button
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* System Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{systemMetrics?.totalUsers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Users (24h)</p>
                  <p className="text-2xl font-semibold text-gray-900">{systemMetrics?.activeUsers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">{systemMetrics?.totalSessions || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Security Events</p>
                  <p className="text-2xl font-semibold text-gray-900">{systemMetrics?.totalSecurityEvents || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Uptime</h3>
              <p className="text-3xl font-bold text-green-600">
                {systemMetrics?.systemUptime ? formatUptime(systemMetrics.systemUptime) : '0s'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Database Connections</h3>
              <p className="text-3xl font-bold text-blue-600">
                {systemMetrics?.databaseConnections || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Redis Memory</h3>
              <p className="text-3xl font-bold text-purple-600">
                {systemMetrics?.redisMemoryUsage || '0B'}
              </p>
            </div>
          </div>
        </div>

        {/* User Activity */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Activity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current User Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Statistics</h3>
              {userMetrics ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Login Count:</span>
                    <span className="font-semibold">{userMetrics.loginCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trusted Devices:</span>
                    <span className="font-semibold">{userMetrics.deviceCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Events:</span>
                    <span className="font-semibold">{userMetrics.securityEventCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Login:</span>
                    <span className="font-semibold">{formatDate(userMetrics.lastLoginAt)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading user metrics...</p>
              )}
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Active Users</h3>
              {topUsers && topUsers.length > 0 ? (
                <div className="space-y-3">
                  {topUsers.map((user: UserMetrics, index: number) => (
                    <div key={user.userId} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="ml-2 font-medium">{user.username}</span>
                      </div>
                      <span className="text-sm text-gray-600">{user.loginCount} logins</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No user activity data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Last Login</h4>
                <p className="text-gray-600">
                  {systemMetrics?.lastLoginTime ? formatDate(systemMetrics.lastLoginTime) : 'No recent logins'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Last Registration</h4>
                <p className="text-gray-600">
                  {systemMetrics?.lastRegistrationTime ? formatDate(systemMetrics.lastRegistrationTime) : 'No recent registrations'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features Demo */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Security Features Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800">JWT Tokens</h4>
              <p className="text-sm text-green-600 mt-1">
                Access and refresh tokens working correctly
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800">Rate Limiting</h4>
              <p className="text-sm text-blue-600 mt-1">
                Multi-layer protection active
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800">Input Validation</h4>
              <p className="text-sm text-purple-600 mt-1">
                SQL injection protection enabled
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800">Session Management</h4>
              <p className="text-sm text-orange-600 mt-1">
                Redis-backed secure sessions
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
