import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage, Event } from '../types';

interface WebSocketConfig {
  url: string;
  userId: string;
  onEvent?: (event: Event) => void;
  onNotification?: (notification: any) => void;
  reconnectInterval?: number;
}

export function useWebSocket(config: WebSocketConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string>('');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const onEventRef = useRef<WebSocketConfig['onEvent']>();
  const onNotificationRef = useRef<WebSocketConfig['onNotification']>();

  // Keep latest callbacks without forcing reconnects
  useEffect(() => {
    onEventRef.current = config.onEvent;
    onNotificationRef.current = config.onNotification;
  }, [config.onEvent, config.onNotification]);

  const connect = useCallback(() => {
    try {
      // Prevent duplicate sockets
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const ws = new WebSocket(config.url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 WebSocket connected');
        setIsConnected(true);
        
        // Authenticate
        ws.send(JSON.stringify({
          type: 'AUTH',
          payload: { userId: config.userId, token: 'dummy_token' },
          timestamp: new Date()
        }));

        // Start ping interval
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'PING',
              payload: {},
              timestamp: new Date()
            }));
          }
        }, 30000);

        ws.addEventListener('close', () => clearInterval(pingInterval));
      };

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);

        switch (message.type) {
          case 'AUTH_SUCCESS':
            setConnectionId(message.payload.connectionId);
            console.log('✅ Authenticated:', message.payload);
            break;
          case 'TIMELINE_UPDATE':
            onEventRef.current?.(message.payload);
            break;
          case 'NOTIFICATION':
            onNotificationRef.current?.(message.payload);
            break;
          case 'PONG':
            // Handle pong
            break;
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        setConnectionId('');
        wsRef.current = null;
        
        // Attempt reconnection
        if (config.reconnectInterval) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, config.reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
    }
  }, [config.url, config.userId, config.reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionId,
    lastMessage,
    send,
    connect,
    disconnect
  };
}
