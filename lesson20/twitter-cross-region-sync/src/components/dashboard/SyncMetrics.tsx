import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  metrics: any[];
}

export const SyncMetrics: React.FC<Props> = ({ metrics }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Synchronization Metrics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {metrics.length > 0 ? metrics[metrics.length - 1].totalEvents : 0}
          </div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {metrics.length > 0 ? metrics[metrics.length - 1].replicationLag : 0}ms
          </div>
          <div className="text-sm text-gray-600">Replication Lag</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {metrics.length > 0 ? metrics[metrics.length - 1].conflictsResolved : 0}
          </div>
          <div className="text-sm text-gray-600">Conflicts Resolved</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {metrics.length > 0 ? (metrics[metrics.length - 1].successRate * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="replicationLag" stroke="#8884d8" name="Replication Lag (ms)" />
            <Line type="monotone" dataKey="conflictsResolved" stroke="#82ca9d" name="Conflicts Resolved" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
