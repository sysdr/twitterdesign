import { useState, useCallback, useRef, useEffect } from 'react';
import { Server, LoadBalancerConfig, RoutingDecision, LoadMetrics } from '../types';
import { BoundedLoadBalancer } from '../lib/balancer/boundedLoadBalancer';

const DEFAULT_CONFIG: LoadBalancerConfig = {
  epsilon: 0.25,
  baseVirtualNodes: 150,
  healthWeights: {
    cpu: 0.4,
    memory: 0.3,
    responseTime: 0.3
  },
  updateInterval: 1000
};

export function useLoadBalancer(initialConfig?: Partial<LoadBalancerConfig>) {
  const config = { ...DEFAULT_CONFIG, ...initialConfig };
  const balancerRef = useRef<BoundedLoadBalancer>(new BoundedLoadBalancer(config));
  
  const [servers, setServers] = useState<Server[]>([]);
  const [metrics, setMetrics] = useState<LoadMetrics>({
    totalRequests: 0,
    spilloverCount: 0,
    loadVariance: 0,
    maxLoad: 0,
    minLoad: 0,
    avgLoad: 0
  });
  const [history, setHistory] = useState<RoutingDecision[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const updateState = useCallback(() => {
    setServers(balancerRef.current.getServers());
    setMetrics(balancerRef.current.getMetrics());
    setHistory(balancerRef.current.getRoutingHistory().slice(-50));
  }, []);

  const addServer = useCallback((server: Omit<Server, 'virtualNodes' | 'effectiveWeight' | 'status'>) => {
    const fullServer: Server = {
      ...server,
      virtualNodes: 0,
      effectiveWeight: server.weight,
      status: 'healthy'
    };
    balancerRef.current.addServer(fullServer);
    updateState();
  }, [updateState]);

  const sendRequest = useCallback((requestId?: string) => {
    const id = requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    balancerRef.current.route(id);
    updateState();
  }, [updateState]);

  const sendBatch = useCallback((count: number) => {
    for (let i = 0; i < count; i++) {
      const id = `batch-${Date.now()}-${i}`;
      balancerRef.current.route(id);
    }
    updateState();
  }, [updateState]);

  const simulateLoad = useCallback(() => {
    // Simulate varying server conditions
    const currentServers = balancerRef.current.getServers();
    
    currentServers.forEach(server => {
      const loadFactor = server.currentLoad / server.capacity;
      
      // CPU increases with load
      const cpu = Math.min(95, 20 + loadFactor * 60 + Math.random() * 10);
      
      // Memory increases more slowly
      const memory = Math.min(90, 30 + loadFactor * 40 + Math.random() * 5);
      
      // Response time increases exponentially with load
      const responseTime = 10 + Math.pow(loadFactor, 2) * 200 + Math.random() * 20;

      balancerRef.current.updateServerMetrics(server.id, {
        cpu,
        memory,
        responseTime,
        currentLoad: server.currentLoad
      });
    });

    // Send some requests
    const requestCount = 5 + Math.floor(Math.random() * 10);
    for (let i = 0; i < requestCount; i++) {
      balancerRef.current.route(`sim-${Date.now()}-${i}`);
    }

    updateState();
  }, [updateState]);

  const startSimulation = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsRunning(true);
    intervalRef.current = window.setInterval(simulateLoad, config.updateInterval);
  }, [simulateLoad, config.updateInterval]);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stopSimulation();
    balancerRef.current.resetCounts();
    updateState();
  }, [stopSimulation, updateState]);

  const loadDemoData = useCallback(() => {
    // Send a large batch of requests to generate demo data
    const requestCount = 500;
    for (let i = 0; i < requestCount; i++) {
      const id = `demo-${Date.now()}-${i}`;
      balancerRef.current.route(id);
    }

    // Update server metrics to show varied states
    const currentServers = balancerRef.current.getServers();
    currentServers.forEach((server, index) => {
      const loadFactor = (server.currentLoad / server.capacity) || 0;
      
      // Vary CPU, memory, and response time based on load and server index
      const baseCpu = 20 + (index * 10);
      const cpu = Math.min(95, baseCpu + loadFactor * 50 + Math.random() * 15);
      
      const baseMemory = 25 + (index * 5);
      const memory = Math.min(90, baseMemory + loadFactor * 35 + Math.random() * 10);
      
      const baseResponseTime = 8 + (index * 3);
      const responseTime = baseResponseTime + Math.pow(loadFactor, 2) * 150 + Math.random() * 25;

      balancerRef.current.updateServerMetrics(server.id, {
        cpu,
        memory,
        responseTime,
        currentLoad: server.currentLoad
      });
    });

    updateState();
  }, [updateState]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    servers,
    metrics,
    history,
    isRunning,
    config,
    addServer,
    sendRequest,
    sendBatch,
    startSimulation,
    stopSimulation,
    reset,
    loadDemoData
  };
}
