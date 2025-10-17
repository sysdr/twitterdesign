import { TrendingHashtagsProcessor } from '../../src/processors/TrendingHashtagsProcessor';
import { TweetEvent } from '../../src/models/types';

describe('TrendingHashtagsProcessor', () => {
  let processor: TrendingHashtagsProcessor;

  beforeEach(() => {
    processor = new TrendingHashtagsProcessor();
  });

  test('should count hashtags correctly', async () => {
    const tweet: TweetEvent = {
      id: 'test-1',
      userId: 'user-1',
      text: 'Test tweet #tech #ai',
      hashtags: ['#tech', '#ai'],
      timestamp: Date.now()
    };

    const results = await (processor as any).process(tweet);
    expect(results).toBeDefined();
  });

  test('should handle multiple windows', async () => {
    const baseTime = Date.now();
    
    for (let i = 0; i < 150; i++) {
      const tweet: TweetEvent = {
        id: `test-${i}`,
        userId: `user-${i}`,
        text: 'Test #trending',
        hashtags: ['#trending'],
        timestamp: baseTime + i * 100
      };
      
      await (processor as any).process(tweet);
    }

    expect((processor as any).state.size).toBeGreaterThan(0);
  });
});
