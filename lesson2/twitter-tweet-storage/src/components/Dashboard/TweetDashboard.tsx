import React, { useState } from 'react';
import { TweetForm } from '../TweetForm/TweetForm';
import { TweetList } from '../TweetList/TweetList';
import { SystemStats } from './SystemStats';
import { PerformanceMonitor } from './PerformanceMonitor';

export const TweetDashboard: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTweetCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Performance Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemStats />
        <PerformanceMonitor />
      </div>

      {/* Tweet Creation */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Create Tweet</h2>
        <TweetForm onTweetCreated={handleTweetCreated} />
      </div>

      {/* Tweet Feed */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Tweets</h2>
        </div>
        <TweetList key={refreshTrigger} />
      </div>
    </div>
  );
};
