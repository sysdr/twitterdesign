import { describe, it, expect } from 'vitest'
import { CanaryController } from '../../src/services/canary/CanaryController'
import { Config, Server } from '../../src/types'

describe('CanaryController', () => {
  const controller = new CanaryController()

  it('should deploy configuration through canary stages', async () => {
    const servers: Server[] = Array.from({ length: 100 }, (_, i) => ({
      id: `server-${i}`,
      hostname: `app-${i}.com`,
      environment: 'prod',
      status: 'healthy',
      currentConfigVersion: 'v1.0.0',
      desiredConfigVersion: 'v1.0.0',
      lastSync: new Date()
    }))

    const config: Config = {
      id: 'test',
      version: 'v1.1.0',
      environment: 'prod',
      service: 'nginx',
      content: { worker_processes: 8 },
      timestamp: new Date(),
      author: 'test'
    }

    const statuses: any[] = []

    await controller.deploy(config, servers, (status) => {
      statuses.push(status)
    })

    expect(statuses.length).toBeGreaterThan(0)
    expect(statuses[statuses.length - 1].status).toBe('completed')
  }, 180000)
})
