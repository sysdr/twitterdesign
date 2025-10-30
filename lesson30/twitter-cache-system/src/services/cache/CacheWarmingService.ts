import { TweetData, WarmingPrediction, CacheTier } from '../../types';
import { MultiTierCacheService } from './MultiTierCacheService';

export class CacheWarmingService {
  private cacheService: MultiTierCacheService;
  // Removed unused engagementThresholds to satisfy noUnusedLocals

  constructor(cacheService: MultiTierCacheService) {
    this.cacheService = cacheService;
    this.startWarmingCycle();
  }

  async predictViralContent(tweet: TweetData): Promise<WarmingPrediction> {
    const engagementVelocity = this.calculateEngagementVelocity(tweet);
    const networkEffect = this.calculateNetworkEffect(tweet);
    const temporalScore = this.calculateTemporalScore(tweet);
    
    const viralProbability = (engagementVelocity * 0.5) + (networkEffect * 0.3) + (temporalScore * 0.2);
    
    return {
      tweetId: tweet.id,
      viralProbability,
      recommendedTier: this.getRecommendedTier(viralProbability),
      priority: this.calculatePriority(viralProbability, tweet.engagementScore)
    };
  }

  private calculateEngagementVelocity(tweet: TweetData): number {
    const ageMinutes = (Date.now() - tweet.timestamp) / (1000 * 60);
    if (ageMinutes === 0) return 0;
    
    const velocity = tweet.engagementScore / ageMinutes;
    return Math.min(velocity / 100, 1); // Normalize to 0-1
  }

  private calculateNetworkEffect(tweet: TweetData): number {
    // Simulate network effect based on user influence and content type
    const baseScore = Math.random() * 0.5; // Simulated user influence
    const contentBoost = tweet.content.includes('#') ? 0.2 : 0;
    const mediaBoost = tweet.content.includes('http') ? 0.1 : 0;
    
    return Math.min(baseScore + contentBoost + mediaBoost, 1);
  }

  private calculateTemporalScore(tweet: TweetData): number {
    const hour = new Date(tweet.timestamp).getHours();
    // Peak hours: 6-9 AM, 12-1 PM, 6-10 PM
    const peakHours = [6, 7, 8, 9, 12, 13, 18, 19, 20, 21, 22];
    return peakHours.includes(hour) ? 0.8 : 0.4;
  }

  private getRecommendedTier(viralProbability: number): CacheTier {
    if (viralProbability > 0.8) return CacheTier.L1;
    if (viralProbability > 0.5) return CacheTier.L2;
    return CacheTier.L3;
  }

  private calculatePriority(viralProbability: number, engagementScore: number): number {
    return Math.round((viralProbability * 0.7 + (engagementScore / 1000) * 0.3) * 100);
  }

  async warmCache(tweets: TweetData[]): Promise<void> {
    const predictions = await Promise.all(
      tweets.map(tweet => this.predictViralContent(tweet))
    );

    const toWarm = predictions
      .filter(p => p.viralProbability > 0.3)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 100);

    for (const prediction of toWarm) {
      const tweet = tweets.find(t => t.id === prediction.tweetId);
      if (!tweet) continue;
      await this.cacheService.set(
        `tweet:${tweet.id}`,
        tweet,
        prediction.recommendedTier
      );
    }
  }

  private startWarmingCycle(): void {
    // Simulate periodic warming based on trending patterns
    setInterval(async () => {
      const simulatedTrending = this.generateTrendingTweets();
      await this.warmCache(simulatedTrending);
    }, 30000); // Warm every 30 seconds
  }

  private generateTrendingTweets(): TweetData[] {
    // Generate realistic trending tweet data
    return Array.from({ length: 50 }, (_, i) => ({
      id: `trending-${Date.now()}-${i}`,
      content: `Trending content #trend${i} with engagement`,
      userId: `user-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now() - Math.random() * 3600000, // Within last hour
      engagementScore: Math.floor(Math.random() * 2000),
      isViral: Math.random() > 0.8
    }));
  }
}
