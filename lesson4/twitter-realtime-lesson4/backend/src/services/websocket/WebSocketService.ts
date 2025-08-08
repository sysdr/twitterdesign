import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { ClientConnection, WebSocketMessage, Event } from '../../types/index.js';
import { RedisService } from '../redis/RedisService.js';

export class WebSocketService {
  private wss: WebSocketServer;
  private connections: Map<string, ClientConnection> = new Map();
  private userConnections: Map<string, string> = new Map();
  private redisService: RedisService;
  private pingInterval: NodeJS.Timeout = setTimeout(() => {}, 0);

  constructor(port: number, redisService: RedisService) {
    this.wss = new WebSocketServer({ port });
    this.redisService = redisService;
    this.setupServer();
    this.startPingInterval();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const connectionId = uuidv4();
      console.log(`🔗 New WebSocket connection: ${connectionId}`);

      // Store WebSocket with connection ID for later retrieval
      (ws as any).connectionId = connectionId;

      ws.on('message', (data) => {
        this.handleMessage(connectionId, data.toString());
      });

      ws.on('close', () => {
        this.handleDisconnection(connectionId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${connectionId}:`, error);
        this.handleDisconnection(connectionId);
      });
    });

    console.log(`🚀 WebSocket server listening on port ${this.wss.options.port}`);
  }

  private handleMessage(connectionId: string, message: string): void {
    try {
      console.log(`📨 Received message from ${connectionId}:`, message);
      const wsMessage: WebSocketMessage = JSON.parse(message);
      
      switch (wsMessage.type) {
        case 'AUTH':
          console.log(`🔐 Processing AUTH for ${connectionId}`);
          this.handleAuthentication(connectionId, wsMessage.payload);
          break;
        case 'SUBSCRIBE':
          this.handleSubscription(connectionId, wsMessage.payload);
          break;
        case 'PING':
          this.handlePing(connectionId);
          break;
        default:
          console.warn(`Unknown message type: ${wsMessage.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private async handleAuthentication(connectionId: string, payload: any): Promise<void> {
    const { userId, token } = payload;
    console.log(`🔐 Authenticating user ${userId} for connection ${connectionId}`);
    
    // In production, verify JWT token here
    if (userId) {
      const ws = this.getWebSocket(connectionId);
      if (!ws) {
        console.error(`❌ WebSocket not found for connection ${connectionId}`);
        return;
      }

      console.log(`✅ Found WebSocket for connection ${connectionId}, readyState: ${ws.readyState}`);

      const connection: ClientConnection = {
        id: connectionId,
        userId,
        ws,
        subscriptions: new Set(),
        lastPing: new Date()
      };

      this.connections.set(connectionId, connection);
      this.userConnections.set(userId, connectionId);
      
      await this.redisService.setUserOnline(userId, connectionId);
      
      console.log(`📤 Sending AUTH_SUCCESS to ${connectionId}`);
      this.sendToClient(connectionId, {
        type: 'AUTH_SUCCESS',
        payload: { userId, connectionId },
        timestamp: new Date()
      });

      // Subscribe to user's personal channels
      await this.subscribeToUserChannels(userId);
      console.log(`✅ Authentication completed for ${userId}`);
    }
  }

  private handleSubscription(connectionId: string, payload: any): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      const { channels } = payload;
      channels.forEach((channel: string) => {
        connection.subscriptions.add(channel);
      });
    }
  }

  private handlePing(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastPing = new Date();
      this.sendToClient(connectionId, {
        type: 'PONG',
        payload: {},
        timestamp: new Date()
      });
    }
  }

  private async handleDisconnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      await this.redisService.setUserOffline(connection.userId, connectionId);
      this.userConnections.delete(connection.userId);
      this.connections.delete(connectionId);
      console.log(`🔌 Connection ${connectionId} disconnected`);
    }
  }

  private getWebSocket(connectionId: string): WebSocket | null {
    return Array.from(this.wss.clients).find((client: any) => 
      client.connectionId === connectionId
    ) || null;
  }

  public sendToClient(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.error(`❌ Connection not found for ${connectionId}`);
      return;
    }
    
    if (connection.ws.readyState !== WebSocket.OPEN) {
      console.error(`❌ WebSocket not open for ${connectionId}, readyState: ${connection.ws.readyState}`);
      return;
    }
    
    try {
      const messageStr = JSON.stringify(message);
      connection.ws.send(messageStr);
      console.log(`✅ Sent message to ${connectionId}:`, message.type);
    } catch (error) {
      console.error(`❌ Error sending message to ${connectionId}:`, error);
    }
  }

  public sendToUser(userId: string, message: WebSocketMessage): void {
    const connectionId = this.userConnections.get(userId);
    if (connectionId) {
      this.sendToClient(connectionId, message);
    }
  }

  public broadcastToUsers(userIds: string[], message: WebSocketMessage): void {
    userIds.forEach(userId => {
      this.sendToUser(userId, message);
    });
  }

  private async subscribeToUserChannels(userId: string): Promise<void> {
    // Subscribe to user's timeline updates
    await this.redisService.subscribe(`timeline:${userId}`, (event: Event) => {
      this.sendToUser(userId, {
        type: 'TIMELINE_UPDATE',
        payload: event,
        timestamp: new Date()
      });
    });

    // Subscribe to notifications
    await this.redisService.subscribe(`notifications:${userId}`, (event: Event) => {
      this.sendToUser(userId, {
        type: 'NOTIFICATION',
        payload: event,
        timestamp: new Date()
      });
    });
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.connections.forEach((connection, connectionId) => {
        const timeSinceLastPing = Date.now() - connection.lastPing.getTime();
        if (timeSinceLastPing > 60000) { // 60 seconds timeout
          this.handleDisconnection(connectionId);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  public getActiveConnections(): number {
    return this.connections.size;
  }

  public close(): void {
    clearInterval(this.pingInterval);
    this.wss.close();
  }
}
