import { v4 as uuidv4 } from 'uuid';
import { Budget } from '../../models/CostModels';
import { AllocationEngine } from '../allocation/AllocationEngine';
import { logger } from '../../utils/logger';

export class BudgetController {
  private interval: NodeJS.Timeout | null = null;
  private allocationEngine: AllocationEngine | null = null;
  private budgets: Map<string, Budget> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeBudgets();
  }

  private initializeBudgets(): void {
    const monthlyBudget = parseInt(process.env.DEFAULT_MONTHLY_BUDGET || '100000');
    
    // Company-wide budget
    this.budgets.set('company', {
      id: 'company',
      name: 'Company Total',
      monthlyLimit: monthlyBudget,
      currentSpend: 0,
      forecastedSpend: 0,
      threshold: 0.8,
      status: 'healthy',
      alerts: {
        enabled: true,
        thresholds: [0.5, 0.8, 0.9, 1.0]
      }
    });

    // Team budgets
    const teams = ['platform-team', 'content-team', 'media-team'];
    teams.forEach(team => {
      this.budgets.set(team, {
        id: team,
        name: team.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        monthlyLimit: monthlyBudget / teams.length,
        currentSpend: 0,
        forecastedSpend: 0,
        threshold: 0.8,
        status: 'healthy',
        alerts: {
          enabled: true,
          thresholds: [0.8, 0.9, 1.0]
        }
      });
    });
  }

  start(allocationEngine: AllocationEngine): void {
    if (this.isRunning) return;

    this.allocationEngine = allocationEngine;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.COST_CALCULATION_INTERVAL || '10000');
    
    this.interval = setInterval(() => {
      this.updateBudgets();
    }, intervalMs);

    logger.info('BudgetController started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('BudgetController stopped');
  }

  private updateBudgets(): void {
    if (!this.allocationEngine) return;

    const costsByTeam = this.allocationEngine.getCostsByTeam();
    
    // Update team budgets
    costsByTeam.forEach((cost, teamId) => {
      const budget = this.budgets.get(teamId);
      if (budget) {
        // Convert hourly cost to monthly projection
        const monthlyCost = cost * 24 * 30;
        budget.currentSpend += cost;
        budget.forecastedSpend = monthlyCost;
        budget.status = this.calculateBudgetStatus(budget);
        
        if (budget.status !== 'healthy') {
          logger.warn(`Budget alert: ${budget.name} is ${budget.status}`);
        }
      }
    });

    // Update company budget
    const companyBudget = this.budgets.get('company');
    if (companyBudget) {
      const totalCost = Array.from(costsByTeam.values()).reduce((sum, cost) => sum + cost, 0);
      companyBudget.currentSpend += totalCost;
      companyBudget.forecastedSpend = totalCost * 24 * 30;
      companyBudget.status = this.calculateBudgetStatus(companyBudget);
    }
  }

  private calculateBudgetStatus(budget: Budget): Budget['status'] {
    const utilization = budget.forecastedSpend / budget.monthlyLimit;
    
    const warningThreshold = parseFloat(process.env.BUDGET_WARNING_THRESHOLD || '0.8');
    const criticalThreshold = parseFloat(process.env.BUDGET_CRITICAL_THRESHOLD || '0.9');
    const exceededThreshold = parseFloat(process.env.BUDGET_EXCEEDED_THRESHOLD || '1.0');
    
    if (utilization >= exceededThreshold) return 'exceeded';
    if (utilization >= criticalThreshold) return 'critical';
    if (utilization >= warningThreshold) return 'warning';
    return 'healthy';
  }

  getBudgets(): Budget[] {
    return Array.from(this.budgets.values());
  }

  getBudget(id: string): Budget | undefined {
    return this.budgets.get(id);
  }

  isHealthy(): boolean {
    return this.isRunning && this.budgets.size > 0;
  }
}
