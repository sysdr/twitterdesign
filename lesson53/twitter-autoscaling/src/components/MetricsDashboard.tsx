import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface Metrics {
  timestamp: Date;
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  requestRate: number;
  activeConnections: number;
  responseTime: number;
}

interface Server {
  id: string;
  status: string;
  region: string;
  capacity: number;
  cost: number;
}

interface Prediction {
  predictedRequestRate: number;
  confidence: number;
  trend: number;
}

interface ScalingDecision {
  timestamp: Date;
  currentServers: number;
  targetServers: number;
  reason: string;
  approved: boolean;
}

export const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [scalingHistory, setScalingHistory] = useState<ScalingDecision[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, serversRes, predictionRes, scalingRes] = await Promise.all([
        fetch('/api/metrics/historical?hours=0.5'),
        fetch('/api/servers'),
        fetch('/api/prediction'),
        fetch('/api/scaling/history')
      ]);

      setMetrics(await metricsRes.json());
      setServers(await serversRes.json());
      setPrediction(await predictionRes.json());
      setScalingHistory(await scalingRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const aggregateMetrics = () => {
    const timeGroups = new Map<number, Metrics[]>();
    
    metrics.forEach(m => {
      const timeKey = Math.floor(new Date(m.timestamp).getTime() / 30000);
      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, []);
      }
      timeGroups.get(timeKey)!.push(m);
    });

    return Array.from(timeGroups.values()).map(group => ({
      time: new Date(group[0].timestamp).toLocaleTimeString(),
      avgCpu: group.reduce((sum, m) => sum + m.cpuUsage, 0) / group.length,
      avgMemory: group.reduce((sum, m) => sum + m.memoryUsage, 0) / group.length,
      totalRequests: group.reduce((sum, m) => sum + m.requestRate, 0),
      avgResponseTime: group.reduce((sum, m) => sum + m.responseTime, 0) / group.length
    }));
  };

  const chartData = aggregateMetrics();
  const runningServers = servers.filter(s => s.status === 'running');
  const totalCapacity = runningServers.reduce((sum, s) => sum + s.capacity, 0);
  const currentLoad = metrics.reduce((sum, m) => sum + m.requestRate, 0);
  const utilization = totalCapacity > 0 ? (currentLoad / totalCapacity * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>⚡ Auto-Scaling Dashboard</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Real-time capacity planning and predictive scaling</p>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Active Servers</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60' }}>{runningServers.length}</div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Capacity: {totalCapacity} req/s
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Current Load</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db' }}>{Math.floor(currentLoad)}</div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Utilization: {utilization}%
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Predicted Load</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e67e22' }}>
            {prediction?.predictedRequestRate || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Confidence: {((prediction?.confidence || 0) * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Hourly Cost</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9b59b6' }}>
            ${(runningServers.length * 0.10).toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Daily: ${(runningServers.length * 0.10 * 24).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Request Rate & Capacity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="totalRequests" stroke="#3498db" fill="#3498db" fillOpacity={0.3} name="Requests/s" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>CPU & Memory Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgCpu" stroke="#e74c3c" name="CPU %" />
              <Line type="monotone" dataKey="avgMemory" stroke="#27ae60" name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Response Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgResponseTime" stroke="#9b59b6" name="Response Time (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Server Status</h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {servers.map(server => (
              <div key={server.id} style={{ 
                padding: '10px', 
                marginBottom: '10px', 
                backgroundColor: server.status === 'running' ? '#e8f5e9' : '#fff3cd',
                borderRadius: '4px',
                borderLeft: `4px solid ${server.status === 'running' ? '#27ae60' : '#f39c12'}`
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{server.id}</div>
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                  Status: {server.status} | Capacity: {server.capacity} req/s | Cost: ${server.cost}/hr
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scaling History */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Scaling Decisions</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {scalingHistory.slice(-10).reverse().map((decision, idx) => (
            <div key={idx} style={{ 
              padding: '10px', 
              marginBottom: '10px', 
              backgroundColor: decision.approved ? '#e8f5e9' : '#f5f5f5',
              borderRadius: '4px',
              borderLeft: `4px solid ${decision.approved ? '#27ae60' : '#95a5a6'}`
            }}>
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                {new Date(decision.timestamp).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                {decision.currentServers} → {decision.targetServers} servers
                {decision.approved && <span style={{ color: '#27ae60', marginLeft: '10px' }}>✓ Approved</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                {decision.reason}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
