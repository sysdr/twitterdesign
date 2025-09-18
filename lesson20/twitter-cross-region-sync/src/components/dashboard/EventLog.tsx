import React from 'react';
import { ReplicationEvent } from '../../types';

interface Props {
  events: ReplicationEvent[];
}

export const EventLog: React.FC<Props> = ({ events }) => {
  const getEventTypeColor = (type: ReplicationEvent['type']) => {
    switch (type) {
      case 'TWEET_CREATE': return 'bg-blue-100 text-blue-800';
      case 'TWEET_UPDATE': return 'bg-yellow-100 text-yellow-800';
      case 'USER_FOLLOW': return 'bg-green-100 text-green-800';
      case 'USER_UNFOLLOW': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Event Replication Log</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {events.slice(-10).reverse().map(event => (
          <div key={`${event.id}-${event.timestamp}`} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center space-x-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
                {event.type}
              </span>
              <span className="text-sm font-mono">{event.id.substring(0, 8)}...</span>
              <span className="text-sm text-gray-600">from {event.originRegion}</span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(event.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {events.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No replication events yet. Start creating some data!
          </div>
        )}
      </div>
    </div>
  );
};
