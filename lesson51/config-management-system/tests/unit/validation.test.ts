import { describe, it, expect } from 'vitest'
import { ConfigValidator } from '../../src/services/validation/ConfigValidator'
import { Config } from '../../src/types'

describe('ConfigValidator', () => {
  const validator = new ConfigValidator()

  it('should validate correct configuration', async () => {
    const config: Config = {
      id: 'test-1',
      version: 'v1.0.0',
      environment: 'prod',
      service: 'nginx',
      content: {
        worker_processes: 8,
        max_connections: 1000,
        memory_limit: '2GB',
        tls_verify: true
      },
      timestamp: new Date(),
      author: 'test'
    }

    const result = await validator.validate(config)
    expect(result.valid).toBe(true)
    expect(result.errors.length).toBe(0)
  })

  it('should reject insecure TLS configuration', async () => {
    const config: Config = {
      id: 'test-2',
      version: 'v1.0.0',
      environment: 'prod',
      service: 'nginx',
      content: {
        worker_processes: 8,
        tls_verify: false
      },
      timestamp: new Date(),
      author: 'test'
    }

    const result = await validator.validate(config)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.rule === 'security')).toBe(true)
  })

  it('should reject excessive memory limits', async () => {
    const config: Config = {
      id: 'test-3',
      version: 'v1.0.0',
      environment: 'prod',
      service: 'nginx',
      content: {
        worker_processes: 8,
        memory_limit: '20GB' // Exceeds host capacity
      },
      timestamp: new Date(),
      author: 'test'
    }

    const result = await validator.validate(config)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.rule === 'resources')).toBe(true)
  })
})
