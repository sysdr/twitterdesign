import { create } from 'zustand';
import { User, Tweet, SystemMetrics, UserTier, ProcessingStatus } from '../types';
import { CelebrityDetectionService } from '../services/CelebrityDetectionService';
import { FanoutService } from '../services/FanoutService';
import { MetricsService } from '../services/MetricsService';

interface AppState {
  users: User[];
  tweets: Tweet[];
  metrics: SystemMetrics;
  
  // Services
  celebrityService: CelebrityDetectionService;
  fanoutService: FanoutService;
  metricsService: MetricsService;
  
  // Actions
  addUser: (user: Omit<User, 'tier' | 'influenceScore'>) => void;
  createTweet: (userId: string, content: string) => Promise<void>;
  updateMetrics: () => void;
  simulateViralEvent: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  users: [],
  tweets: [],
  metrics: {
    queueDepth: 0,
    averageResponseTime: 0,
    throughput: 0,
    errorRate: 0,
    activeUsers: 0
  },
  
  celebrityService: new CelebrityDetectionService(),
  fanoutService: new FanoutService(),
  metricsService: new MetricsService(),
  
  addUser: (userData) => {
    const { celebrityService } = get();
    const user: User = {
      ...userData,
      tier: UserTier.REGULAR,
      influenceScore: 0
    };
    
    user.tier = celebrityService.classifyUser(user);
    user.influenceScore = celebrityService.calculateInfluenceScore(user);
    
    set((state) => ({
      users: [...state.users, user]
    }));
  },
  
  createTweet: async (userId: string, content: string) => {
    const { users, fanoutService, metricsService } = get();
    const author = users.find(u => u.id === userId);
    
    if (!author) return;
    
    const startTime = Date.now();
    const tweet: Tweet = {
      id: `tweet-${Date.now()}`,
      userId,
      content,
      timestamp: new Date(),
      fanoutStrategy: author.tier as any,
      processedFollowers: 0,
      totalFollowers: author.followerCount,
      status: ProcessingStatus.QUEUED
    };
    
    set((state) => ({
      tweets: [...state.tweets, tweet]
    }));
    
    try {
      // Simulate followers (simplified)
      const followers = users.filter(u => u.id !== userId).slice(0, Math.min(author.followerCount, 1000));
      const processedTweet = await fanoutService.processTweet(tweet, author, followers);
      
      const responseTime = Date.now() - startTime;
      metricsService.recordResponseTime(responseTime);
      metricsService.recordThroughput(1);
      
      set((state) => ({
        tweets: state.tweets.map(t => t.id === processedTweet.id ? processedTweet : t)
      }));
      
    } catch (error) {
      metricsService.recordError();
      console.error('Tweet processing failed:', error);
    }
  },
  
  updateMetrics: () => {
    const { metricsService, fanoutService, users } = get();
    const queueStatus = fanoutService.getQueueStatus();
    
    metricsService.updateQueueDepth(queueStatus.depth);
    metricsService.updateActiveUsers(users.length);
    
    set({
      metrics: metricsService.getCurrentMetrics()
    });
  },
  
  simulateViralEvent: async () => {
    const { users, createTweet } = get();
    const celebrity = users.find(u => u.tier === UserTier.CELEBRITY);
    
    if (celebrity) {
      await createTweet(celebrity.id, "🚀 Breaking: Major announcement! This will be HUGE! #Viral");
      console.log(`🔥 Viral event triggered by ${celebrity.username}`);
    }
  }
}));
