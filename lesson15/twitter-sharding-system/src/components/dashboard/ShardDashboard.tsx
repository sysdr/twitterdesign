import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Database, Activity, AlertTriangle, Users, MessageSquare, RefreshCw } from 'lucide-react';
import ShardMonitor from '../shard-monitor/ShardMonitor';
import UserCreationForm from '../user-management/UserCreationForm';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const ShardDashboard = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'shards' | 'users' | 'rebalance'>('overview');

  const { data: shardData, isLoading } = useQuery({
    queryKey: ['shards'],
    queryFn: async () => {
      const response = await fetch('/api/shards');
      return response.json();
    },
  });

  const { data: rebalanceData } = useQuery({
    queryKey: ['rebalance-operations'],
    queryFn: async () => {
      const response = await fetch('/api/rebalance/operations');
      return response.json();
    },
  });

  const handleAutoRebalance = async () => {
    try {
      const response = await fetch('/api/rebalance/auto', { method: 'POST' });
      const result = await response.json();
      alert(`Rebalancing started: ${result.message}`);
    } catch (error) {
      alert('Failed to start rebalancing');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { shards = [], stats } = shardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'shards', label: 'Shard Monitor', icon: Database },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'rebalance', label: 'Rebalancing', icon: RefreshCw },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  selectedTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Shards</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats?.total_shards || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="text-green-600 font-medium">{stats?.healthy_shards || 0} healthy</span>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats?.total_users || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Tweets</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats?.total_tweets || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Load</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.round(stats?.average_load || 0)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shard Load Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shards}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="load_percentage" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={shards}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="user_count"
                  >
                    {shards.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hot Shards Alert */}
          {stats?.hot_shards && stats.hot_shards.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Hot Shards Detected</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      {stats.hot_shards.length} shard(s) are running hot (&gt;75% load). 
                      Consider rebalancing to maintain optimal performance.
                    </p>
                    <button
                      onClick={handleAutoRebalance}
                      className="mt-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded text-sm font-medium"
                    >
                      Start Auto Rebalancing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'shards' && (
        <ShardMonitor shards={shards} />
      )}

      {selectedTab === 'users' && (
        <UserCreationForm />
      )}

      {selectedTab === 'rebalance' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Rebalancing Operations</h2>
            <button
              onClick={handleAutoRebalance}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Start Auto Rebalance
            </button>
          </div>
          
          <div className="space-y-4">
            {rebalanceData?.operations?.map((op: any) => (
              <div key={op.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Operation {op.id.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-600">
                      Shard {op.source_shard} → Shard {op.target_shard}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-sm ${
                      op.status === 'completed' ? 'bg-green-100 text-green-800' :
                      op.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      op.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {op.status}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{op.progress}%</p>
                  </div>
                </div>
                {op.status === 'in_progress' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${op.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )) || <p className="text-gray-500">No rebalancing operations yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShardDashboard;
