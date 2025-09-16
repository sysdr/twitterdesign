import io, { Socket } from 'socket.io-client';
import { Tweet, MessageMetrics } from '../types';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    this.socket = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onTweetReceived(callback: (tweet: Tweet) => void): void {
    this.socket?.on('tweet-received', callback);
  }

  onMetricsUpdate(callback: (metrics: MessageMetrics) => void): void {
    this.socket?.on('metrics-update', callback);
  }

  publishTweet(tweet: Omit<Tweet, 'id' | 'timestamp'>): void {
    this.socket?.emit('publish-tweet', tweet);
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();
