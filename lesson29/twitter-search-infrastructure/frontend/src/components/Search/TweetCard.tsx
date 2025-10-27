import React from 'react';
import { Heart, MessageCircle, Repeat, Share, Clock } from 'lucide-react';

interface Tweet {
  id: string;
  content: string;
  author: {
    displayName: string;
    username: string;
    verified: boolean;
  };
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  hashtags: string[];
  _score?: number;
  highlight?: any;
}

interface TweetCardProps {
  tweet: Tweet;
}

export const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  const timeAgo = (date: string) => {
    const now = new Date();
    const tweetDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - tweetDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
          {tweet.author.displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900">{tweet.author.displayName}</h3>
            {tweet.author.verified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="text-gray-500">@{tweet.author.username}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {timeAgo(tweet.timestamp)}
            </span>
            {tweet._score && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                Score: {tweet._score.toFixed(2)}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="mb-3">
            <p 
              className="text-gray-900 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: tweet.highlight?.content?.[0] || tweet.content 
              }}
            />
            
            {tweet.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tweet.hashtags.map((hashtag) => (
                  <span
                    key={hashtag}
                    className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm"
                  >
                    {hashtag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6 text-gray-500">
            <button className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{tweet.replies.toLocaleString()}</span>
            </button>
            
            <button className="flex items-center space-x-2 hover:text-green-600 transition-colors">
              <Repeat className="w-4 h-4" />
              <span className="text-sm">{tweet.retweets.toLocaleString()}</span>
            </button>
            
            <button className="flex items-center space-x-2 hover:text-red-600 transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{tweet.likes.toLocaleString()}</span>
            </button>
            
            <button className="hover:text-blue-600 transition-colors">
              <Share className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
