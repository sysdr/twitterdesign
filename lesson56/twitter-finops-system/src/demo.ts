import { MeteringService } from './services/metering/MeteringService';
import { CostCalculator } from './services/calculator/CostCalculator';
import { AllocationEngine } from './services/allocation/AllocationEngine';
import { OptimizationEngine } from './services/optimization/OptimizationEngine';
import { AnomalyDetector } from './services/anomaly/AnomalyDetector';
import { BudgetController } from './services/budget/BudgetController';
import { logger } from './utils/logger';

async function runDemo() {
  logger.info('='.repeat(60));
  logger.info('Twitter FinOps System - Demonstration');
  logger.info('='.repeat(60));

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

  // Wait for data collection
  logger.info('\\nCollecting metrics for 30 seconds...\\n');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Display results
  logger.info('\\n' + '='.repeat(60));
  logger.info('Cost Summary');
  logger.info('='.repeat(60));
  
  const totalCost = costCalculator.getTotalCost(60);
  const hourlyCost = totalCost;
  const dailyCost = hourlyCost * 24;
  const monthlyCost = dailyCost * 30;
  
  logger.info(`Hourly Cost:   $${hourlyCost.toFixed(2)}`);
  logger.info(`Daily Cost:    $${dailyCost.toFixed(2)}`);
  logger.info(`Monthly Cost:  $${monthlyCost.toFixed(2)}`);

  logger.info('\\n' + '='.repeat(60));
  logger.info('Cost by Service');
  logger.info('='.repeat(60));
  
  const costsByService = costCalculator.getCostsByService();
  costsByService.forEach((cost, service) => {
    logger.info(`${service.padEnd(25)} $${cost.toFixed(4)}/hour`);
  });

  logger.info('\\n' + '='.repeat(60));
  logger.info('Cost by Team');
  logger.info('='.repeat(60));
  
  const costsByTeam = allocationEngine.getCostsByTeam();
  costsByTeam.forEach((cost, team) => {
    logger.info(`${team.padEnd(25)} $${cost.toFixed(4)}/hour`);
  });

  logger.info('\\n' + '='.repeat(60));
  logger.info('Optimization Recommendations');
  logger.info('='.repeat(60));
  
  const recommendations = optimizationEngine.getRecommendations();
  logger.info(`Found ${recommendations.length} optimization opportunities\\n`);
  
  recommendations.forEach((rec, idx) => {
    logger.info(`${idx + 1}. ${rec.title}`);
    logger.info(`   Type: ${rec.type}`);
    logger.info(`   Savings: $${rec.savingsAmount.toFixed(2)}/month (${rec.savingsPercentage}%)`);
    logger.info(`   Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
    logger.info('');
  });

  const totalSavings = optimizationEngine.getTotalSavingsOpportunity();
  logger.info(`Total Monthly Savings Opportunity: $${totalSavings.toFixed(2)}`);

  logger.info('\\n' + '='.repeat(60));
  logger.info('Cost Anomalies');
  logger.info('='.repeat(60));
  
  const anomalies = anomalyDetector.getRecentAnomalies(24);
  if (anomalies.length === 0) {
    logger.info('No anomalies detected');
  } else {
    anomalies.forEach((anomaly, idx) => {
      logger.info(`${idx + 1}. ${anomaly.description}`);
      logger.info(`   Severity: ${anomaly.severity}`);
      logger.info(`   Deviation: ${anomaly.deviation.toFixed(1)}%`);
      logger.info('');
    });
  }

  logger.info('\\n' + '='.repeat(60));
  logger.info('Budget Status');
  logger.info('='.repeat(60));
  
  const budgets = budgetController.getBudgets();
  budgets.forEach(budget => {
    const utilization = (budget.forecastedSpend / budget.monthlyLimit) * 100;
    logger.info(`${budget.name}`);
    logger.info(`  Monthly Limit: $${budget.monthlyLimit.toLocaleString()}`);
    logger.info(`  Forecasted:    $${budget.forecastedSpend.toFixed(2)} (${utilization.toFixed(1)}%)`);
    logger.info(`  Status:        ${budget.status.toUpperCase()}`);
    logger.info('');
  });

  logger.info('\\n' + '='.repeat(60));
  logger.info('Demo Complete - Dashboard available at http://localhost:3000');
  logger.info('='.repeat(60));
  logger.info('\\nPress Ctrl+C to stop services\\n');
}

runDemo().catch(console.error);
