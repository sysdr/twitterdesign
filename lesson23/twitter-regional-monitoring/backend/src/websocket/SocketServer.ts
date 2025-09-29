import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { SystemState, Alert } from '../../types/monitoring';

export class SocketServer {
  private io: SocketIOServer;

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`📡 Client connected: ${socket.id}`);

      socket.on('subscribe-monitoring', () => {
        socket.join('monitoring-updates');
        console.log(`🔔 Client ${socket.id} subscribed to monitoring updates`);
      });

      socket.on('acknowledge-alert', (data: { alertId: string, userId: string }) => {
        socket.broadcast.emit('alert-acknowledged', data);
      });

      socket.on('disconnect', () => {
        console.log(`📡 Client disconnected: ${socket.id}`);
      });
    });
  }

  broadcastSystemState(systemState: SystemState): void {
    this.io.to('monitoring-updates').emit('system-state-update', systemState);
  }

  broadcastNewAlerts(alerts: Alert[]): void {
    this.io.to('monitoring-updates').emit('new-alerts', alerts);
  }

  broadcastAlertsResolved(alerts: Alert[]): void {
    this.io.to('monitoring-updates').emit('alerts-resolved', alerts);
  }

  broadcastAlertAcknowledged(alert: Alert): void {
    this.io.to('monitoring-updates').emit('alert-acknowledged', alert);
  }
}
