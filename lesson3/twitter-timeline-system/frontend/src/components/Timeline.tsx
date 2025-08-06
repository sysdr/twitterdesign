import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { timelineApi } from '../services/api';
import { Tweet, TimelineResponse } from '../types/timeline';
import TweetCard from './TweetCard';
import LoadingSpinner from './LoadingSpinner';

const Timeline: React.FC = () => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [timelineModel, setTimelineModel] = useState<string>('hybrid');
  const [generationTime, setGenerationTime] = useState<number>(0);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const loadTimeline = useCallback(async (cursor?: string, isRefresh = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response: TimelineResponse = await timelineApi.getTimeline(cursor);
      
      if (isRefresh) {
        setTweets(response.tweets);
      } else {
        setTweets(prev => [...prev, ...response.tweets]);
      }
      
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setTimelineModel(response.model);
      setGenerationTime(response.generationTime);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    loadTimeline(undefined, true);
  }, []);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadTimeline(nextCursor);
    }
  }, [inView, hasMore, loading, nextCursor, loadTimeline]);

  const handleRefresh = () => {
    loadTimeline(undefined, true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Timeline Stats */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-blue-800">
              Timeline Model: <span className="bg-blue-100 px-2 py-1 rounded">{timelineModel}</span>
            </span>
          </div>
          <div className="text-sm text-blue-600">
            Generation: {generationTime}ms
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Refresh Timeline
        </button>
      </div>

      {/* Timeline Feed */}
      <div className="space-y-4">
        {tweets.map((tweet, index) => (
          <TweetCard key={`${tweet.id}-${index}`} tweet={tweet} />
        ))}
        
        {loading && <LoadingSpinner />}
        
        {hasMore && <div ref={ref} className="h-10" />}
        
        {!hasMore && tweets.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            You've reached the end of your timeline
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
