-- Bidirectional follower graph for optimal performance
CREATE TABLE user_follows (
    follower_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Reverse lookup optimization table
CREATE TABLE user_followers (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    follower_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, follower_id)
);

-- Engagement tracking
CREATE TABLE tweet_likes (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    tweet_id BIGINT REFERENCES tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, tweet_id)
);

-- Performance indexes for relationship queries
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);
CREATE INDEX idx_followers_user ON user_followers(user_id);
CREATE INDEX idx_followers_follower ON user_followers(follower_id);
CREATE INDEX idx_likes_tweet ON tweet_likes(tweet_id);
CREATE INDEX idx_likes_user ON tweet_likes(user_id);
