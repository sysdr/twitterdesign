import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { MeteringService } from './services/metering/MeteringService';
import { CostCalculator } from './services/calculator/CostCalculator';
import { AllocationEngine } from './services/allocation/AllocationEngine';
import { OptimizationEngine } from './services/optimization/OptimizationEngine';
import { AnomalyDetector } from './services/anomaly/AnomalyDetector';
import { BudgetController } from './services/budget/BudgetController';
import { dashboardRouter, setServices } from './controllers/dashboardController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const meteringService = new MeteringService();
const costCalculator = new CostCalculator();
const allocationEngine = new AllocationEngine();
const optimizationEngine = new OptimizationEngine();
const anomalyDetector = new AnomalyDetector();
const budgetController = new BudgetController();

// Start services
meteringService.start();
costCalculator.start(meteringService);
allocationEngine.start(costCalculator);
optimizationEngine.start(allocationEngine);
anomalyDetector.start(costCalculator);
budgetController.start(allocationEngine);

// Inject services into dashboard controller
setServices({
  meteringService,
  costCalculator,
  allocationEngine,
  optimizationEngine,
  anomalyDetector,
  budgetController
});

// API Routes
app.use('/api', dashboardRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      metering: meteringService.isHealthy(),
      calculator: costCalculator.isHealthy(),
      allocation: allocationEngine.isHealthy(),
      optimization: optimizationEngine.isHealthy(),
      anomaly: anomalyDetector.isHealthy(),
      budget: budgetController.isHealthy()
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`FinOps API server running on port ${PORT}`);
  logger.info(`Dashboard available at http://localhost:${process.env.UI_PORT || 3000}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  meteringService.stop();
  costCalculator.stop();
  allocationEngine.stop();
  optimizationEngine.stop();
  anomalyDetector.stop();
  budgetController.stop();
  process.exit(0);
});
