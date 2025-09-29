"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const winston_1 = __importDefault(require("winston"));
const RegionalCollector_1 = require("./collectors/RegionalCollector");
const GlobalAggregator_1 = require("./aggregator/GlobalAggregator");
const AlertEngine_1 = require("./alerts/AlertEngine");
const SocketServer_1 = require("./websocket/SocketServer");
// Logger configuration
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple()
        })
    ]
});
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json());
// Initialize monitoring components
const globalAggregator = new GlobalAggregator_1.GlobalAggregator();
const alertEngine = new AlertEngine_1.AlertEngine();
const socketServer = new SocketServer_1.SocketServer(server);
// Regional collectors
const regions = ['us-east', 'europe', 'asia-pacific'];
const collectors = [];
regions.forEach(regionId => {
    const collector = new RegionalCollector_1.RegionalCollector(regionId);
    collectors.push(collector);
    collector.on('metrics', (metrics) => {
        globalAggregator.addMetrics(metrics);
    });
    collector.startCollection();
});
// Event handlers
globalAggregator.on('systemStateUpdate', (systemState) => {
    alertEngine.evaluateSystemState(systemState);
    socketServer.broadcastSystemState(systemState);
});
alertEngine.on('newAlerts', (alerts) => {
    socketServer.broadcastNewAlerts(alerts);
    logger.info(`🚨 New alerts generated: ${alerts.length}`);
});
alertEngine.on('alertsResolved', (alerts) => {
    socketServer.broadcastAlertsResolved(alerts);
    logger.info(`✅ Alerts resolved: ${alerts.length}`);
});
alertEngine.on('alertAcknowledged', (alert) => {
    socketServer.broadcastAlertAcknowledged(alert);
    logger.info(`👤 Alert acknowledged: ${alert.id}`);
});
// REST API endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
});
app.get('/api/system-state', (req, res) => {
    res.json(globalAggregator.getSystemState());
});
app.get('/api/alerts', (req, res) => {
    res.json(alertEngine.getActiveAlerts());
});
app.post('/api/alerts/:id/acknowledge', (req, res) => {
    const { id } = req.params;
    const { userId = 'anonymous' } = req.body;
    const success = alertEngine.acknowledgeAlert(id, userId);
    if (success) {
        res.json({ message: 'Alert acknowledged' });
    }
    else {
        res.status(404).json({ error: 'Alert not found' });
    }
});
// Simulate regional issues for testing
app.post('/api/simulate-issue', (req, res) => {
    const { regionIndex = 0, severity = 'minor' } = req.body;
    if (collectors[regionIndex]) {
        collectors[regionIndex].simulateIssue(severity);
        res.json({ message: `Simulated ${severity} issue in region ${regionIndex}` });
    }
    else {
        res.status(400).json({ error: 'Invalid region index' });
    }
});
app.post('/api/reset-regions', (req, res) => {
    collectors.forEach(collector => collector.resetToNormal());
    res.json({ message: 'All regions reset to normal' });
});
server.listen(PORT, () => {
    logger.info(`🚀 Regional monitoring server running on port ${PORT}`);
    logger.info(`📊 Monitoring ${regions.length} regions: ${regions.join(', ')}`);
});
// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('🛑 Shutting down monitoring server...');
    collectors.forEach(collector => collector.stopCollection());
    server.close();
    process.exit(0);
});
//# sourceMappingURL=index.js.map