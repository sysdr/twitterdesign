import { useQuery } from 'react-query';
import { searchService } from '../services/searchService';
import { SearchResult } from '../types';

export interface TrendingData {
  trending: Array<{ key: string; count: number }>;
}

export const useSearchTweets = (query: string, filters: any = {}) => {
  return useQuery<SearchResult>(
    ['search', query, filters],
    () => searchService.search(query, filters),
    {
      enabled: query.length > 0,
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
    }
  );
};

export const useTrendingTopics = () => {
  return useQuery<TrendingData>(
    'trending',
    () => searchService.getTrending(),
    {
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
    }
  );
};
