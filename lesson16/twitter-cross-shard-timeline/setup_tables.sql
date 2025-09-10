-- Create tables for Twitter shard databases
CREATE TABLE IF NOT EXISTS tweets (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS follows (
    follower_id VARCHAR(255) NOT NULL,
    followed_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, followed_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON tweets(user_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_user_id ON follows(followed_user_id);

-- Insert some sample data
INSERT INTO tweets (id, user_id, content, created_at, likes_count, retweets_count) VALUES
('tweet_1', 'user1', 'Sample tweet from user1', NOW() - INTERVAL '1 hour', 5, 2),
('tweet_2', 'user2', 'Another tweet from user2', NOW() - INTERVAL '30 minutes', 3, 1),
('tweet_3', 'user1', 'Second tweet from user1', NOW() - INTERVAL '15 minutes', 8, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO follows (follower_id, followed_user_id) VALUES
('user_0_2', 'user1'),
('user_0_2', 'user2'),
('user_0_5', 'user1'),
('user_0_5', 'user2')
ON CONFLICT (follower_id, followed_user_id) DO NOTHING;
