import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSystemStats } from '../../api/client';
import { Activity, Users, MessageSquare, TrendingUp } from 'lucide-react';

export const SystemStats: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['system-stats'],
    queryFn: getSystemStats,
    refetchInterval: 2000,
  });

  const stats = data?.data;

  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">System Statistics</h3>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Activity className="mr-2" size={20} />
        System Statistics
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <MessageSquare className="text-blue-600 mr-3" size={24} />
            <div>
              <p className="font-semibold text-blue-900">Total Tweets</p>
              <p className="text-sm text-blue-600">Active content</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-600">{stats.totalTweets}</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="text-green-600 mr-3" size={24} />
            <div>
              <p className="font-semibold text-green-900">Total Engagements</p>
              <p className="text-sm text-green-600">Likes, retweets, replies</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-green-600">{stats.totalEngagements}</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center">
            <Users className="text-purple-600 mr-3" size={24} />
            <div>
              <p className="font-semibold text-purple-900">Total Versions</p>
              <p className="text-sm text-purple-600">Edit history</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-purple-600">{stats.totalVersions}</span>
        </div>

        <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Uptime:</span>
            <span className="font-mono">{formatUptime(stats.uptime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Memory Used:</span>
            <span className="font-mono">{formatMemory(stats.memory.used)}</span>
          </div>
          <div className="flex justify-between">
            <span>Memory Total:</span>
            <span className="font-mono">{formatMemory(stats.memory.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
