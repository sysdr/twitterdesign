import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tweet } from '../Tweet';
import { Tweet as TweetType, Event } from '../../types';

interface TimelineProps {
  userId: string;
  onTweetUpdate?: (event: Event) => void;
}

export function Timeline({ userId, onTweetUpdate }: TimelineProps) {
  const [tweets, setTweets] = useState<TweetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTweetContent, setNewTweetContent] = useState('');

  useEffect(() => {
    loadTimeline();
  }, [userId]);

  const loadTimeline = async () => {
    try {
      const response = await axios.get(`/api/timeline/${userId}`);
      setTweets(response.data.tweets);
      setLoading(false);
    } catch (error) {
      console.error('Error loading timeline:', error);
      setLoading(false);
    }
  };

  const createTweet = async () => {
    if (!newTweetContent.trim()) return;

    try {
      const response = await axios.post('/api/tweets', {
        content: newTweetContent,
        authorId: userId
      });
      
      setNewTweetContent('');
      // Tweet will be added via real-time update
      onTweetUpdate?.(response.data.event);
    } catch (error) {
      console.error('Error creating tweet:', error);
    }
  };

  const likeTweet = async (tweetId: string) => {
    try {
      await axios.post(`/api/tweets/${tweetId}/like`, { userId });
      // Update will come via real-time
    } catch (error) {
      console.error('Error liking tweet:', error);
    }
  };

  // Handle real-time tweet updates
  const handleTimelineUpdate = (event: Event) => {
    if (event.type === 'TWEET_CREATED') {
      setTweets(prev => [event.payload.tweet, ...prev]);
    }
  };

  useEffect(() => {
    if (onTweetUpdate) {
      // This would be called from WebSocket updates
    }
  }, [onTweetUpdate]);

  if (loading) {
    return <div className="loading">Loading timeline...</div>;
  }

  return (
    <div className="timeline">
      <div className="tweet-composer">
        <textarea
          value={newTweetContent}
          onChange={(e) => setNewTweetContent(e.target.value)}
          placeholder="What's happening?"
          maxLength={280}
          rows={3}
        />
        <div className="composer-actions">
          <span className="char-count">{280 - newTweetContent.length}</span>
          <button 
            onClick={createTweet}
            disabled={!newTweetContent.trim()}
            className="tweet-btn"
          >
            Tweet
          </button>
        </div>
      </div>
      
      <div className="tweets">
        {tweets.map(tweet => (
          <Tweet 
            key={tweet.id} 
            tweet={tweet} 
            onLike={likeTweet}
          />
        ))}
      </div>
    </div>
  );
}
