"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const socket_io_1 = require("socket.io");
class SocketServer {
    io;
    constructor(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`📡 Client connected: ${socket.id}`);
            socket.on('subscribe-monitoring', () => {
                socket.join('monitoring-updates');
                console.log(`🔔 Client ${socket.id} subscribed to monitoring updates`);
            });
            socket.on('acknowledge-alert', (data) => {
                socket.broadcast.emit('alert-acknowledged', data);
            });
            socket.on('disconnect', () => {
                console.log(`📡 Client disconnected: ${socket.id}`);
            });
        });
    }
    broadcastSystemState(systemState) {
        this.io.to('monitoring-updates').emit('system-state-update', systemState);
    }
    broadcastNewAlerts(alerts) {
        this.io.to('monitoring-updates').emit('new-alerts', alerts);
    }
    broadcastAlertsResolved(alerts) {
        this.io.to('monitoring-updates').emit('alerts-resolved', alerts);
    }
    broadcastAlertAcknowledged(alert) {
        this.io.to('monitoring-updates').emit('alert-acknowledged', alert);
    }
}
exports.SocketServer = SocketServer;
//# sourceMappingURL=SocketServer.js.map