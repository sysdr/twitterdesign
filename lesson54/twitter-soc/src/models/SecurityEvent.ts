export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: 'AUTH' | 'API' | 'DATA_ACCESS' | 'WEBSOCKET' | 'SYSTEM';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  metadata: Record<string, any>;
  threatScore?: number;
  responseAction?: string;
}

export interface ThreatScore {
  score: number;
  confidence: number;
  threatType: string;
  recommendedAction: 'BLOCK' | 'RATE_LIMIT' | 'MONITOR' | 'ALLOW';
  reasoning: string[];
}

export interface ComplianceMetric {
  period: string;
  totalEvents: number;
  threatsDetected: number;
  incidentsResolved: number;
  averageResponseTime: number;
  dataAccessAudits: number;
  complianceScore: number;
}

export interface IncidentResponse {
  incidentId: string;
  timestamp: Date;
  threatScore: ThreatScore;
  event: SecurityEvent;
  action: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  executionTime: number;
}
