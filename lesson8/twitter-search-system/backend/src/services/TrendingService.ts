import { TrendingTopic } from '../models/Search.js';

export class TrendingService {
  async getTrendingTopics(): Promise<TrendingTopic[]> {
    const mockTrending: TrendingTopic[] = [
      { hashtag: 'demo', count: 150, change: 25.5, rank: 1, updatedAt: new Date() },
      { hashtag: 'test', count: 120, change: 15.2, rank: 2, updatedAt: new Date() },
      { hashtag: 'example', count: 95, change: 8.7, rank: 3, updatedAt: new Date() }
    ];
    return mockTrending;
  }
}
