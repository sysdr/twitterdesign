import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { moderationAPI } from '../services/api';
import { toast } from 'react-toastify';
import { AlertCircle, User, Calendar, MessageSquare } from 'lucide-react';

const Appeals: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const queryClient = useQueryClient();
  
  const { data: appeals, isLoading } = useQuery(
    ['appeals', selectedStatus],
    () => moderationAPI.getAppeals()
  );

  const processAppealMutation = useMutation(
    ({ appealId, decision, reason }: { appealId: string; decision: string; reason: string }) =>
      moderationAPI.processAppeal(appealId, decision, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appeals');
        toast.success('Appeal processed successfully');
      },
      onError: () => {
        toast.error('Failed to process appeal');
      }
    }
  );

  const handleProcessAppeal = (appealId: string, decision: string, reason: string) => {
    processAppealMutation.mutate({ appealId, decision, reason });
  };

  const filteredAppeals = appeals?.filter(appeal => 
    selectedStatus === 'all' || appeal.status === selectedStatus
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Appeals</h1>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Appeals</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppeals?.map((appeal) => (
            <AppealItem
              key={appeal.id}
              appeal={appeal}
              onProcess={handleProcessAppeal}
              isProcessing={processAppealMutation.isLoading}
            />
          ))}
          
          {filteredAppeals?.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No appeals found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface AppealItemProps {
  appeal: any;
  onProcess: (appealId: string, decision: string, reason: string) => void;
  isProcessing: boolean;
}

const AppealItem: React.FC<AppealItemProps> = ({ appeal, onProcess, isProcessing }) => {
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (decision && reason) {
      onProcess(appeal.id, decision, reason);
      setShowProcessForm(false);
      setDecision('');
      setReason('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">@{appeal.username}</span>
            <Calendar className="h-4 w-4 text-gray-500 ml-4" />
            <span className="text-sm text-gray-600">
              {new Date(appeal.created_at).toLocaleString()}
            </span>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Original Content</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-md mb-3">{appeal.content}</p>
            
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">
                Original Decision: {appeal.original_decision}
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Appeal Reason</h3>
            <p className="text-gray-700 bg-blue-50 p-3 rounded-md">{appeal.reason}</p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(appeal.status)}`}>
          {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
        </div>
      </div>

      {appeal.status === 'pending' && !showProcessForm && (
        <button
          onClick={() => setShowProcessForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Process Appeal
        </button>
      )}

      {showProcessForm && (
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
              <option value="approved">Approve Appeal</option>
              <option value="rejected">Reject Appeal</option>
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
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Process Appeal'}
            </button>
            <button
              type="button"
              onClick={() => setShowProcessForm(false)}
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

export default Appeals;
