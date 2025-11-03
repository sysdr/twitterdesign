import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, trend }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
          <TrendingUp className="w-4 h-4 mr-1" />
          {change}
        </p>
      </div>
      <div className="text-blue-600">{icon}</div>
    </div>
  </div>
);

export const AnalyticsDashboard: React.FC = () => {
  const { 
    realTimeMetrics, 
    engagementData, 
    trendingTopics, 
    userGrowth,
    isLoading 
  } = useAnalytics();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Twitter Analytics Pipeline</h1>
        <p className="text-gray-600">Real-time insights processing 1TB daily</p>
      </header>

      {/* Real-time metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Tweets/Minute"
          value={realTimeMetrics.tweetsPerMinute.toLocaleString()}
          change="+12.5%"
          trend="up"
          icon={<MessageSquare className="w-8 h-8" />}
        />
        <MetricCard
          title="Active Users"
          value={realTimeMetrics.activeUsers.toLocaleString()}
          change="+8.3%"
          trend="up"
          icon={<Users className="w-8 h-8" />}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${realTimeMetrics.engagementRate.toFixed(1)}%`}
          change="+5.2%"
          trend="up"
          icon={<Activity className="w-8 h-8" />}
        />
        <MetricCard
          title="Viral Content"
          value={realTimeMetrics.viralContent.toString()}
          change="+25.0%"
          trend="up"
          icon={<TrendingUp className="w-8 h-8" />}
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="likes" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="retweets" stroke="#82ca9d" strokeWidth={2} />
              <Line type="monotone" dataKey="replies" stroke="#ffc658" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Topics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendingTopics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mentions" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User growth chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth & Activity</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={userGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="newUsers" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="activeUsers" stroke="#82ca9d" strokeWidth={2} />
            <Line type="monotone" dataKey="retainedUsers" stroke="#ffc658" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
