import { Server, CanaryStage, HealthMetrics, DeploymentStatus, Config } from '../../types'

export class CanaryController {
  private stages: CanaryStage[] = [
    { percentage: 1, duration: 30000, healthCheckInterval: 5000 },   // 1% for 30s
    { percentage: 10, duration: 60000, healthCheckInterval: 10000 }, // 10% for 60s
    { percentage: 50, duration: 60000, healthCheckInterval: 10000 }, // 50% for 60s
    { percentage: 100, duration: 0, healthCheckInterval: 0 }         // Full rollout
  ]
  private isDeploying = false
  private currentDeploymentId: string | null = null

  async deploy(
    config: Config,
    servers: Server[],
    onProgress: (status: DeploymentStatus) => void
  ): Promise<void> {
    // Prevent concurrent deployments
    if (this.isDeploying) {
      console.warn('Deployment already in progress, skipping new deployment request')
      throw new Error('A deployment is already in progress. Please wait for it to complete.')
    }

    this.isDeploying = true
    const deploymentId = `deploy-${Date.now()}`
    this.currentDeploymentId = deploymentId

    try {
      let currentStageIndex = 0

      console.log(`Starting canary deployment ${deploymentId}`)

      for (const stage of this.stages) {
        const targetCount = Math.ceil(servers.length * (stage.percentage / 100))
        const targetServers = servers.slice(0, targetCount)

        console.log(`Stage ${currentStageIndex + 1}: Deploying to ${stage.percentage}% (${targetCount} servers)`)

        onProgress({
          id: deploymentId,
          configVersion: config.version,
          stage: currentStageIndex + 1,
          totalStages: this.stages.length,
          affectedServers: targetCount,
          healthyServers: 0,
          unhealthyServers: 0,
          status: 'in-progress',
          startTime: new Date()
        })

        // Apply configuration to target servers
        await this.applyConfig(targetServers, config)

        // Monitor health during stage duration
        if (stage.duration > 0) {
          const isHealthy = await this.monitorHealth(
            targetServers,
            stage.duration,
            stage.healthCheckInterval,
            onProgress,
            deploymentId,
            currentStageIndex
          )

          if (!isHealthy) {
            console.log('Health check failed - rolling back')
            await this.rollback(targetServers)
            
            onProgress({
              id: deploymentId,
              configVersion: config.version,
              stage: currentStageIndex + 1,
              totalStages: this.stages.length,
              affectedServers: targetCount,
              healthyServers: 0,
              unhealthyServers: targetCount,
              status: 'rolled-back',
              startTime: new Date(),
              endTime: new Date()
            })

            throw new Error('Canary deployment failed - automatic rollback completed')
          }
        }

        currentStageIndex++
      }

      onProgress({
        id: deploymentId,
        configVersion: config.version,
        stage: this.stages.length,
        totalStages: this.stages.length,
        affectedServers: servers.length,
        healthyServers: servers.length,
        unhealthyServers: 0,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date()
      })

      console.log('Canary deployment completed successfully')
    } catch (error) {
      // Log error but don't swallow it - let it propagate
      console.error('Deployment error:', error)
      throw error
    } finally {
      // Always reset deployment flag
      if (this.currentDeploymentId === deploymentId) {
        this.isDeploying = false
        this.currentDeploymentId = null
      }
    }
  }

  private async applyConfig(servers: Server[], config: Config): Promise<void> {
    for (const server of servers) {
      server.status = 'deploying'
      server.desiredConfigVersion = config.version
      
      // Simulate configuration application
      await new Promise(resolve => setTimeout(resolve, 100))
      
      server.currentConfigVersion = config.version
      server.status = 'healthy'
      server.lastSync = new Date()
    }
  }

  private async monitorHealth(
    servers: Server[],
    duration: number,
    interval: number,
    onProgress: (status: DeploymentStatus) => void,
    deploymentId: string,
    stage: number
  ): Promise<boolean> {
    const startTime = Date.now()
    let checksPerformed = 0

    while (Date.now() - startTime < duration) {
      await new Promise(resolve => setTimeout(resolve, interval))
      
      const metrics = await this.checkHealth(servers)
      checksPerformed++

      // Only log health checks at intervals to reduce console noise
      if (checksPerformed % 2 === 0 || !metrics.isHealthy) {
        const status = metrics.isHealthy ? '✓' : '✗'
        console.log(`Health check ${checksPerformed} ${status}: Error rate ${metrics.errorRate.toFixed(2)}%, Latency ${metrics.latencyP95.toFixed(0)}ms`)
      }

      const healthyCount = servers.filter(s => s.status === 'healthy').length
      
      onProgress({
        id: deploymentId,
        configVersion: servers[0]?.desiredConfigVersion || '',
        stage: stage + 1,
        totalStages: this.stages.length,
        affectedServers: servers.length,
        healthyServers: healthyCount,
        unhealthyServers: servers.length - healthyCount,
        status: 'in-progress',
        startTime: new Date(startTime)
      })

      if (!metrics.isHealthy) {
        return false
      }
    }

    return true
  }

  private async checkHealth(_servers: Server[]): Promise<HealthMetrics> {
    // Simulate health metrics collection
    const baseErrorRate = Math.random() * 0.3
    const baseLatency = 50 + Math.random() * 30
    const baseCpu = 40 + Math.random() * 20
    const baseMemory = 50 + Math.random() * 20

    // Occasionally simulate unhealthy state for demo
    const shouldSimulateFailure = Math.random() < 0.1

    const metrics: HealthMetrics = {
      errorRate: shouldSimulateFailure ? 5.0 : baseErrorRate,
      latencyP95: shouldSimulateFailure ? 500 : baseLatency,
      cpuUsage: baseCpu,
      memoryUsage: baseMemory,
      isHealthy: !shouldSimulateFailure && baseErrorRate < 2.0 && baseLatency < 100
    }

    return metrics
  }

  private async rollback(servers: Server[]): Promise<void> {
    console.log('Executing rollback...')
    
    for (const server of servers) {
      // Restore previous configuration
      server.currentConfigVersion = 'previous-version'
      server.status = 'healthy'
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    console.log('Rollback completed')
  }
}
