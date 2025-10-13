import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Zap, Target } from 'lucide-react';
import { RecommendationService } from '../services/RecommendationService';
import { Tweet, UserInteraction } from '../types';

const recommendationService = new RecommendationService();

export const RecommendationDashboard: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId] = useState('user-123');
  const [experimentResults, setExperimentResults] = useState<any[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState({
    ctr: 0,
    avgDwellTime: 0,
    totalInteractions: 0,
    improvementRate: 0
  });

  useEffect(() => {
    loadRecommendations();
    loadExperimentResults();
    loadEngagementMetrics();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await recommendationService.getRecommendations({
        userId: currentUserId,
        limit: 20,
        excludeIds: []
      });
      setRecommendations(response.tweets);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExperimentResults = () => {
    const results = recommendationService.getExperimentResults('recommendation-algorithm-v2');
    const chartData = Array.from(results.entries()).map(([variant, data]) => ({
      variant,
      clicks: data.metrics.clicks || 0,
      likes: data.metrics.likes || 0,
      engagementRate: ((data.metrics.clicks + data.metrics.likes) / data.count * 100).toFixed(1)
    }));
    setExperimentResults(chartData);
  };

  const loadEngagementMetrics = () => {
    // Simulate engagement metrics (in production, load from analytics)
    setEngagementMetrics({
      ctr: 3.2,
      avgDwellTime: 45.7,
      totalInteractions: 15847,
      improvementRate: 42.3
    });
  };

  const handleTweetClick = (tweet: Tweet) => {
    const interaction: UserInteraction = {
      userId: currentUserId,
      tweetId: tweet.id,
      type: 'click',
      timestamp: new Date(),
      dwellTime: Math.random() * 30000 + 5000 // Simulate 5-35 second dwell time
    };

    recommendationService.trackInteraction(interaction);
    
    // Update metrics
    setEngagementMetrics(prev => ({
      ...prev,
      totalInteractions: prev.totalInteractions + 1
    }));
  };

  const handleTweetLike = (tweet: Tweet) => {
    const interaction: UserInteraction = {
      userId: currentUserId,
      tweetId: tweet.id,
      type: 'like',
      timestamp: new Date()
    };

    recommendationService.trackInteraction(interaction);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real-Time Recommendation Engine Dashboard
          </h1>
          <p className="text-gray-600">
            Collaborative filtering with A/B testing for personalized timeline optimization
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Engagement Improvement"
            value={`+${engagementMetrics.improvementRate}%`}
            icon={TrendingUp}
            color="text-green-600"
          />
          <MetricCard
            title="Click-Through Rate"
            value={`${engagementMetrics.ctr}%`}
            icon={Target}
            color="text-blue-600"
          />
          <MetricCard
            title="Avg Dwell Time"
            value={`${engagementMetrics.avgDwellTime}s`}
            icon={Zap}
            color="text-purple-600"
          />
          <MetricCard
            title="Total Interactions"
            value={engagementMetrics.totalInteractions.toLocaleString()}
            icon={Users}
            color="text-indigo-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* A/B Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">A/B Test Results</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={experimentResults}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="variant" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engagementRate" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Engagement Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={generateTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended Timeline */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Personalized Timeline</h3>
              <button
                onClick={loadRecommendations}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="divide-y">
            {recommendations.map((tweet, index) => (
              <TweetCard
                key={tweet.id}
                tweet={tweet}
                rank={index + 1}
                onClick={() => handleTweetClick(tweet)}
                onLike={() => handleTweetLike(tweet)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <Icon className={`w-8 h-8 ${color}`} />
    </div>
  </div>
);

const TweetCard: React.FC<{
  tweet: Tweet;
  rank: number;
  onClick: () => void;
  onLike: () => void;
}> = ({ tweet, rank, onClick, onLike }) => {
  const [liked, setLiked] = useState(tweet.liked);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    onLike();
  };

  return (
    <div
      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <span className="text-xs text-gray-500 font-mono">#{rank}</span>
        </div>
        <div className="flex-shrink-0">
          <img
            src={tweet.author.avatar}
            alt={tweet.author.displayName}
            className="w-10 h-10 rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="font-semibold text-gray-900">{tweet.author.displayName}</p>
            <p className="text-gray-500">@{tweet.author.username}</p>
            <p className="text-gray-500">·</p>
            <p className="text-gray-500">
              {new Date(tweet.createdAt).toLocaleDateString()}
            </p>
            {tweet.recommendationScore && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Score: {tweet.recommendationScore.toFixed(2)}
              </span>
            )}
          </div>
          <p className="mt-2 text-gray-900">{tweet.content}</p>
          <div className="flex items-center space-x-6 mt-3">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
              <span>💬</span>
              <span>{tweet.repliesCount}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
              <span>🔄</span>
              <span>{tweet.retweetsCount}</span>
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 hover:text-red-700 ${
                liked ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{tweet.likesCount + (liked && !tweet.liked ? 1 : 0)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function generateTrendData() {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.getHours() + ':00',
      engagement: Math.floor(Math.random() * 50) + 20 + (24 - i) * 2
    });
  }
  return data;
}
