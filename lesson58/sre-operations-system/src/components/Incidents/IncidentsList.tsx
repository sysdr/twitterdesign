import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const IncidentsList: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    // Add timeout to prevent hanging
    const fetchWithTimeout = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch('/api/incidents/active', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (Array.isArray(data)) {
          setIncidents(data);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch incidents:', error);
        }
      }
    };

    // Fetch immediately
    fetchWithTimeout();
    // Then fetch every 10 seconds (reduced frequency)
    const interval = setInterval(fetchWithTimeout, 10000);
    
    // Listen for manual refresh events
    const handleRefresh = () => {
      fetchWithTimeout();
    };
    window.addEventListener('refresh-dashboard', handleRefresh);

    // WebSocket for real-time updates
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let shouldReconnect = true;
    
    const connectWebSocket = () => {
      try {
        // Connect directly to backend WebSocket server (bypass Vite proxy)
        // In development, connect to localhost:8080, in production use the same host
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const wsHost = isDev ? 'localhost:8080' : window.location.host.replace(':3000', ':8080');
        const wsUrl = `ws://${wsHost}/ws`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          // Clear any pending reconnection
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'incident_update') {
              fetchWithTimeout();
            } else if (message.type === 'connected') {
              console.log('WebSocket:', message.message);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onerror = () => {
          // Suppress error logging - connection errors are handled by onclose
          // The error event fires before onclose, so we don't need to log it here
          // This prevents console spam during connection attempts
        };
        
        ws.onclose = (event) => {
          if (event.code !== 1000) {
            console.log('WebSocket closed', event.code, event.reason || '');
          }
          ws = null;
          
          // Attempt to reconnect after a delay if not a normal closure and we should reconnect
          if (shouldReconnect && event.code !== 1000) {
            reconnectTimeout = setTimeout(() => {
              console.log('Attempting to reconnect WebSocket...');
              connectWebSocket();
            }, 3000);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        // Retry after delay
        if (shouldReconnect) {
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      }
    };

    // Initial connection
    connectWebSocket();

    return () => {
      shouldReconnect = false;
      clearInterval(interval);
      window.removeEventListener('refresh-dashboard', handleRefresh);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, 'Component unmounting');
        }
      }
    };
  }, []);

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'bg-red-100 text-red-700 border-red-300';
    if (severity >= 3) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-orange-500" />
        Active Incidents
      </h2>

      <div className="space-y-4">
        {incidents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-600">No active incidents</p>
            <p className="text-sm text-slate-500">System operating normally</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(incident.severity)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold mb-1">{incident.title}</div>
                  <div className="text-sm opacity-80">{incident.description}</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white shadow">
                  P{incident.severity}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs mt-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(incident.created_at).toLocaleTimeString()}
                </span>
                <span className="px-2 py-1 bg-white rounded shadow">
                  {incident.component}
                </span>
                {incident.runbook_executed && (
                  <span className="text-green-700 font-medium">
                    ✓ Auto-resolved
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
