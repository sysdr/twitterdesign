export interface ValidationResult {
  checkId: string;
  passed: boolean;
  score: number;
  findings: string[];
  recommendations: string[];
  executionTime: number;
  timestamp: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  weight: number;
  status: 'pass' | 'warning' | 'fail';
  checksCompleted: number;
  checksPassed: number;
}

export interface AssessmentResult {
  id: string;
  overallScore: number;
  status: 'ready' | 'needs-attention' | 'not-ready';
  categoryScores: CategoryScore[];
  checks: ValidationResult[];
  startTime: string;
  endTime: string;
  duration: number;
}
