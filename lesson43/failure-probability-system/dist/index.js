"use strict";
// Main Failure Probability Analysis System
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FailureProbabilitySystem = void 0;
const MetricsCollector_1 = require("./collectors/MetricsCollector");
const StatisticalAnalyzer_1 = require("./analyzers/StatisticalAnalyzer");
const FailurePredictor_1 = require("./predictors/FailurePredictor");
const RedundancyOptimizer_1 = require("./optimizers/RedundancyOptimizer");
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const http = __importStar(require("http"));
const path = __importStar(require("path"));
class FailureProbabilitySystem {
    collector;
    analyzer;
    predictor;
    optimizer;
    wsServer = null;
    predictionHistory = [];
    constructor() {
        this.collector = new MetricsCollector_1.MetricsCollector(1000); // Collect every second
        this.analyzer = new StatisticalAnalyzer_1.StatisticalAnalyzer();
        this.predictor = new FailurePredictor_1.FailurePredictor();
        this.optimizer = new RedundancyOptimizer_1.RedundancyOptimizer();
    }
    async start(port = 3000) {
        const app = (0, express_1.default)();
        const server = http.createServer(app);
        // WebSocket server for real-time updates
        this.wsServer = new ws_1.WebSocketServer({ server });
        app.use(express_1.default.static(path.join(__dirname, '../public')));
        app.use(express_1.default.json());
        // API endpoints
        app.get('/api/current-prediction', (req, res) => {
            const metrics = this.collector.getAllMetrics();
            if (metrics.length === 0) {
                return res.json({
                    probability1Hour: 0.001,
                    riskLevel: 'low',
                    recommendations: ['System initializing...']
                });
            }
            const analysis = this.analyzer.analyzeFailureRate(metrics);
            const prediction = this.predictor.predict(metrics, analysis);
            const redundancy = this.optimizer.optimizeRedundancy(prediction);
            res.json({
                prediction,
                analysis,
                redundancy,
                currentMetrics: metrics[metrics.length - 1]
            });
        });
        app.get('/api/metrics-history', (req, res) => {
            const count = parseInt(req.query.count) || 100;
            res.json(this.collector.getRecentMetrics(count));
        });
        app.get('/api/prediction-history', (req, res) => {
            res.json(this.predictionHistory);
        });
        app.post('/api/simulate-load', (req, res) => {
            const { load } = req.body;
            this.collector.simulateLoad(load);
            res.json({ success: true, load });
        });
        app.post('/api/inject-error', (req, res) => {
            this.collector.injectError();
            res.json({ success: true });
        });
        // Start metrics collection
        this.collector.startCollection((metric) => {
            // Analyze and predict every 10 seconds
            if (metric.timestamp % 10000 < 1000) {
                this.performAnalysisAndPredict();
            }
            // Send real-time updates to all connected clients
            this.broadcastUpdate({
                type: 'metric',
                data: metric
            });
        });
        // Start server
        server.listen(port, () => {
            console.log(`\n✓ Failure Probability System running on http://localhost:${port}`);
            console.log('  Dashboard: http://localhost:${port}');
            console.log('  API: http://localhost:${port}/api/current-prediction\n');
        });
    }
    performAnalysisAndPredict() {
        const metrics = this.collector.getAllMetrics();
        if (metrics.length < 10)
            return;
        const analysis = this.analyzer.analyzeFailureRate(metrics);
        const prediction = this.predictor.predict(metrics, analysis);
        const redundancy = this.optimizer.optimizeRedundancy(prediction);
        // Store prediction history
        this.predictionHistory.push({
            timestamp: Date.now(),
            ...prediction,
            redundancy
        });
        // Keep last 1000 predictions
        if (this.predictionHistory.length > 1000) {
            this.predictionHistory.shift();
        }
        // Broadcast prediction
        this.broadcastUpdate({
            type: 'prediction',
            data: { prediction, analysis, redundancy }
        });
        // Log significant events
        if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
            console.log(`\n⚠️  ${prediction.riskLevel.toUpperCase()} RISK DETECTED`);
            console.log(`   Failure Probability (1hr): ${(prediction.probability1Hour * 100).toFixed(2)}%`);
            console.log(`   Recommendations:`);
            prediction.recommendations.forEach(rec => {
                console.log(`   - ${rec}`);
            });
            console.log();
        }
    }
    broadcastUpdate(message) {
        if (!this.wsServer)
            return;
        const data = JSON.stringify(message);
        this.wsServer.clients.forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(data);
            }
        });
    }
}
exports.FailureProbabilitySystem = FailureProbabilitySystem;
// Start system if run directly
if (require.main === module) {
    const system = new FailureProbabilitySystem();
    system.start(3000).catch(console.error);
}
