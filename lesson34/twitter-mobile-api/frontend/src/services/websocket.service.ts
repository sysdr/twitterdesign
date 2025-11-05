export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  
  connect(url: string): void {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'ping') {
          this.ws?.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else {
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
        }
      } catch (error) {
        console.error('[WebSocket] Invalid message:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.attemptReconnect(url);
    };
    
    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };
  }
  
  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => this.connect(url), delay);
    }
  }
  
  on(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }
  
  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
