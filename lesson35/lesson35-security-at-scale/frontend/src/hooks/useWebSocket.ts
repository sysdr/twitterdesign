import { useEffect, useState } from 'react';

interface SecurityUpdate {
  stats: Record<string, number>;
  recentEvents: any[];
}

export const useWebSocket = (url: string) => {
  const [data, setData] = useState<SecurityUpdate | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'security_update') {
        setData({
          stats: message.stats,
          recentEvents: message.recentEvents
        });
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { data, connected };
};
