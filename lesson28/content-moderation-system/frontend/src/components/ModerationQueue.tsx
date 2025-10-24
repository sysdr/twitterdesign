import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { moderationAPI } from '../services/api';
import { toast } from 'react-toastify';
import { AlertTriangle, User, Calendar } from 'lucide-react';

const ModerationQueue: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const queryClient = useQueryClient();
  
  const { data: queue, isLoading } = useQuery(
    ['moderation-queue', selectedStatus],
    () => moderationAPI.getQueue(selectedStatus)
  );

  const reviewMutation = useMutation(moderationAPI.submitReview, {
    onSuccess: () => {
      queryClient.invalidateQueries('moderation-queue');
      toast.success('Review submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit review');
    }
  });

  const handleReview = (postId: string, decision: string, reason: string) => {
    reviewMutation.mutate({
      postId,
      decision,
      reason,
      moderatorId: 'cc29e70e-d3f2-4a3d-b09f-836eb24a99f7' // Valid user ID
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Moderation Queue</h1>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="pending">Pending Review</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {queue?.map((item: any) => (
            <ModerationItem
              key={item.id}
              item={item}
              onReview={handleReview}
              isSubmitting={reviewMutation.isLoading}
            />
          ))}
          
          {queue?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No items in queue</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ModerationItemProps {
  item: any;
  onReview: (postId: string, decision: string, reason: string) => void;
  isSubmitting: boolean;
}

const ModerationItem: React.FC<ModerationItemProps> = ({ item, onReview, isSubmitting }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (decision && reason) {
      onReview(item.post_id, decision, reason);
      setShowReviewForm(false);
      setDecision('');
      setReason('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">@{item.username}</span>
            <Calendar className="h-4 w-4 text-gray-500 ml-4" />
            <span className="text-sm text-gray-600">
              {new Date(item.created_at).toLocaleString()}
            </span>
          </div>
          
          <p className="text-gray-900 mb-4">{item.content}</p>
          
          {item.violation_type && (
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-600">
                Flagged for: {item.violation_type} (Confidence: {Math.round(item.confidence_score * 100)}%)
              </span>
            </div>
          )}
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm ${
          item.priority <= 2 
            ? 'bg-red-100 text-red-800' 
            : item.priority <= 4 
            ? 'bg-orange-100 text-orange-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          Priority {item.priority}
        </div>
      </div>

      {!showReviewForm ? (
        <button
          onClick={() => setShowReviewForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Review Content
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decision
            </label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select decision...</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Explain your decision..."
              required
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ModerationQueue;
