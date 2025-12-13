import React, { useState, useEffect } from 'react'
import { ConfigManagementService } from '../services/ConfigManagementService'
import { DeploymentStatus, Server, DriftResult, ValidationResult } from '../types'
import './Dashboard.css'

export const Dashboard: React.FC = () => {
  const [service] = useState(() => new ConfigManagementService())
  const [servers, setServers] = useState<Server[]>([])
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null)
  const [drifts, setDrifts] = useState<DriftResult[]>([])
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null)

  useEffect(() => {
    service.initialize(
      (status) => setDeployment(status),
      (drift) => setDrifts(prev => [drift, ...prev].slice(0, 10)),
      (servers) => setServers(servers)
    )

    const interval = setInterval(() => {
      setServers([...service.getServers()])
    }, 1000)

    return () => {
      clearInterval(interval)
      service.stop()
    }
  }, [service])

  const handleTriggerDeployment = async () => {
    const result = await service.triggerDeployment()
    setLastValidation(result)
  }

  const handleSimulateDrift = () => {
    service.simulateDrift()
  }

  const healthyServers = servers.filter(s => s.status === 'healthy').length
  const deployingServers = servers.filter(s => s.status === 'deploying').length
  const driftCount = drifts.filter(d => d.detected).length

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Configuration Management System</h1>
        <p className="subtitle">Managing {servers.length} servers with GitOps</p>
      </header>

      <div className="metrics-grid">
        <MetricCard
          title="Healthy Servers"
          value={healthyServers}
          total={servers.length}
          color="#4ade80"
        />
        <MetricCard
          title="Deploying"
          value={deployingServers}
          total={servers.length}
          color="#fbbf24"
        />
        <MetricCard
          title="Drift Detected"
          value={driftCount}
          total={drifts.length}
          color="#f87171"
        />
        <MetricCard
          title="Config Version"
          value={deployment?.configVersion || 'v1.0.0'}
          total={null}
          color="#60a5fa"
        />
      </div>

      <div className="controls">
        <button onClick={handleTriggerDeployment} className="btn btn-primary">
          🚀 Trigger Deployment
        </button>
        <button onClick={handleSimulateDrift} className="btn btn-secondary">
          ⚠️ Simulate Drift
        </button>
      </div>

      {lastValidation && (
        <div className={`validation-result ${lastValidation.valid ? 'success' : 'error'}`}>
          <h3>{lastValidation.valid ? '✅ Validation Passed' : '❌ Validation Failed'}</h3>
          {lastValidation.errors.map((error, i) => (
            <div key={i} className="validation-error">
              <strong>{error.rule}:</strong> {error.message}
            </div>
          ))}
          {lastValidation.warnings.map((warning, i) => (
            <div key={i} className="validation-warning">
              <strong>{warning.rule}:</strong> {warning.message}
            </div>
          ))}
        </div>
      )}

      {deployment && deployment.status !== 'completed' && (
        <DeploymentProgress deployment={deployment} />
      )}

      <div className="sections">
        <section className="drift-section">
          <h2>Drift Detection</h2>
          <div className="drift-list">
            {drifts.slice(0, 5).map((drift, i) => (
              <DriftCard key={i} drift={drift} />
            ))}
            {drifts.length === 0 && (
              <p className="empty-state">No drift detected</p>
            )}
          </div>
        </section>

        <section className="servers-section">
          <h2>Server Status</h2>
          <div className="server-grid">
            {servers.slice(0, 50).map(server => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const MetricCard: React.FC<{
  title: string
  value: number | string
  total: number | null
  color: string
}> = ({ title, value, total, color }) => (
  <div className="metric-card" style={{ borderColor: color }}>
    <h3>{title}</h3>
    <div className="metric-value" style={{ color }}>
      {value}
      {total !== null && <span className="metric-total">/{total}</span>}
    </div>
  </div>
)

const DeploymentProgress: React.FC<{ deployment: DeploymentStatus }> = ({ deployment }) => {
  const progress = (deployment.stage / deployment.totalStages) * 100

  return (
    <div className="deployment-progress">
      <h3>
        Deployment in Progress - Stage {deployment.stage}/{deployment.totalStages}
      </h3>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="deployment-stats">
        <span>Affected: {deployment.affectedServers}</span>
        <span>Healthy: {deployment.healthyServers}</span>
        <span>Unhealthy: {deployment.unhealthyServers}</span>
        <span className={`status status-${deployment.status}`}>
          {deployment.status}
        </span>
      </div>
    </div>
  )
}

const DriftCard: React.FC<{ drift: DriftResult }> = ({ drift }) => (
  <div className={`drift-card ${drift.detected ? 'detected' : ''}`}>
    <div className="drift-header">
      <span className="server-id">{drift.serverId}</span>
      <span className={`badge ${drift.autoRemediate ? 'auto' : 'manual'}`}>
        {drift.autoRemediate ? 'Auto-Remediate' : 'Manual Review'}
      </span>
    </div>
    {drift.differences.map((diff, i) => (
      <div key={i} className="drift-diff">
        <strong>{diff.path}</strong>
        <span className={`severity severity-${diff.severity}`}>{diff.severity}</span>
      </div>
    ))}
  </div>
)

const ServerCard: React.FC<{ server: Server }> = ({ server }) => (
  <div className={`server-card status-${server.status}`}>
    <div className="server-name">{server.hostname}</div>
    <div className="server-status">{server.status}</div>
    <div className="server-version">
      {server.currentConfigVersion === server.desiredConfigVersion ? '✅' : '🔄'}
    </div>
  </div>
)
