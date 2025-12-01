import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Zap, TrendingDown, Network } from 'lucide-react';
import { NetworkOptimizer } from '../services/NetworkOptimizer';
import { NetworkMetrics } from '../types/network';

interface DashboardProps {
  optimizer: NetworkOptimizer;
}

export const NetworkDashboard: React.FC<DashboardProps> = ({ optimizer }) => {
  const [metrics, setMetrics] = useState<NetworkMetrics[]>([]);
  const [stats, setStats] = useState({
    avgLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
    packetLoss: 0,
    throughput: 0
  });

  useEffect(() => {
    const updateStats = () => {
      try {
        const monitor = optimizer.getMonitor();
        const recentMetrics = monitor.getRecentMetrics(50);
        
        setMetrics(recentMetrics.map(m => ({
          ...m,
          time: new Date(m.timestamp).toLocaleTimeString()
        })));

        setStats({
          avgLatency: Math.round(monitor.getAverageLatency() || 0),
          p95Latency: Math.round(monitor.calculatePercentile(95) || 0),
          p99Latency: Math.round(monitor.calculatePercentile(99) || 0),
          packetLoss: Number((monitor.getPacketLossRate() || 0).toFixed(2)),
          throughput: recentMetrics.length > 0 
            ? Math.round(recentMetrics[recentMetrics.length - 1].throughput || 0)
            : 0
        });
      } catch (error) {
        console.error('Error updating stats:', error);
        // Keep existing stats on error
      }
    };

    // Update immediately
    updateStats();
    
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [optimizer]);

  const latencyData = metrics.slice(-20).map((m: any) => ({
    time: m.time,
    latency: m.latency,
    rtt: m.rtt
  }));

  const bandwidthAllocation = Array.from(
    optimizer.getBandwidthManager().getAllocation().classes.entries()
  ).map(([name, traffic]) => ({
    name,
    rate: Math.round(traffic.rate),
    tokens: Math.round(traffic.tokens)
  }));

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <Network size={32} color="#1DA1F2" />
          <h1 style={{ margin: '0 0 0 15px', color: '#14171A' }}>
            Network Performance Optimizer
          </h1>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <StatCard
            icon={<Activity size={24} />}
            title="Avg Latency"
            value={`${stats.avgLatency}ms`}
            color="#1DA1F2"
          />
          <StatCard
            icon={<Zap size={24} />}
            title="P95 Latency"
            value={`${stats.p95Latency}ms`}
            color="#17BF63"
          />
          <StatCard
            icon={<TrendingDown size={24} />}
            title="P99 Latency"
            value={`${stats.p99Latency}ms`}
            color="#F45D22"
          />
          <StatCard
            icon={<Network size={24} />}
            title="Packet Loss"
            value={`${stats.packetLoss}%`}
            color="#794BC4"
          />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#14171A' }}>Latency Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" />
                <XAxis dataKey="time" stroke="#657786" />
                <YAxis stroke="#657786" label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E1E8ED' }} />
                <Legend />
                <Line type="monotone" dataKey="latency" stroke="#1DA1F2" strokeWidth={2} dot={false} name="Latency" />
                <Line type="monotone" dataKey="rtt" stroke="#17BF63" strokeWidth={2} dot={false} name="RTT" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#14171A' }}>Bandwidth Allocation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bandwidthAllocation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" />
                <XAxis dataKey="name" stroke="#657786" />
                <YAxis stroke="#657786" label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E1E8ED' }} />
                <Legend />
                <Bar dataKey="rate" fill="#1DA1F2" name="Rate" />
                <Bar dataKey="tokens" fill="#17BF63" name="Available Tokens" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Condition Info */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#14171A' }}>Network Condition</h3>
          <NetworkConditionDisplay optimizer={optimizer} />
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string }> = ({
  icon,
  title,
  value,
  color
}) => (
  <div style={{
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center'
  }}>
    <div style={{ color, marginRight: '15px' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '14px', color: '#657786', marginBottom: '5px' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#14171A' }}>{value}</div>
    </div>
  </div>
);

const NetworkConditionDisplay: React.FC<{ optimizer: NetworkOptimizer }> = ({ optimizer }) => {
  const [condition, setCondition] = useState<any>(null);
  const [tcpConfig, setTcpConfig] = useState<any>(null);

  useEffect(() => {
    // Set initial values immediately
    try {
      const detected = optimizer.getMonitor().detectNetworkCondition();
      const config = optimizer.getTCPOptimizer().getCurrentConfig();
      setCondition(detected);
      setTcpConfig(config);
    } catch (error) {
      console.error('Error detecting network condition:', error);
    }

    const interval = setInterval(() => {
      try {
        const detected = optimizer.getMonitor().detectNetworkCondition();
        const config = optimizer.getTCPOptimizer().getCurrentConfig();
        setCondition(detected);
        setTcpConfig(config);
      } catch (error) {
        console.error('Error updating network condition:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [optimizer]);

  if (!condition || !tcpConfig) {
    return (
      <div style={{ padding: '15px', color: '#657786' }}>
        Detecting network conditions...
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div>
        <h4 style={{ color: '#14171A', marginBottom: '10px' }}>Detected Condition</h4>
        <div style={{ padding: '15px', backgroundColor: '#F7F9FA', borderRadius: '8px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Type:</strong> {condition.type}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Baseline RTT:</strong> {condition.baselineRTT.toFixed(1)}ms
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Packet Loss:</strong> {condition.packetLoss.toFixed(2)}%
          </div>
          <div>
            <strong>Bandwidth:</strong> {condition.bandwidth} Mbps
          </div>
        </div>
      </div>

      <div>
        <h4 style={{ color: '#14171A', marginBottom: '10px' }}>TCP Configuration</h4>
        <div style={{ padding: '15px', backgroundColor: '#F7F9FA', borderRadius: '8px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Initial Window:</strong> {tcpConfig.initialWindow}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Fast Retransmit:</strong> {tcpConfig.fastRetransmitThreshold}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Selective ACK:</strong> {tcpConfig.selectiveAck ? 'Enabled' : 'Disabled'}
          </div>
          <div>
            <strong>Max RTO:</strong> {tcpConfig.maxRetransmitTimeout}ms
          </div>
        </div>
      </div>
    </div>
  );
};
