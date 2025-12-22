import { Router } from 'express';
import { Budget, CostData, OptimizationRecommendation, CostAnomaly } from '../models/CostModels';

export const dashboardRouter = Router();

// These will be injected from main app
let services: any = {};

export function setServices(svc: any) {
  services = svc;
}

dashboardRouter.get('/dashboard/summary', (req, res) => {
  try {
    if (!services.costCalculator || !services.allocationEngine || !services.budgetController) {
      return res.status(503).json({ error: 'Services not initialized' });
    }

    const hourlyCost = services.costCalculator.getTotalCost(60);
    const dailyCost = hourlyCost * 24;
    const monthlyCost = dailyCost * 30;

    const costsByService = services.costCalculator.getCostsByService();
    const costsByTeam = services.allocationEngine.getCostsByTeam();
    const budgets = services.budgetController.getBudgets();

    const summary = {
      timestamp: new Date().toISOString(),
      totalCost: {
        hourly: parseFloat(hourlyCost.toFixed(2)),
        daily: parseFloat(dailyCost.toFixed(2)),
        monthly: parseFloat(monthlyCost.toFixed(2))
      },
      costsByService: Object.fromEntries(costsByService),
      costsByTeam: Object.fromEntries(costsByTeam),
      budgetStatus: budgets.map((b: Budget) => ({
        id: b.id,
        name: b.name,
        limit: b.monthlyLimit,
        spent: b.currentSpend,
        forecasted: b.forecastedSpend,
        status: b.status
      }))
    };

    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get dashboard summary', message: error.message });
  }
});

dashboardRouter.get('/costs/current', (req, res) => {
  try {
    if (!services.costCalculator) {
      return res.status(503).json({ error: 'Cost calculator not initialized' });
    }

    const costs = services.costCalculator.getRecentCosts(60);
    res.json({
      timestamp: new Date().toISOString(),
      costs: costs.map((c: CostData) => ({
        id: c.id,
        timestamp: c.timestamp,
        serviceId: c.serviceId,
        resourceType: c.resourceType,
        cost: c.cost,
        breakdown: c.breakdown
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get current costs', message: error.message });
  }
});

dashboardRouter.get('/optimizations', (req, res) => {
  try {
    if (!services.optimizationEngine) {
      return res.status(503).json({ error: 'Optimization engine not initialized' });
    }

    const recommendations = services.optimizationEngine.getRecommendations();
    const totalSavings = services.optimizationEngine.getTotalSavingsOpportunity();

    res.json({
      recommendations: recommendations.map((r: OptimizationRecommendation) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        savings: r.savingsAmount,
        savingsPercentage: r.savingsPercentage,
        confidence: r.confidence,
        implementationEffort: r.implementationEffort,
        status: r.status
      })),
      totalSavings: parseFloat(totalSavings.toFixed(2))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get optimizations', message: error.message });
  }
});

dashboardRouter.get('/anomalies', (req, res) => {
  try {
    if (!services.anomalyDetector) {
      return res.status(503).json({ error: 'Anomaly detector not initialized' });
    }

    const anomalies = services.anomalyDetector.getRecentAnomalies(24);
    res.json({
      anomalies: anomalies.map((a: CostAnomaly) => ({
        id: a.id,
        timestamp: a.timestamp,
        service: a.serviceId,
        severity: a.severity,
        deviation: a.deviation,
        description: a.description,
        possibleCauses: a.possibleCauses
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get anomalies', message: error.message });
  }
});

dashboardRouter.get('/budgets', (req, res) => {
  try {
    if (!services.budgetController) {
      return res.status(503).json({ error: 'Budget controller not initialized' });
    }

    const budgets = services.budgetController.getBudgets();
    res.json({
      budgets: budgets.map((b: Budget) => ({
        id: b.id,
        name: b.name,
        limit: b.monthlyLimit,
        spent: b.currentSpend,
        forecasted: b.forecastedSpend,
        status: b.status
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get budgets', message: error.message });
  }
});
