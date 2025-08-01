-- Tweet data modeling with engagement tracking
CREATE TABLE tweets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 280),
    reply_to_tweet_id BIGINT REFERENCES tweets(id),
    original_tweet_id BIGINT REFERENCES tweets(id), -- For retweets
    media_urls TEXT[],
    hashtags TEXT[],
    mentions BIGINT[],
    like_count INTEGER DEFAULT 0,
    retweet_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Critical performance indexes
CREATE INDEX idx_tweets_user_created ON tweets(user_id, created_at DESC);
CREATE INDEX idx_tweets_hashtags ON tweets USING GIN(hashtags);
CREATE INDEX idx_tweets_reply_to ON tweets(reply_to_tweet_id) WHERE reply_to_tweet_id IS NOT NULL;
CREATE INDEX idx_tweets_created ON tweets(created_at DESC);
