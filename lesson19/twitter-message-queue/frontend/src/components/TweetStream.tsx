import React from 'react';
import { Tweet } from '../types';
import { MessageSquare, Clock, Hash } from 'lucide-react';

interface TweetStreamProps {
  tweets: Tweet[];
}

const TweetStream: React.FC<TweetStreamProps> = ({ tweets }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Live Tweet Stream
        </h2>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {tweets.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No tweets yet. Publish your first tweet!
          </div>
        ) : (
          tweets.map((tweet) => (
            <div key={tweet.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {tweet.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">@{tweet.username}</span>
                    <span className="text-gray-500 text-sm flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(tweet.timestamp).toLocaleTimeString()}
                    </span>
                    {tweet.partition !== undefined && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center">
                        <Hash className="w-3 h-3 mr-1" />
                        P{tweet.partition}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-gray-900">{tweet.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TweetStream;
