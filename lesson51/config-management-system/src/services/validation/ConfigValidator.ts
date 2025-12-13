import { Config, ValidationResult, ValidationError } from '../../types'

export class ConfigValidator {
  private rules: ValidationRule[]

  constructor() {
    this.rules = [
      new SyntaxValidator(),
      new ResourceValidator(),
      new SecurityValidator(),
      new ImpactValidator()
    ]
  }

  async validate(config: Config): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    for (const rule of this.rules) {
      const result = await rule.validate(config)
      
      result.errors.forEach(error => {
        if (error.severity === 'error') {
          errors.push(error)
        } else {
          warnings.push(error)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

interface ValidationRule {
  name: string
  validate(config: Config): Promise<{ errors: ValidationError[] }>
}

class SyntaxValidator implements ValidationRule {
  name = 'syntax'

  async validate(config: Config): Promise<{ errors: ValidationError[] }> {
    const errors: ValidationError[] = []

    if (!config.content || typeof config.content !== 'object') {
      errors.push({
        rule: this.name,
        message: 'Configuration content must be an object',
        severity: 'error'
      })
    }

    // Check required fields based on service type
    if (config.service === 'nginx') {
      if (!config.content.worker_processes) {
        errors.push({
          rule: this.name,
          message: 'nginx config missing worker_processes',
          severity: 'error',
          field: 'worker_processes'
        })
      }
    }

    return { errors }
  }
}

class ResourceValidator implements ValidationRule {
  name = 'resources'

  async validate(config: Config): Promise<{ errors: ValidationError[] }> {
    const errors: ValidationError[] = []

    // Validate memory limits
    if (config.content.memory_limit) {
      const limit = this.parseMemory(config.content.memory_limit)
      const hostMemory = 16 * 1024 * 1024 * 1024 // 16GB

      if (limit > hostMemory * 0.9) {
        errors.push({
          rule: this.name,
          message: `Memory limit ${config.content.memory_limit} exceeds 90% of host memory`,
          severity: 'error',
          field: 'memory_limit'
        })
      }
    }

    // Validate connection pools
    if (config.content.max_connections && config.content.max_connections > 10000) {
      errors.push({
        rule: this.name,
        message: 'Connection pool size exceeds recommended maximum of 10000',
        severity: 'warning',
        field: 'max_connections'
      })
    }

    return { errors }
  }

  private parseMemory(value: string): number {
    const match = value.match(/^(\d+)(GB|MB|KB)?$/i)
    if (!match) return 0

    const num = parseInt(match[1])
    const unit = match[2]?.toUpperCase()

    switch (unit) {
      case 'GB': return num * 1024 * 1024 * 1024
      case 'MB': return num * 1024 * 1024
      case 'KB': return num * 1024
      default: return num
    }
  }
}

class SecurityValidator implements ValidationRule {
  name = 'security'

  async validate(config: Config): Promise<{ errors: ValidationError[] }> {
    const errors: ValidationError[] = []

    // Check for insecure configurations
    if (config.content.tls_verify === false) {
      errors.push({
        rule: this.name,
        message: 'TLS verification disabled - security risk',
        severity: 'error',
        field: 'tls_verify'
      })
    }

    if (config.content.password === '') {
      errors.push({
        rule: this.name,
        message: 'Empty password detected',
        severity: 'error',
        field: 'password'
      })
    }

    if (config.content.allowed_hosts === '*') {
      errors.push({
        rule: this.name,
        message: 'Wildcard allowed_hosts is security risk',
        severity: 'warning',
        field: 'allowed_hosts'
      })
    }

    return { errors }
  }
}

class ImpactValidator implements ValidationRule {
  name = 'impact'

  async validate(config: Config): Promise<{ errors: ValidationError[] }> {
    const errors: ValidationError[] = []

    // Check if change affects production
    if (config.environment === 'prod') {
      errors.push({
        rule: this.name,
        message: 'Change affects production environment - requires senior approval',
        severity: 'warning'
      })
    }

    // Check for high-risk changes
    const highRiskFields = ['database_url', 'api_keys', 'auth_secret']
    const changedFields = Object.keys(config.content)
    
    const hasHighRiskChange = changedFields.some(field => 
      highRiskFields.some(risk => field.includes(risk))
    )

    if (hasHighRiskChange) {
      errors.push({
        rule: this.name,
        message: 'Change modifies high-risk security fields',
        severity: 'warning'
      })
    }

    return { errors }
  }
}
