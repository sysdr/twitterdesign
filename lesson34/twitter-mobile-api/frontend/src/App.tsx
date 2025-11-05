import { useEffect, useState } from 'react';
import { Tweet } from '../../shared/types';
import { OfflineStorageService } from './services/offline-storage.service';
import { DeltaSyncService } from './services/delta-sync.service';
import { SyncQueueService } from './services/sync-queue.service';
import { WebSocketService } from './services/websocket.service';
import './App.css';

const API_URL = '/api';
const WS_URL = `ws://${window.location.host}/ws`;

export default function App() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dataSaved, setDataSaved] = useState(0);
  const [stats, setStats] = useState({ requests: 0, avgDataPerRequest: 0 });
  const [newTweetContent, setNewTweetContent] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [storage] = useState(() => new OfflineStorageService());
  const [deltaSync] = useState(() => new DeltaSyncService(storage, API_URL));
  const [syncQueue] = useState(() => new SyncQueueService(storage, API_URL));
  const [ws] = useState(() => new WebSocketService());
  
  useEffect(() => {
    initializeApp();
    
    return () => {
      ws.disconnect();
    };
  }, []);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncTimeline();
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const initializeApp = async () => {
    try {
      await storage.initialize();
      console.log('Storage initialized');
      
      // Load cached tweets
      const cachedTweets = await storage.getTweets(50);
      console.log('Cached tweets:', cachedTweets.length);
      if (cachedTweets.length > 0) {
        setTweets(cachedTweets);
      }
      
      // Initial sync
      await syncTimeline();
      
      // Connect WebSocket
      ws.connect(WS_URL);
      ws.on('new_tweet', (tweet: Tweet) => {
        setTweets(prev => [tweet, ...prev]);
        storage.saveTweet(tweet);
      });
      
      // Load stats
      fetchStats();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };
  
  const syncTimeline = async () => {
    setIsSyncing(true);
    
    try {
      const { tweets: syncedTweets, dataSaved: saved } = await deltaSync.syncTimeline();
      console.log('Synced tweets:', syncedTweets.length, syncedTweets);
      setTweets(syncedTweets);
      setDataSaved(saved);
      await fetchStats();
    } catch (error) {
      console.error('Sync failed:', error);
      // Fallback: try to get tweets directly from API
      try {
        const response = await fetch(`${API_URL}/timeline/full?limit=50`);
        const data = await response.json();
        if (data.tweets && data.tweets.length > 0) {
          setTweets(data.tweets);
          await storage.saveTweets(data.tweets);
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    } finally {
      setIsSyncing(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await fetch('/metrics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };
  
  const postTweet = async () => {
    if (!newTweetContent.trim()) return;
    
    const tempTweet: Tweet = {
      id: `temp_${Date.now()}`,
      content: newTweetContent,
      authorId: 'user1',
      authorName: 'You',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0,
      status: 'pending'
    };
    
    // Optimistic update
    setTweets(prev => [tempTweet, ...prev]);
    await storage.saveTweet(tempTweet);
    
    // Queue for sync
    await syncQueue.queueAction({
      type: 'POST_TWEET',
      data: {
        content: newTweetContent,
        authorId: 'user1',
        authorName: 'You'
      },
      timestamp: Date.now()
    });
    
    setNewTweetContent('');
    
    // Sync if online
    if (isOnline) {
      await syncTimeline();
    }
  };
  
  const likeTweet = async (tweetId: string) => {
    await syncQueue.queueAction({
      type: 'LIKE_TWEET',
      data: { tweetId },
      timestamp: Date.now()
    });
    
    // Optimistic update
    setTweets(prev => prev.map(t => 
      t.id === tweetId ? { ...t, likesCount: t.likesCount + 1 } : t
    ));
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  };
  
  return (
    <div className="app">
      <header className="header">
        <h1>📱 Mobile-Optimized Twitter</h1>
        <div className="status">
          <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          {isSyncing && <span className="syncing">⏳ Syncing...</span>}
        </div>
      </header>
      
      <div className="stats-banner">
        <div className="stat">
          <span className="stat-label">Data Saved:</span>
          <span className="stat-value">{dataSaved}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Requests:</span>
          <span className="stat-value">{stats.requests}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Avg/Request:</span>
          <span className="stat-value">{formatBytes(stats.avgDataPerRequest)}</span>
        </div>
      </div>
      
      <div className="compose-tweet">
        <textarea
          value={newTweetContent}
          onChange={(e) => setNewTweetContent(e.target.value)}
          placeholder="What's happening?"
          rows={3}
        />
        <button onClick={postTweet} disabled={!newTweetContent.trim()}>
          Tweet
        </button>
      </div>
      
      <button className="sync-button" onClick={syncTimeline} disabled={isSyncing || !isOnline}>
        🔄 {isSyncing ? 'Syncing...' : 'Sync Timeline'}
      </button>
      
      <div className="timeline">
        {tweets.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            {isSyncing ? 'Loading tweets...' : 'No tweets yet. Click "Sync Timeline" to load tweets.'}
          </div>
        ) : (
          tweets.map(tweet => (
            <div key={tweet.id} className="tweet">
              <div className="tweet-header">
                <span className="tweet-author">{tweet.authorName}</span>
                <span className="tweet-time">
                  {new Date(tweet.createdAt).toLocaleTimeString()}
                </span>
                {tweet.status === 'pending' && (
                  <span className="tweet-status">⏳ Pending</span>
                )}
              </div>
              <div className="tweet-content">{tweet.content}</div>
              <div className="tweet-actions">
                <button onClick={() => likeTweet(tweet.id)}>
                  ❤️ {tweet.likesCount}
                </button>
                <button>💬 {tweet.repliesCount}</button>
                <button>🔁 {tweet.retweetsCount}</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
