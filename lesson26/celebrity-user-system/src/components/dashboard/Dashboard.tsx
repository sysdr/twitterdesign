import React from 'react';
import { useStore } from '../../hooks/useStore';
import UserCard from '../user-cards/UserCard';
import MetricsDashboard from '../metrics/MetricsDashboard';
import { ProcessingStatus } from '../../types';
import { Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { users, tweets, metrics, addUser, createTweet, updateMetrics, simulateViralEvent } = useStore();

  React.useEffect(() => {
    const interval = setInterval(() => {
      updateMetrics();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Auto-load sample users on initial mount
  React.useEffect(() => {
    if (users.length === 0) {
      addSampleUsers();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addSampleUsers = () => {
    // Add sample users with different tiers
    const timestamp = Date.now();
    
    addUser({
      id: `user-${timestamp}-1`,
      username: 'elonmusk',
      followerCount: 150_000_000,
      verified: true,
      engagementRate: 8.5
    });

    addUser({
      id: `user-${timestamp}-2`,
      username: 'oprah',
      followerCount: 45_000_000,
      verified: true,
      engagementRate: 12.3
    });

    addUser({
      id: `user-${timestamp}-3`,
      username: 'techinfluencer',
      followerCount: 250_000,
      verified: true,
      engagementRate: 6.7
    });

    addUser({
      id: `user-${timestamp}-4`,
      username: 'regularjoe',
      followerCount: 1_200,
      verified: false,
      engagementRate: 3.2
    });
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.QUEUED:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case ProcessingStatus.PROCESSING:
        return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />;
      case ProcessingStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case ProcessingStatus.FAILED:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Celebrity User Architecture Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={addSampleUsers}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Sample Users
            </button>
            <button
              onClick={simulateViralEvent}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              🔥 Simulate Viral Event
            </button>
          </div>
        </div>

        <div className="mb-8">
          <MetricsDashboard metrics={metrics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Users ({users.length})</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onTweet={createTweet}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Tweets ({tweets.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tweets.slice().reverse().map((tweet) => {
                const author = users.find(u => u.id === tweet.userId);
                return (
                  <div key={tweet.id} className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">@{author?.username}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {tweet.fanoutStrategy.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(tweet.status)}
                        <span className="text-xs text-gray-500">{tweet.status}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{tweet.content}</p>
                    <div className="text-xs text-gray-500">
                      Processed: {tweet.processedFollowers?.toLocaleString() || 0} / {tweet.totalFollowers?.toLocaleString() || 0} followers
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
