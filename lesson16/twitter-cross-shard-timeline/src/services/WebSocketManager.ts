import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws, req) => {
      const userId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('userId');
      
      if (userId) {
        this.clients.set(userId, ws);
        console.log(`📱 WebSocket connected for user ${userId}`);
        
        ws.on('close', () => {
          this.clients.delete(userId);
          console.log(`📱 WebSocket disconnected for user ${userId}`);
        });
      }
    });
    
    console.log('🔌 WebSocket server initialized');
  }

  broadcastTimelineUpdate(userId: string, update: any) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'timeline_update',
        data: update
      }));
    }
  }
}
