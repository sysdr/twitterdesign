import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { HeartIcon, ArrowPathIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, ArrowPathIcon as ArrowPathSolidIcon } from '@heroicons/react/24/solid';
import { Tweet } from '../types/timeline';
import { timelineApi } from '../services/api';

interface TweetCardProps {
  tweet: Tweet;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  const [isLiked, setIsLiked] = React.useState(tweet.isLiked || false);
  const [isRetweeted, setIsRetweeted] = React.useState(tweet.isRetweeted || false);
  const [likeCount, setLikeCount] = React.useState(tweet.likes);
  const [retweetCount, setRetweetCount] = React.useState(tweet.retweets);

  const handleLike = async () => {
    try {
      await timelineApi.likeTweet(tweet.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Failed to like tweet:', error);
    }
  };

  const handleRetweet = async () => {
    try {
      await timelineApi.retweetTweet(tweet.id);
      setIsRetweeted(!isRetweeted);
      setRetweetCount(prev => isRetweeted ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Failed to retweet:', error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex space-x-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {tweet.username[0].toUpperCase()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">{tweet.displayName}</span>
            <span className="text-gray-500">@{tweet.username}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 text-sm">
              {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <div className="mt-2 text-gray-900 whitespace-pre-wrap">
            {tweet.content}
          </div>
          
          {tweet.mediaUrls && tweet.mediaUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {tweet.mediaUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt=""
                  className="rounded-lg max-h-64 w-full object-cover"
                />
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4 max-w-md">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <ChatBubbleOvalLeftIcon className="w-5 h-5" />
              <span className="text-sm">{tweet.replies}</span>
            </button>
            
            <button
              onClick={handleRetweet}
              className={`flex items-center space-x-2 transition-colors ${
                isRetweeted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
              }`}
            >
              {isRetweeted ? (
                <ArrowPathSolidIcon className="w-5 h-5" />
              ) : (
                <ArrowPathIcon className="w-5 h-5" />
              )}
              <span className="text-sm">{retweetCount}</span>
            </button>
            
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              {isLiked ? (
                <HeartSolidIcon className="w-5 h-5" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
              <span className="text-sm">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetCard;
