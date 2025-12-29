export interface ComponentDoc {
  name: string;
  purpose: string;
  scalability: string;
  dependencies: string[];
  monitoring: string;
  runbook: string;
  sourceFile: string;
}

export interface Runbook {
  id: string;
  title: string;
  symptom: string;
  impact: string;
  diagnosis: Step[];
  remediation: Step[];
  verification: Step[];
  escalation: Contact[];
  lastTested: Date;
  passRate: number;
}

export interface Step {
  order: number;
  command: string;
  expectedOutput: string;
  timeout: number;
  automated: boolean;
}

export interface Contact {
  role: string;
  name: string;
  slack: string;
  phone: string;
}

export interface HandoffChecklist {
  role: string;
  prerequisites: Skill[];
  tasks: Task[];
  completionRate: number;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  validated: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  successCriteria: string;
  estimatedTime: number;
  completed: boolean;
  validatedBy: string;
}

export interface DocumentationMetrics {
  coverage: number;
  freshness: number;
  accuracy: number;
  usage: number;
  timeToResolution: number;
  totalComponents: number;
  documentedComponents: number;
  staleDocuments: number;
}

export interface ArchitectureNode {
  id: string;
  type: 'service' | 'database' | 'cache' | 'queue';
  name: string;
  dependencies: string[];
  health: 'healthy' | 'degraded' | 'down';
  metrics: {
    uptime: number;
    latency: number;
    errorRate: number;
  };
}
