import React from 'react';
import { Server, LoadMetrics, RoutingDecision } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Server as ServerIcon, Zap, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  servers: Server[];
  metrics: LoadMetrics;
  history: RoutingDecision[];
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSendBatch: (count: number) => void;
  onLoadDemoData?: () => void;
}

const COLORS = {
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  overloaded: '#7c3aed'
};

export const Dashboard: React.FC<DashboardProps> = ({
  servers,
  metrics,
  history,
  isRunning,
  onStart,
  onStop,
  onReset,
  onSendBatch,
  onLoadDemoData
}) => {
  const loadData = servers.map(s => ({
    name: s.name,
    load: s.currentLoad,
    capacity: s.capacity,
    virtualNodes: s.virtualNodes
  }));

  const statusCounts = servers.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Load Balancer Controls
          </h2>
          <div className="flex gap-2">
            {onLoadDemoData && (
              <button
                onClick={onLoadDemoData}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Load Demo Data
              </button>
            )}
            <button
              onClick={() => onSendBatch(100)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Send 100 Requests
            </button>
            {isRunning ? (
              <button
                onClick={onStop}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Simulation
              </button>
            ) : (
              <button
                onClick={onStart}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Start Simulation
              </button>
            )}
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests}
          icon={<Zap className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Spillover Rate"
          value={`${metrics.totalRequests > 0 
            ? ((metrics.spilloverCount / metrics.totalRequests) * 100).toFixed(2) 
            : 0}%`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
        />
        <MetricCard
          title="Load Variance"
          value={`${metrics.loadVariance.toFixed(2)}%`}
          icon={<Activity className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Active Servers"
          value={servers.length}
          icon={<ServerIcon className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Load Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-md font-semibold mb-4">Load Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={loadData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="load" fill="#3b82f6" name="Current Load" />
              <Bar dataKey="capacity" fill="#e5e7eb" name="Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Server Status */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-md font-semibold mb-4">Server Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#gray'} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Server Details */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-md font-semibold mb-4">Server Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Server</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Load</th>
                <th className="text-left p-2">CPU</th>
                <th className="text-left p-2">Memory</th>
                <th className="text-left p-2">Response</th>
                <th className="text-left p-2">Weight</th>
                <th className="text-left p-2">V.Nodes</th>
              </tr>
            </thead>
            <tbody>
              {servers.map(server => (
                <tr key={server.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{server.name}</td>
                  <td className="p-2">
                    <span 
                      className="px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: COLORS[server.status] }}
                    >
                      {server.status}
                    </span>
                  </td>
                  <td className="p-2">{server.currentLoad}/{server.capacity}</td>
                  <td className="p-2">{server.cpu.toFixed(1)}%</td>
                  <td className="p-2">{server.memory.toFixed(1)}%</td>
                  <td className="p-2">{server.responseTime.toFixed(0)}ms</td>
                  <td className="p-2">{server.effectiveWeight.toFixed(2)}</td>
                  <td className="p-2">{server.virtualNodes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Routing */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-md font-semibold mb-4">Recent Routing Decisions</h3>
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1">Request</th>
                <th className="text-left p-1">Primary</th>
                <th className="text-left p-1">Actual</th>
                <th className="text-left p-1">Spillover</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(-20).reverse().map((decision, i) => (
                <tr key={i} className="border-b">
                  <td className="p-1 font-mono">{decision.requestId.slice(0, 20)}...</td>
                  <td className="p-1">{decision.primaryServer}</td>
                  <td className="p-1">{decision.actualServer}</td>
                  <td className="p-1">
                    {decision.spillover ? (
                      <span className="text-amber-500">Yes</span>
                    ) : (
                      <span className="text-green-500">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
