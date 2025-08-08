import React, { useState, useEffect } from 'react';
import { Event } from '../../types';

interface NotificationPanelProps {
  notifications: Event[];
  onClear: () => void;
}

export function NotificationPanel({ notifications, onClear }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatNotification = (event: Event): string => {
    switch (event.type) {
      case 'TWEET_LIKED':
        return `@${event.payload.likedBy} liked your tweet`;
      case 'USER_FOLLOWED':
        return `@${event.payload.followerId} followed you`;
      default:
        return `New ${event.type.toLowerCase()} event`;
    }
  };

  const formatTime = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="notification-panel">
      <button 
        className="notifications-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔 Notifications ({notifications.length})
      </button>
      
      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <button onClick={onClear}>Clear All</button>
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-content">
                    {formatNotification(notification)}
                  </div>
                  <div className="notification-time">
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
