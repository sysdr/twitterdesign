import { io, Socket } from 'socket.io-client';
import { SystemState, Alert } from '../types/index.ts';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(): void {
    this.socket = io('http://localhost:5000');

    this.socket.on('connect', () => {
      console.log('📡 Connected to monitoring server');
      this.socket?.emit('subscribe-monitoring');
    });

    this.socket.on('system-state-update', (systemState: SystemState) => {
      this.emit('system-state-update', systemState);
    });

    this.socket.on('new-alerts', (alerts: Alert[]) => {
      this.emit('new-alerts', alerts);
    });

    this.socket.on('alerts-resolved', (alerts: Alert[]) => {
      this.emit('alerts-resolved', alerts);
    });

    this.socket.on('alert-acknowledged', (alert: Alert) => {
      this.emit('alert-acknowledged', alert);
    });

    this.socket.on('disconnect', () => {
      console.log('📡 Disconnected from monitoring server');
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  acknowledgeAlert(alertId: string, userId: string = 'operator'): void {
    this.socket?.emit('acknowledge-alert', { alertId, userId });
  }
}

export default new SocketService();
