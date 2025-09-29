import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Alert, Metric, SystemState } from '../../types/monitoring';

export class AlertEngine extends EventEmitter {
  private activeAlerts: Map<string, Alert> = new Map();
  private alertRules: AlertRule[] = [];

  constructor() {
    super();
    this.initializeAlertRules();
  }

  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'high-latency',
        condition: (metrics: Metric[]) => {
          const latencyMetrics = metrics.filter(m => m.type === 'api_latency');
          const avgLatency = latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length;
          return avgLatency > 200;
        },
        severity: 'warning',
        title: 'High API Latency Detected',
        description: (regionId: string) => `Region ${regionId} showing elevated API response times`
      },
      {
        id: 'critical-latency',
        condition: (metrics: Metric[]) => {
          const latencyMetrics = metrics.filter(m => m.type === 'api_latency');
          const avgLatency = latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length;
          return avgLatency > 300;
        },
        severity: 'critical',
        title: 'Critical API Latency',
        description: (regionId: string) => `Region ${regionId} experiencing critical performance degradation`
      },
      {
        id: 'high-error-rate',
        condition: (metrics: Metric[]) => {
          const errorMetrics = metrics.filter(m => m.type === 'error_rate');
          const avgErrorRate = errorMetrics.reduce((sum, m) => sum + m.value, 0) / errorMetrics.length;
          return avgErrorRate > 3;
        },
        severity: 'critical',
        title: 'Elevated Error Rate',
        description: (regionId: string) => `Region ${regionId} showing increased error rates`
      }
    ];
  }

  evaluateSystemState(systemState: SystemState): void {
    const newAlerts: Alert[] = [];

    // Evaluate per-region alerts
    systemState.regions.forEach(region => {
      const regionMetrics = systemState.metrics.filter(m => m.regionId === region.id).slice(-5);
      
      this.alertRules.forEach(rule => {
        if (rule.condition(regionMetrics)) {
          const existingAlert = Array.from(this.activeAlerts.values())
            .find(alert => alert.regionId === region.id && alert.title === rule.title);
          
          if (!existingAlert) {
            const alert: Alert = {
              id: uuidv4(),
              timestamp: Date.now(),
              severity: rule.severity,
              title: rule.title,
              description: rule.description(region.name),
              regionId: region.id,
              correlatedAlerts: [],
              resolved: false
            };
            
            this.activeAlerts.set(alert.id, alert);
            newAlerts.push(alert);
          }
        }
      });
    });

    // Perform alert correlation
    this.correlateAlerts();

    // Emit new alerts
    if (newAlerts.length > 0) {
      this.emit('newAlerts', newAlerts);
    }

    // Auto-resolve alerts for healthy regions
    this.autoResolveAlerts(systemState);
  }

  private correlateAlerts(): void {
    const alerts = Array.from(this.activeAlerts.values()).filter(a => !a.resolved);
    
    // Group alerts by type and time proximity
    const alertGroups = new Map<string, Alert[]>();
    
    alerts.forEach(alert => {
      const key = `${alert.title}-${Math.floor(alert.timestamp / 60000)}`; // Group by minute
      if (!alertGroups.has(key)) {
        alertGroups.set(key, []);
      }
      alertGroups.get(key)!.push(alert);
    });

    // Correlate alerts in the same group
    alertGroups.forEach(group => {
      if (group.length > 1) {
        group.forEach(alert => {
          alert.correlatedAlerts = group.filter(a => a.id !== alert.id).map(a => a.id);
        });
      }
    });
  }

  private autoResolveAlerts(systemState: SystemState): void {
    const resolvedAlerts: Alert[] = [];
    
    this.activeAlerts.forEach((alert, alertId) => {
      if (alert.resolved) return;
      
      const region = systemState.regions.find(r => r.id === alert.regionId);
      if (region && region.status === 'healthy') {
        alert.resolved = true;
        resolvedAlerts.push(alert);
      }
    });

    if (resolvedAlerts.length > 0) {
      this.emit('alertsResolved', resolvedAlerts);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(a => !a.resolved);
  }

  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledgedBy = userId;
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }
}

interface AlertRule {
  id: string;
  condition: (metrics: Metric[]) => boolean;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: (regionId: string) => string;
}
