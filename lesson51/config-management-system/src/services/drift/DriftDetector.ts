import { diff } from 'deep-diff'
import { Server, Config, DriftResult, DriftDifference } from '../../types'

export class DriftDetector {
  private detectionInterval = 300000 // 5 minutes
  private isRunning = false

  async detectDrift(
    server: Server,
    desiredConfig: Config,
    actualConfig: Config
  ): Promise<DriftResult> {
    const differences = diff(desiredConfig.content, actualConfig.content) || []

    const driftDifferences: DriftDifference[] = differences.map((d: any) => ({
      path: d.path?.join('.') || 'root',
      desired: d.lhs,
      actual: d.rhs,
      severity: this.calculateSeverity(d.path?.[0] || '')
    }))

    const hasCriticalDrift = driftDifferences.some(d => d.severity === 'critical')

    return {
      serverId: server.id,
      detected: driftDifferences.length > 0,
      differences: driftDifferences,
      autoRemediate: !hasCriticalDrift, // Only auto-remediate non-critical drift
      timestamp: new Date()
    }
  }

  async startContinuousDetection(
    servers: Server[],
    getDesiredConfig: (server: Server) => Promise<Config>,
    getActualConfig: (server: Server) => Promise<Config>,
    onDriftDetected: (drift: DriftResult) => void
  ): Promise<void> {
    this.isRunning = true

    const runDetection = async () => {
      if (!this.isRunning) return

      console.log(`Running drift detection on ${servers.length} servers...`)

      for (const server of servers) {
        // Capture server ID and reference at the start of iteration
        const serverId = server.id
        const serverRef = server
        
        try {
          // Skip drift detection for servers that are currently deploying
          if (serverRef.status === 'deploying') {
            continue
          }

          const desired = await getDesiredConfig(serverRef)
          const actual = await getActualConfig(serverRef)

          const drift = await this.detectDrift(serverRef, desired, actual)

          if (drift.detected) {
            // Verify drift result matches the server we're processing
            if (drift.serverId !== serverId) {
              console.warn(`Drift serverId mismatch: detected for ${drift.serverId}, but processing ${serverId}`)
              continue
            }
            
            console.log(`Drift detected on server ${serverId}: ${drift.differences.length} differences`)
            onDriftDetected(drift)

            // Only auto-remediate if server is not currently deploying
            // Verify server ID matches before remediating to prevent race conditions
            if (drift.autoRemediate && serverRef.status !== 'deploying' && serverRef.id === serverId && drift.serverId === serverId) {
              await this.remediate(serverRef, desired, serverId)
            }
          }
        } catch (error) {
          console.error(`Error detecting drift for server ${serverId}:`, error)
        }
      }

      setTimeout(runDetection, this.detectionInterval)
    }

    runDetection()
  }

  stop(): void {
    this.isRunning = false
  }

  private calculateSeverity(field: string): 'critical' | 'major' | 'minor' {
    const criticalFields = ['database_url', 'api_key', 'auth_secret', 'tls_cert']
    const majorFields = ['max_connections', 'memory_limit', 'worker_processes']

    if (criticalFields.some(f => field.includes(f))) {
      return 'critical'
    }
    if (majorFields.some(f => field.includes(f))) {
      return 'major'
    }
    return 'minor'
  }

  private async remediate(server: Server, desiredConfig: Config, expectedServerId: string): Promise<void> {
    // Double-check server ID matches to prevent race conditions
    if (server.id !== expectedServerId) {
      console.warn(`Server ID mismatch during remediation: expected ${expectedServerId}, got ${server.id}`)
      return
    }
    
    console.log(`Auto-remediating drift on server ${expectedServerId}`)
    
    // Simulate configuration remediation
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Verify server ID still matches before applying changes
    if (server.id === expectedServerId) {
      server.currentConfigVersion = desiredConfig.version
      server.lastSync = new Date()
      console.log(`Remediation completed for server ${expectedServerId}`)
    } else {
      console.warn(`Server ID changed during remediation: expected ${expectedServerId}, got ${server.id}. Remediation aborted.`)
    }
  }
}
