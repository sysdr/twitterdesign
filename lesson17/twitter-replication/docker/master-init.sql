-- Create replication user
CREATE ROLE replicator REPLICATION LOGIN PASSWORD 'replicator_password';

-- Create Twitter schema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tweets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followers (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id),
    following_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Insert sample data
INSERT INTO users (username, email) VALUES 
    ('alice', 'alice@twitter.com'),
    ('bob', 'bob@twitter.com'),
    ('charlie', 'charlie@twitter.com');

INSERT INTO tweets (user_id, content) VALUES 
    (1, 'Hello from master database! This is my first tweet.'),
    (2, 'Learning about database replication is fascinating!'),
    (3, 'Building scalable systems one lesson at a time.');

INSERT INTO followers (follower_id, following_id) VALUES 
    (2, 1), (3, 1), (3, 2);

-- Create indexes for performance
CREATE INDEX idx_tweets_user_id ON tweets(user_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
