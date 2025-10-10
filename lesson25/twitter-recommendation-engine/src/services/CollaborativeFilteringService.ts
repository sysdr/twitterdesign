import { User, Tweet, UserInteraction, UserEmbedding, RecommendationRequest, RecommendationResponse } from '../types';
import { cosineSimilarity, jaccardSimilarity, normalizeVector } from '../utils/similarity';
import _ from 'lodash';

export class CollaborativeFilteringService {
  private userEmbeddings: Map<string, number[]> = new Map();
  private itemEmbeddings: Map<string, number[]> = new Map();
  private userInteractions: Map<string, UserInteraction[]> = new Map();
  private userSimilarityCache: Map<string, Map<string, number>> = new Map();

  /**
   * Update user embedding based on new interaction
   */
  updateUserEmbedding(userId: string, interaction: UserInteraction): void {
    const interactions = this.userInteractions.get(userId) || [];
    interactions.push(interaction);
    this.userInteractions.set(userId, interactions);

    // Simple embedding update - in production, use more sophisticated methods
    const embedding = this.userEmbeddings.get(userId) || new Array(50).fill(0);
    
    // Weight different interaction types
    const weights = {
      view: 0.1,
      like: 1.0,
      retweet: 2.0,
      reply: 1.5,
      click: 0.5
    };

    const weight = weights[interaction.type];
    const tweetHash = this.hashString(interaction.tweetId);
    
    // Update embedding dimensions based on tweet content hash
    for (let i = 0; i < embedding.length; i++) {
      const dimensionHash = (tweetHash + i) % 1000;
      embedding[i] += (weight * (dimensionHash / 1000 - 0.5)) * 0.01;
    }

    this.userEmbeddings.set(userId, normalizeVector(embedding));
    
    // Clear similarity cache for this user
    this.userSimilarityCache.delete(userId);
  }

  /**
   * Find similar users based on embeddings
   */
  findSimilarUsers(userId: string, topK: number = 10): Array<{userId: string, similarity: number}> {
    const userEmbedding = this.userEmbeddings.get(userId);
    if (!userEmbedding) return [];

    let cached = this.userSimilarityCache.get(userId);
    if (!cached) {
      cached = new Map();
      
      for (const [otherUserId, otherEmbedding] of this.userEmbeddings.entries()) {
        if (otherUserId !== userId) {
          const similarity = cosineSimilarity(userEmbedding, otherEmbedding);
          cached.set(otherUserId, similarity);
        }
      }
      
      this.userSimilarityCache.set(userId, cached);
    }

    return Array.from(cached.entries())
      .map(([id, sim]) => ({ userId: id, similarity: sim }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Generate recommendations for user
   */
  async generateRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startTime = Date.now();
    const { userId, limit, excludeIds = [] } = request;

    // Get similar users
    const similarUsers = this.findSimilarUsers(userId, 50);
    
    // Collect tweets from similar users' interactions
    const candidateTweets = new Map<string, { tweet: Tweet, score: number }>();
    
    for (const { userId: similarUserId, similarity } of similarUsers) {
      const interactions = this.userInteractions.get(similarUserId) || [];
      
      for (const interaction of interactions) {
        if (excludeIds.includes(interaction.tweetId)) continue;
        
        const tweet = this.getTweetById(interaction.tweetId);
        if (!tweet) continue;

        const interactionWeight = {
          view: 0.1,
          like: 1.0,
          retweet: 2.0,
          reply: 1.5,
          click: 0.5
        }[interaction.type];

        const score = similarity * interactionWeight;
        const existing = candidateTweets.get(interaction.tweetId);
        
        if (!existing || existing.score < score) {
          candidateTweets.set(interaction.tweetId, { tweet, score });
        }
      }
    }

    // Sort by recommendation score
    const recommendations = Array.from(candidateTweets.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ tweet, score }) => ({
        ...tweet,
        recommendationScore: score
      }));

    const processingTime = Date.now() - startTime;

    return {
      tweets: recommendations,
      debugInfo: {
        candidateCount: candidateTweets.size,
        processingTime,
        algorithmVersion: 'collaborative-filtering-v1.0'
      }
    };
  }

  /**
   * Get tweet by ID (mock implementation)
   */
  private getTweetById(tweetId: string): Tweet | null {
    // In production, this would fetch from database
    return {
      id: tweetId,
      content: `Tweet content for ${tweetId}`,
      author: {
        id: `user-${tweetId.slice(0, 8)}`,
        username: `user${tweetId.slice(0, 8)}`,
        displayName: `User ${tweetId.slice(0, 8)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${tweetId}`,
        followersCount: Math.floor(Math.random() * 10000),
        followingCount: Math.floor(Math.random() * 1000)
      },
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      likesCount: Math.floor(Math.random() * 100),
      retweetsCount: Math.floor(Math.random() * 50),
      repliesCount: Math.floor(Math.random() * 30),
      liked: false,
      retweeted: false
    };
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Initialize with sample data
   */
  initializeSampleData(): void {
    // Create sample users and interactions
    const userIds = Array.from({ length: 1000 }, (_, i) => `user-${i}`);
    const tweetIds = Array.from({ length: 5000 }, (_, i) => `tweet-${i}`);

    // Initialize user embeddings
    userIds.forEach(userId => {
      const embedding = Array.from({ length: 50 }, () => Math.random() - 0.5);
      this.userEmbeddings.set(userId, normalizeVector(embedding));
    });

    // Create sample interactions
    userIds.forEach(userId => {
      const interactionCount = Math.floor(Math.random() * 50) + 10;
      const interactions: UserInteraction[] = [];

      for (let i = 0; i < interactionCount; i++) {
        const tweetId = tweetIds[Math.floor(Math.random() * tweetIds.length)];
        const types: Array<UserInteraction['type']> = ['view', 'like', 'retweet', 'reply', 'click'];
        const type = types[Math.floor(Math.random() * types.length)];

        interactions.push({
          userId,
          tweetId,
          type,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          dwellTime: type === 'view' ? Math.random() * 30000 : undefined
        });
      }

      this.userInteractions.set(userId, interactions);
    });
  }
}
