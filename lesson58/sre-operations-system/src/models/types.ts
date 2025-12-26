export interface Engineer {
  id: string;
  name: string;
  email: string;
  timezone: string;
  expertiseAreas: string[];
  recentIncidents: number;
  hoursSinceRotation: number;
  satisfactionScore: number;
}

export interface OnCallSchedule {
  id: string;
  engineerId: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  previousIncidentCount: number;
  restHoursSinceLastRotation: number;
  status: 'scheduled' | 'active' | 'completed';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  component: string;
  affectedUsers: number;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  escalationLevel: number;
  automatedActions: string[];
  runbookExecuted?: string;
}

export interface Runbook {
  id: string;
  name: string;
  description: string;
  triggerPattern: string;
  steps: RunbookStep[];
  successCriteria: string[];
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
}

export interface RunbookStep {
  id: string;
  action: string;
  command?: string;
  expectedResult: string;
  timeout: number;
}

export interface TeamHealthMetrics {
  averageIncidentsPerWeek: number;
  meanTimeToAcknowledge: number;
  meanTimeToResolve: number;
  weekendIncidentRatio: number;
  consecutiveHighLoadWeeks: number;
  engineerSatisfactionScore: number;
  burnoutRiskLevel: 'low' | 'medium' | 'high';
}

export interface EscalationPolicy {
  level: number;
  waitTime: number;
  notifyEngineers: string[];
  notifyManagers: string[];
  autoRunbook: boolean;
}

export interface IncidentClassification {
  severity: 1 | 2 | 3 | 4 | 5;
  component: string;
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  similarIncidents: string[];
  confidence: number;
}
