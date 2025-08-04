import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTweets } from '../../api/client';
import { TweetCard } from '../Tweet/TweetCard';

export const TweetList: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tweets'],
    queryFn: () => getTweets(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">
          Error loading tweets: {(error as Error).message}
        </div>
        <button
          onClick={() => refetch()}
          className="bg-twitter-blue text-white px-4 py-2 rounded-full hover:bg-twitter-darkBlue"
        >
          Retry
        </button>
      </div>
    );
  }

  const tweets = data?.data?.items || [];

  if (tweets.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No tweets yet. Create your first tweet above!
      </div>
    );
  }

  return (
    <div className="divide-y">
      {tweets.map((tweet: any) => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
};
