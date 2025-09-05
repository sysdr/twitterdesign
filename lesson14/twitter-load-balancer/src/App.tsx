import { useState, useEffect } from 'react';
import { LoadBalancerDashboard } from './components/Dashboard/LoadBalancerDashboard';
import { LoadBalancerService } from './services/LoadBalancerService';
import { Server, Request, RoutingMetrics } from './types';
import './App.css';

// Mock servers for demonstration
const mockServers: Server[] = [
  { id: 'us-east-1', host: '10.0.1.10', port: 8001, region: 'us-east', status: 'healthy', load: 0, responseTime: 45, lastHealthCheck: new Date() },
  { id: 'us-east-2', host: '10.0.1.11', port: 8002, region: 'us-east', status: 'healthy', load: 0, responseTime: 52, lastHealthCheck: new Date() },
  { id: 'us-west-1', host: '10.0.2.10', port: 8003, region: 'us-west', status: 'healthy', load: 0, responseTime: 38, lastHealthCheck: new Date() },
  { id: 'us-west-2', host: '10.0.2.11', port: 8004, region: 'us-west', status: 'warning', load: 0, responseTime: 95, lastHealthCheck: new Date() },
  { id: 'eu-west-1', host: '10.0.3.10', port: 8005, region: 'eu-west', status: 'healthy', load: 0, responseTime: 41, lastHealthCheck: new Date() },
  { id: 'eu-west-2', host: '10.0.3.11', port: 8006, region: 'eu-west', status: 'healthy', load: 0, responseTime: 39, lastHealthCheck: new Date() },
  { id: 'asia-pacific-1', host: '10.0.4.10', port: 8007, region: 'asia-pacific', status: 'healthy', load: 0, responseTime: 67, lastHealthCheck: new Date() },
  { id: 'asia-pacific-2', host: '10.0.4.11', port: 8008, region: 'asia-pacific', status: 'recovering', load: 0, responseTime: 120, lastHealthCheck: new Date() }
];

const loadBalancerConfig = {
  maxLoad: 1000,
  healthCheckInterval: 10000,
  failureThreshold: 3,
  recoveryThreshold: 5
};

function App() {
  const [servers, setServers] = useState<Server[]>(mockServers);
  const [metrics, setMetrics] = useState<RoutingMetrics>({
    totalRequests: 0,
    requestsPerSecond: 0,
    averageResponseTime: 0,
    errorRate: 0,
    serverDistribution: {}
  });
  const [loadBalancer] = useState(() => new LoadBalancerService(mockServers, loadBalancerConfig));

  useEffect(() => {
    // Set up event listeners
    const handleServerStatusChange = (server: Server) => {
      setServers(prev => prev.map(s => s.id === server.id ? server : s));
    };

    const handleRequestRouted = (data: any) => {
      console.log('Request routed:', data);
    };

    loadBalancer.on('serverStatusChanged', handleServerStatusChange);
    loadBalancer.on('requestRouted', handleRequestRouted);

    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      setMetrics(loadBalancer.getMetrics());
    }, 1000);

    return () => {
      loadBalancer.removeAllListeners();
      clearInterval(metricsInterval);
      loadBalancer.stop();
    };
  }, [loadBalancer]);

  const simulateRequests = async (count: number) => {
    const clientIps = [
      '203.0.113.1', // US
      '198.51.100.1', // US
      '93.184.216.34', // EU
      '185.199.108.153', // EU
      '210.195.158.1', // Asia
      '118.25.6.39' // Asia
    ];

    for (let i = 0; i < count; i++) {
      const request: Request = {
        id: `req-${Date.now()}-${i}`,
        clientIp: clientIps[Math.floor(Math.random() * clientIps.length)],
        path: `/api/v1/tweets/${Math.floor(Math.random() * 1000)}`,
        method: 'GET',
        timestamp: new Date()
      };

      const selectedServer = loadBalancer.routeRequest(request);
      
      // Simulate request completion
      if (selectedServer) {
        setTimeout(() => {
          loadBalancer.completeRequest(selectedServer.id);
        }, Math.random() * 100 + 50);
      }

      // Add small delay to spread requests
      if (i % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  };

  return (
    <div className="App">
      <LoadBalancerDashboard 
        servers={servers}
        metrics={metrics}
        onSimulateRequest={simulateRequests}
      />
    </div>
  );
}

export default App;
