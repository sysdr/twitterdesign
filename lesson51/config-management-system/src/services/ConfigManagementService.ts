import { ConfigValidator } from './validation/ConfigValidator'
import { CanaryController } from './canary/CanaryController'
import { DriftDetector } from './drift/DriftDetector'
import { GitOpsReconciler } from './gitops/GitOpsReconciler'
import { Server, Config, DeploymentStatus, DriftResult, ValidationResult } from '../types'

export class ConfigManagementService {
  private validator: ConfigValidator
  private canaryController: CanaryController
  private driftDetector: DriftDetector
  private gitOpsReconciler: GitOpsReconciler
  private servers: Server[] = []
  private deploymentInProgress = false
  private onDeploymentProgressCallback: ((status: DeploymentStatus) => void) | null = null

  constructor() {
    this.validator = new ConfigValidator()
    this.canaryController = new CanaryController()
    this.driftDetector = new DriftDetector()
    this.gitOpsReconciler = new GitOpsReconciler()
  }

  async initialize(
    onDeploymentProgress: (status: DeploymentStatus) => void,
    onDriftDetected: (drift: DriftResult) => void,
    onServersUpdate: (servers: Server[]) => void
  ): Promise<void> {
    // Store callback for triggerDeployment
    this.onDeploymentProgressCallback = onDeploymentProgress
    
    // Initialize server fleet
    this.servers = this.generateServers(100)
    onServersUpdate(this.servers)

    // Start GitOps reconciliation
    this.gitOpsReconciler.startReconciliation(
      this.servers,
      async (config) => {
        console.log('New configuration detected from Git')
        await this.deployConfiguration(config, onDeploymentProgress)
      }
    )

    // Start drift detection
    this.driftDetector.startContinuousDetection(
      this.servers,
      async (server) => this.getDesiredConfig(server),
      async (server) => this.getActualConfig(server),
      onDriftDetected
    )
  }

  async triggerDeployment(): Promise<ValidationResult> {
    // Prevent concurrent deployments
    if (this.deploymentInProgress) {
      console.warn('Deployment already in progress')
      return {
        valid: false,
        errors: [{
          rule: 'deployment',
          message: 'A deployment is already in progress. Please wait for it to complete.',
          severity: 'error'
        }],
        warnings: []
      }
    }

    const config: Config = {
      id: `config-${Date.now()}`,
      version: `v1.0.${Date.now()}`,
      environment: 'prod',
      service: 'nginx',
      content: {
        worker_processes: 8,
        max_connections: 1000,
        memory_limit: '2GB',
        tls_verify: true,
        log_level: 'info'
      },
      timestamp: new Date(),
      author: 'ops-team'
    }

    const validation = await this.validator.validate(config)
    
    if (validation.valid) {
      const callback = this.onDeploymentProgressCallback || (() => {})
      await this.deployConfiguration(config, callback)
    }

    return validation
  }

  simulateDrift(): void {
    const server = this.servers[Math.floor(Math.random() * this.servers.length)]
    console.log(`Simulating drift on server ${server.id}`)
    
    // Simulate manual configuration change
    server.currentConfigVersion = 'manual-change'
  }

  getServers(): Server[] {
    return this.servers
  }

  stop(): void {
    this.gitOpsReconciler.stop()
    this.driftDetector.stop()
  }

  private async deployConfiguration(
    config: Config,
    onProgress: (status: DeploymentStatus) => void
  ): Promise<void> {
    if (this.deploymentInProgress) {
      console.warn('Deployment already in progress, skipping')
      return
    }

    this.deploymentInProgress = true
    try {
      await this.canaryController.deploy(config, this.servers, onProgress)
      console.log('Configuration deployed successfully')
    } catch (error) {
      console.error('Deployment failed:', error)
      throw error
    } finally {
      this.deploymentInProgress = false
    }
  }

  private generateServers(count: number): Server[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `server-${i.toString().padStart(4, '0')}`,
      hostname: `app-${i}.prod.example.com`,
      environment: 'prod',
      status: 'healthy',
      currentConfigVersion: 'v1.0.0',
      desiredConfigVersion: 'v1.0.0',
      lastSync: new Date()
    }))
  }

  private async getDesiredConfig(_server: Server): Promise<Config> {
    return {
      id: 'desired',
      version: this.gitOpsReconciler.getCurrentVersion(),
      environment: 'prod',
      service: 'nginx',
      content: {
        worker_processes: 8,
        max_connections: 1000,
        memory_limit: '2GB'
      },
      timestamp: new Date(),
      author: 'system'
    }
  }

  private async getActualConfig(server: Server): Promise<Config> {
    // Occasionally return different config to simulate drift
    const hasDrift = Math.random() < 0.05

    return {
      id: 'actual',
      version: server.currentConfigVersion,
      environment: 'prod',
      service: 'nginx',
      content: hasDrift
        ? {
            worker_processes: 4, // Different from desired
            max_connections: 1000,
            memory_limit: '2GB'
          }
        : {
            worker_processes: 8,
            max_connections: 1000,
            memory_limit: '2GB'
          },
      timestamp: new Date(),
      author: hasDrift ? 'manual' : 'system'
    }
  }
}
