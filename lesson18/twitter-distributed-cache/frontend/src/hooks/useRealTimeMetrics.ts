import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Metrics {
  timestamp: number;
  totalHits: number;
  totalMisses: number;
  overallHitRate: number;
  avgResponseTime: number;
  nodesStats: Record<string, any>;
  health: {
    totalNodes: number;
    healthyNodes: number;
    unhealthyNodes: number;
    nodes: Record<string, any>;
  };
}

export const useRealTimeMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to metrics socket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from metrics socket');
      setIsConnected(false);
    });

    newSocket.on('metrics', (data: Metrics) => {
      setMetrics(data);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { metrics, isConnected, socket };
};
