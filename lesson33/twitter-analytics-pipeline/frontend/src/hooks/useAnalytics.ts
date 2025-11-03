import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

interface RealTimeMetrics {
  tweetsPerMinute: number;
  activeUsers: number;
  engagementRate: number;
  viralContent: number;
}

interface EngagementData {
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
}

interface TrendingTopic {
  topic: string;
  mentions: number;
  trend: 'rising' | 'stable' | 'declining';
}

interface UserGrowthData {
  date: string;
  newUsers: number;
  activeUsers: number;
  retainedUsers: number;
}

export const useAnalytics = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    tweetsPerMinute: 0,
    activeUsers: 0,
    engagementRate: 0,
    viralContent: 0
  });
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize socket connection
    const socketConnection = io('http://localhost:3001');
    setSocket(socketConnection);

    // Load initial data
    loadInitialData();

    // Real-time updates
    socketConnection.on('realTimeMetrics', (data: RealTimeMetrics) => {
      setRealTimeMetrics(data);
    });

    socketConnection.on('engagementUpdate', (data: EngagementData) => {
      setEngagementData(prev => [...prev.slice(-23), data]);
    });

    socketConnection.on('trendingUpdate', (data: TrendingTopic[]) => {
      setTrendingTopics(data);
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [metricsRes, engagementRes, topicsRes, growthRes] = await Promise.all([
        axios.get('/api/analytics/metrics'),
        axios.get('/api/analytics/engagement/24h'),
        axios.get('/api/analytics/trending'),
        axios.get('/api/analytics/user-growth/30d')
      ]);

      setRealTimeMetrics(metricsRes.data);
      setEngagementData(engagementRes.data);
      setTrendingTopics(topicsRes.data);
      setUserGrowth(growthRes.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load initial analytics data:', error);
      setIsLoading(false);
    }
  };

  return {
    realTimeMetrics,
    engagementData,
    trendingTopics,
    userGrowth,
    isLoading
  };
};
