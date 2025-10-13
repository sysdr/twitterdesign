import { User, UserTier } from '../types';

export class CelebrityDetectionService {
  private readonly CELEBRITY_THRESHOLD = 1_000_000;
  private readonly POPULAR_THRESHOLD = 10_000;
  private readonly INFLUENCE_WEIGHT = 0.4;
  private readonly ENGAGEMENT_WEIGHT = 0.3;
  private readonly VERIFICATION_WEIGHT = 0.3;

  classifyUser(user: User): UserTier {
    const influenceScore = this.calculateInfluenceScore(user);
    
    if (user.followerCount >= this.CELEBRITY_THRESHOLD || influenceScore > 0.8) {
      return UserTier.CELEBRITY;
    }
    
    if (user.followerCount >= this.POPULAR_THRESHOLD || influenceScore > 0.5) {
      return UserTier.POPULAR;
    }
    
    return UserTier.REGULAR;
  }

  calculateInfluenceScore(user: User): number {
    const followerScore = Math.min(1, Math.log10(user.followerCount + 1) / 8);
    const engagementScore = Math.min(1, user.engagementRate / 100);
    const verificationScore = user.verified ? 1 : 0;
    
    return (
      followerScore * this.INFLUENCE_WEIGHT +
      engagementScore * this.ENGAGEMENT_WEIGHT +
      verificationScore * this.VERIFICATION_WEIGHT
    );
  }

  batchClassifyUsers(users: User[]): User[] {
    return users.map(user => ({
      ...user,
      tier: this.classifyUser(user),
      influenceScore: this.calculateInfluenceScore(user)
    }));
  }

  shouldUpgradeTier(user: User, recentActivity: number): boolean {
    return recentActivity > user.followerCount * 0.1;
  }
}
