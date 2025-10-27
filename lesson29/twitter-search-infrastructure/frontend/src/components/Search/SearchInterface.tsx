import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, TrendingUp, Clock, Heart, MessageCircle, Repeat } from 'lucide-react';
import { useSearchTweets } from '../../hooks/useSearchTweets';
import { SearchFilters } from './SearchFilters';
import { TweetCard } from './TweetCard';
import { TrendingTopics } from './TrendingTopics';
import { Tweet } from '../../types';

export const SearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  
  const { data, isLoading, error, refetch } = useSearchTweets(query, filters);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">Twitter Search</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {data?.total.toLocaleString()} tweets indexed
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TrendingTopics />
            
            {/* Search Analytics */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Search Analytics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-semibold">{data?.took}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Results</span>
                  <span className="font-semibold">{data?.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tweets..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleSearch(query)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t">
                  <SearchFilters onFiltersChange={setFilters} />
                </div>
              )}
            </div>

            {/* Search Results */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">Error loading search results</p>
                </div>
              ) : data?.tweets.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500">No tweets found for your search</p>
                </div>
              ) : (
                data?.tweets.map((tweet: Tweet) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
