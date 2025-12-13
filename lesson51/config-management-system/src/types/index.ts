export interface Config {
  id: string
  version: string
  environment: 'prod' | 'staging' | 'dev'
  service: string
  content: Record<string, any>
  timestamp: Date
  author: string
}

export interface Server {
  id: string
  hostname: string
  environment: string
  status: 'healthy' | 'unhealthy' | 'deploying'
  currentConfigVersion: string
  desiredConfigVersion: string
  lastSync: Date
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  rule: string
  message: string
  severity: 'error' | 'warning' | 'info'
  field?: string
}

export interface ValidationWarning {
  rule: string
  message: string
}

export interface CanaryStage {
  percentage: number
  duration: number
  healthCheckInterval: number
}

export interface HealthMetrics {
  errorRate: number
  latencyP95: number
  cpuUsage: number
  memoryUsage: number
  isHealthy: boolean
}

export interface DriftResult {
  serverId: string
  detected: boolean
  differences: DriftDifference[]
  autoRemediate: boolean
  timestamp: Date
}

export interface DriftDifference {
  path: string
  desired: any
  actual: any
  severity: 'critical' | 'major' | 'minor'
}

export interface DeploymentStatus {
  id: string
  configVersion: string
  stage: number
  totalStages: number
  affectedServers: number
  healthyServers: number
  unhealthyServers: number
  status: 'pending' | 'in-progress' | 'completed' | 'rolled-back'
  startTime: Date
  endTime?: Date
}
