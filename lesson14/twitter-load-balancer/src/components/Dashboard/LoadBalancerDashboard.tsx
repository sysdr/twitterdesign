import React, { useState } from 'react';
import { Server, RoutingMetrics } from '../../types';
import { ServerCard } from './ServerCard';
import { MetricsChart } from './MetricsChart';
import { RequestSimulator } from './RequestSimulator';

interface Props {
  servers: Server[];
  metrics: RoutingMetrics;
  onSimulateRequest: (count: number) => void;
}

export const LoadBalancerDashboard: React.FC<Props> = ({
  servers,
  metrics,
  onSimulateRequest
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  
  const regions = ['all', ...new Set(servers.map(s => s.region))];
  
  const filteredServers = selectedRegion === 'all' 
    ? servers 
    : servers.filter(s => s.region === selectedRegion);

  return (
    <div className="dashboard" data-testid="load-balancer-dashboard">
      <header className="dashboard-header">
        <h1 data-testid="dashboard-title">Twitter Load Balancer Dashboard</h1>
        <div className="metrics-summary" data-testid="server-metrics">
          <div className="metric">
            <span className="value">{metrics.requestsPerSecond}</span>
            <span className="label">Requests/sec</span>
          </div>
          <div className="metric">
            <span className="value">{metrics.averageResponseTime}ms</span>
            <span className="label">Avg Response</span>
          </div>
          <div className="metric">
            <span className="value">{metrics.errorRate.toFixed(1)}%</span>
            <span className="label">Error Rate</span>
          </div>
        </div>
      </header>

      <div className="dashboard-controls">
        <select 
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="region-selector"
        >
          {regions.map(region => (
            <option key={region} value={region}>
              {region === 'all' ? 'All Regions' : region.toUpperCase()}
            </option>
          ))}
        </select>
        
        <RequestSimulator onSimulate={onSimulateRequest} />
      </div>

      <div className="dashboard-content">
        <div className="servers-grid">
          {filteredServers.map(server => (
            <ServerCard 
              key={server.id} 
              server={server}
              currentLoad={metrics.serverDistribution[server.id] || 0}
            />
          ))}
        </div>
        
        <div className="metrics-section" data-testid="real-time-updates">
          <MetricsChart metrics={metrics} servers={servers} />
        </div>
      </div>
    </div>
  );
};
