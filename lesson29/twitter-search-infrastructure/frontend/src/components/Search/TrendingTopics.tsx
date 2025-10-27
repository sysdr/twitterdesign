import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useTrendingTopics } from '../../hooks/useSearchTweets';

export const TrendingTopics: React.FC = () => {
  const { data, isLoading } = useTrendingTopics();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Trending Topics</h3>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.trending?.slice(0, 5).map((item: { key: string; count: number }, index: number) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {index + 1}. {item.key}
              </span>
              <span className="text-xs text-gray-500">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

