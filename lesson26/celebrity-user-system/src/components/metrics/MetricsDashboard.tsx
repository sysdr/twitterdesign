import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SystemMetrics, UserTier } from '../../types';
import { useStore } from '../../hooks/useStore';

interface MetricsDashboardProps {
  metrics: SystemMetrics;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  const { users } = useStore();

  const tierData = React.useMemo(() => {
    const counts = users.reduce((acc, user) => {
      acc[user.tier] = (acc[user.tier] || 0) + 1;
      return acc;
    }, {} as Record<UserTier, number>);

    return [
      { name: 'Regular', value: counts[UserTier.REGULAR] || 0, color: '#6b7280' },
      { name: 'Popular', value: counts[UserTier.POPULAR] || 0, color: '#3b82f6' },
      { name: 'Celebrity', value: counts[UserTier.CELEBRITY] || 0, color: '#eab308' },
    ];
  }, [users]);

  const performanceData = [
    { name: 'Queue Depth', value: metrics.queueDepth },
    { name: 'Response Time', value: Math.round(metrics.averageResponseTime) },
    { name: 'Throughput', value: metrics.throughput },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Queue Depth</h3>
          <p className="text-2xl font-bold text-gray-900">{metrics.queueDepth}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
          <p className="text-2xl font-bold text-gray-900">{metrics.averageResponseTime.toFixed(0)}ms</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Throughput</h3>
          <p className="text-2xl font-bold text-gray-900">{metrics.throughput}/min</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
          <p className="text-2xl font-bold text-gray-900">{metrics.errorRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={tierData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({name, value}) => `${name}: ${value}`}
              >
                {tierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">System Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
