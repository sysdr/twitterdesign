import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TweetModel } from '../api/models/Tweet';

describe('TweetModel', () => {
  beforeAll(() => {
    // Clear any existing data
    TweetModel['tweets'].clear();
    TweetModel['versions'].clear();
    TweetModel['engagement'].clear();
  });

  afterAll(() => {
    // Clean up
    TweetModel['tweets'].clear();
    TweetModel['versions'].clear();
    TweetModel['engagement'].clear();
  });

  it('creates a new tweet', async () => {
    const tweetData = {
      content: 'Hello, world!',
      authorId: 'user1',
      authorUsername: 'testuser',
      mediaUrls: [],
      isRetweet: false,
    };

    const tweet = await TweetModel.create(tweetData);

    expect(tweet).toBeDefined();
    expect(tweet.content).toBe('Hello, world!');
    expect(tweet.authorUsername).toBe('testuser');
    expect(tweet.version).toBe(1);
    expect(tweet.engagement.likes).toBe(0);
  });

  it('finds tweet by ID', async () => {
    const tweetData = {
      content: 'Find me!',
      authorId: 'user1',
      authorUsername: 'testuser',
      mediaUrls: [],
      isRetweet: false,
    };

    const createdTweet = await TweetModel.create(tweetData);
    const foundTweet = await TweetModel.findById(createdTweet.id);

    expect(foundTweet).toBeDefined();
    expect(foundTweet?.content).toBe('Find me!');
    expect(foundTweet?.engagement.views).toBe(1); // Should increment views
  });

  it('updates tweet engagement', async () => {
    const tweetData = {
      content: 'Like this tweet!',
      authorId: 'user1',
      authorUsername: 'testuser',
      mediaUrls: [],
      isRetweet: false,
    };

    const tweet = await TweetModel.create(tweetData);
    const engagement = await TweetModel.updateEngagement(tweet.id, 'like', 'user2');

    expect(engagement).toBeDefined();
    expect(engagement?.likes).toBe(1);
    expect(engagement?.likedByCurrentUser).toBe(true);
  });

  it('updates tweet content and creates version', async () => {
    const tweetData = {
      content: 'Original content',
      authorId: 'user1',
      authorUsername: 'testuser',
      mediaUrls: [],
      isRetweet: false,
    };

    const originalTweet = await TweetModel.create(tweetData);
    const updatedTweet = await TweetModel.update(originalTweet.id, 'Updated content');

    expect(updatedTweet).toBeDefined();
    expect(updatedTweet?.content).toBe('Updated content');
    expect(updatedTweet?.version).toBe(2);

    const versions = await TweetModel.getVersions(originalTweet.id);
    expect(versions).toHaveLength(2);
  });

  it('provides system statistics', async () => {
    const stats = TweetModel.getStats();
    
    expect(stats).toBeDefined();
    expect(typeof stats.totalTweets).toBe('number');
    expect(typeof stats.totalVersions).toBe('number');
    expect(typeof stats.totalEngagements).toBe('number');
  });
});
