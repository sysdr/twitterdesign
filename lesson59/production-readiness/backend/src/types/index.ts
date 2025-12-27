export interface ValidationCheck {
  id: string;
  category: string;
  name: string;
  description: string;
  weight: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationResult {
  checkId: string;
  passed: boolean;
  score: number;
  findings: string[];
  recommendations: string[];
  executionTime: number;
  timestamp: Date;
}

export interface AssessmentResult {
  id: string;
  overallScore: number;
  status: 'ready' | 'needs-attention' | 'not-ready';
  categoryScores: CategoryScore[];
  checks: ValidationResult[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface CategoryScore {
  category: string;
  score: number;
  weight: number;
  status: 'pass' | 'warning' | 'fail';
  checksCompleted: number;
  checksPassed: number;
}

export interface DisasterRecoveryTest {
  testId: string;
  scenario: string;
  status: 'running' | 'passed' | 'failed';
  rto: number;
  rpo: number;
  actualRecoveryTime?: number;
  dataLoss?: number;
  details: string[];
}
