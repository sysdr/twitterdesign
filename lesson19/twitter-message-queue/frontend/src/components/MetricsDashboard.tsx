import React from 'react';
import { MessageMetrics } from '../types';
import { Activity, BarChart3, Users, Clock } from 'lucide-react';

interface MetricsDashboardProps {
  metrics: MessageMetrics;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatLatency = (ms: number) => {
    return `${ms.toFixed(2)}ms`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Message Queue Metrics
        </h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">Messages/Second</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {formatNumber(metrics.messagesPerSecond)}
              </span>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-900">Total Messages</span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {formatNumber(metrics.totalMessages)}
              </span>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-900">Active Partitions</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {metrics.activePartitions}
              </span>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-900">Avg Latency</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">
                {formatLatency(metrics.averageLatency)}
              </span>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-900">Consumer Lag</span>
              </div>
              <span className="text-2xl font-bold text-red-600">
                {formatNumber(metrics.consumerLag)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">System Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Kafka Cluster</span>
            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Healthy
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Producer Status</span>
            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Consumer Groups</span>
            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Running
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
