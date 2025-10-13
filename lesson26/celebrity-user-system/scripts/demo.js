import { CelebrityDetectionService } from '../src/services/CelebrityDetectionService.js';
import { FanoutService } from '../src/services/FanoutService.js';
import { MetricsService } from '../src/services/MetricsService.js';

console.log('🚀 Celebrity User Architecture Demo');
console.log('=====================================');

// Create services
const celebrityService = new CelebrityDetectionService();
const fanoutService = new FanoutService();
const metricsService = new MetricsService();

// Sample users
const users = [
  {
    id: 'elon',
    username: 'elonmusk',
    followerCount: 150_000_000,
    verified: true,
    engagementRate: 8.5,
    tier: 'regular',
    influenceScore: 0
  },
  {
    id: 'regular',
    username: 'johndoe',
    followerCount: 1_200,
    verified: false,
    engagementRate: 3.2,
    tier: 'regular',
    influenceScore: 0
  }
];

console.log('\n🎯 Classifying Users:');
users.forEach(user => {
  user.tier = celebrityService.classifyUser(user);
  user.influenceScore = celebrityService.calculateInfluenceScore(user);
  
  console.log(`@${user.username}: ${user.tier.toUpperCase()} (Influence: ${(user.influenceScore * 100).toFixed(1)}%)`);
});

console.log('\n📊 System Metrics:');
console.log(metricsService.generateReport());

console.log('\n✅ Demo completed successfully!');
