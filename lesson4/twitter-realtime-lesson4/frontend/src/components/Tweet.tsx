import React from 'react';
import { Tweet as TweetType } from '../types';

interface TweetProps {
  tweet: TweetType;
  onLike: (tweetId: string) => void;
}

export function Tweet({ tweet, onLike }: TweetProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString();
  };

  return (
    <div className="tweet">
      <div className="tweet-header">
        <span className="author">@{tweet.authorUsername}</span>
        <span className="time">{formatTime(tweet.createdAt)}</span>
      </div>
      <div className="tweet-content">{tweet.content}</div>
      <div className="tweet-actions">
        <button 
          className="like-btn"
          onClick={() => onLike(tweet.id)}
        >
          ❤️ {tweet.likesCount}
        </button>
        <button className="retweet-btn">
          🔄 {tweet.retweetsCount}
        </button>
      </div>
    </div>
  );
}
