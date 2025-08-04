import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tweet } from '../../types/tweet';
import { updateEngagement, updateTweet } from '../../api/client';
import { Heart, MessageCircle, Repeat2, Share, Edit, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TweetCardProps {
  tweet: Tweet;
}

export const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(tweet.content);
  const queryClient = useQueryClient();

  const engagementMutation = useMutation({
    mutationFn: ({ action }: { action: string }) =>
      updateEngagement(tweet.id, action, 'demo-user-id'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (content: string) => updateTweet(tweet.id, content),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
    },
  });

  const handleLike = () => {
    const action = tweet.engagement.likedByCurrentUser ? 'unlike' : 'like';
    engagementMutation.mutate({ action });
  };

  const handleRetweet = () => {
    const action = tweet.engagement.retweetedByCurrentUser ? 'unretweet' : 'retweet';
    engagementMutation.mutate({ action });
  };

  const handleEdit = () => {
    if (isEditing) {
      if (editContent.trim() && editContent !== tweet.content) {
        updateMutation.mutate(editContent.trim());
      } else {
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(tweet.content);
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex space-x-3">
        <img
          src={tweet.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tweet.authorUsername}`}
          alt={tweet.authorUsername}
          className="w-12 h-12 rounded-full"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-gray-900">@{tweet.authorUsername}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-500 text-sm">
              {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}
            </span>
            {tweet.version > 1 && (
              <div className="flex items-center space-x-1 text-gray-500 text-sm">
                <Edit size={12} />
                <span>v{tweet.version}</span>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-twitter-blue"
                maxLength={280}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className={`text-sm ${280 - editContent.length < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                  {280 - editContent.length} characters remaining
                </span>
                <div className="space-x-2">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-1 text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={!editContent.trim() || editContent.length > 280 || updateMutation.isPending}
                    className="px-4 py-1 bg-twitter-blue text-white rounded-full hover:bg-twitter-darkBlue disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-900 whitespace-pre-wrap">{tweet.content}</p>

              {/* Media */}
              {tweet.mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2 max-w-lg">
                  {tweet.mediaUrls.map((url, index) => (
                    <div key={index} className="rounded-lg overflow-hidden border">
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=Media';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Engagement Actions */}
              <div className="flex items-center justify-between max-w-md pt-2">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-twitter-blue group">
                  <div className="p-2 rounded-full group-hover:bg-blue-50">
                    <MessageCircle size={16} />
                  </div>
                  <span className="text-sm">{tweet.engagement.replies}</span>
                </button>

                <button
                  onClick={handleRetweet}
                  className={`flex items-center space-x-2 group ${
                    tweet.engagement.retweetedByCurrentUser ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
                  }`}
                >
                  <div className="p-2 rounded-full group-hover:bg-green-50">
                    <Repeat2 size={16} />
                  </div>
                  <span className="text-sm">{tweet.engagement.retweets}</span>
                </button>

                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 group ${
                    tweet.engagement.likedByCurrentUser ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <div className="p-2 rounded-full group-hover:bg-red-50">
                    <Heart size={16} fill={tweet.engagement.likedByCurrentUser ? 'currentColor' : 'none'} />
                  </div>
                  <span className="text-sm">{tweet.engagement.likes}</span>
                </button>

                <button className="flex items-center space-x-2 text-gray-500 hover:text-twitter-blue group">
                  <div className="p-2 rounded-full group-hover:bg-blue-50">
                    <Share size={16} />
                  </div>
                </button>

                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-twitter-blue group"
                >
                  <div className="p-2 rounded-full group-hover:bg-blue-50">
                    <Edit size={16} />
                  </div>
                </button>
              </div>

              {/* Performance Metrics */}
              <div className="text-xs text-gray-400 pt-2 border-t">
                Views: {tweet.engagement.views} • Created: {new Date(tweet.createdAt).toLocaleString()}
                {tweet.updatedAt !== tweet.createdAt && (
                  <span> • Last edited: {new Date(tweet.updatedAt).toLocaleString()}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
