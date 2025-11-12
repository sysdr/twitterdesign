import { useState, useEffect, type FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Server } from 'lucide-react';
import { QueueState } from '../types';
import { MetricsCollector } from '../services/MetricsCollector';
import { CapacityPlanner } from '../services/CapacityPlanner';
import { QueueSimulator } from '../services/QueueSimulator';
import { QueuingTheoryModel } from '../models/QueuingTheory';

export const CapacityDashboard: FC = () => {
  const [metricsCollector] = useState(() => new MetricsCollector());
  const [capacityPlanner] = useState(() => new CapacityPlanner());
  const [simulator] = useState(() => new QueueSimulator());
  
  const [queueStates, setQueueStates] = useState<QueueState[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [trafficPattern, setTrafficPattern] = useState<'steady' | 'spike' | 'growing' | 'declining'>('steady');
  const [isRunning, setIsRunning] = useState(false);

  // Initialize queues
  useEffect(() => {
    const queues = [
      { name: 'Tweet Ingestion', arrivalRate: 50, serviceRate: 60, servers: 2 },
      { name: 'Fanout Service', arrivalRate: 80, serviceRate: 100, servers: 3 },
      { name: 'Timeline Generator', arrivalRate: 40, serviceRate: 50, servers: 2 }
    ];

    queues.forEach(q => {
      simulator.initializeQueue(q.name, q.arrivalRate, q.serviceRate, q.servers);
    });
  }, [simulator]);

  // Main simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const queueNames = ['Tweet Ingestion', 'Fanout Service', 'Timeline Generator'];
      const states: QueueState[] = [];

      queueNames.forEach(name => {
        // Simulate traffic
        simulator.simulateTrafficPattern(name, trafficPattern, 1.0);
        
        // Process queue
        const result = simulator.processQueue(name);
        
        // Record metrics
        for (let i = 0; i < result.arrivals; i++) {
          metricsCollector.recordArrival(name);
        }
        for (let i = 0; i < result.serviced; i++) {
          metricsCollector.recordServiceCompletion(name);
        }
        metricsCollector.recordQueueDepth(name, result.queueDepth);

        // Get current metrics
        const metrics = metricsCollector.getMetrics(name);
        
        // Generate prediction
        const currentServers = name === 'Tweet Ingestion' ? 2 : name === 'Fanout Service' ? 3 : 2;
        const prediction = capacityPlanner.predictQueueBehavior(
          name,
          metrics,
          currentServers,
          0 // Assume no trend for simplicity
        );

        // Determine health
        const health = QueuingTheoryModel.determineHealth(metrics.utilization);

        // Apply scaling recommendations
        if (prediction.scalingRecommendation.action === 'scale_up') {
          simulator.updateServerCount(name, prediction.scalingRecommendation.targetServers);
        }

        states.push({
          name,
          metrics,
          prediction,
          health
        });
      });

      setQueueStates(states);

      // Update historical data
      setHistoricalData(prev => {
        const newData = [...prev, {
          time: new Date().toLocaleTimeString(),
          ...states.reduce((acc, state) => {
            acc[`${state.name}_util`] = state.metrics.utilization * 100;
            acc[`${state.name}_queue`] = state.metrics.queueLength;
            return acc;
          }, {} as any)
        }];
        return newData.slice(-30); // Keep last 30 data points
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, trafficPattern, metricsCollector, capacityPlanner, simulator]);

  const formatNumber = (num: number): string => {
    if (!isFinite(num)) return '∞';
    return num.toFixed(2);
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ 
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '20px',
          marginBottom: '24px'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '28px',
            fontWeight: 600,
            color: '#212529',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Activity size={32} color="#4CAF50" />
            Capacity Planning Dashboard
            <span style={{ 
              fontSize: '14px',
              color: '#6c757d',
              fontWeight: 400,
              marginLeft: 'auto'
            }}>
              Powered by Queuing Theory
            </span>
          </h1>
        </div>

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: isRunning ? '#dc3545' : '#4CAF50',
              color: 'white',
              transition: 'all 0.2s'
            }}
          >
            {isRunning ? 'Stop' : 'Start'} Simulation
          </button>

          <select
            value={trafficPattern}
            onChange={(e) => setTrafficPattern(e.target.value as any)}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="steady">Steady Traffic</option>
            <option value="spike">Traffic Spike</option>
            <option value="growing">Growing Load</option>
            <option value="declining">Declining Load</option>
          </select>

          <button
            onClick={() => {
              metricsCollector.resetAll();
              simulator.reset();
              setHistoricalData([]);
              setQueueStates([]);
            }}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #ced4da',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: 'white',
              color: '#495057'
            }}
          >
            Reset
          </button>
        </div>

        {/* Queue States */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {queueStates.map((state, index) => (
            <QueueCard key={index} state={state} formatNumber={formatNumber} />
          ))}
        </div>

        {/* Charts */}
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ 
            fontSize: '20px',
            fontWeight: 600,
            marginBottom: '16px',
            color: '#212529'
          }}>
            Real-Time Metrics
          </h2>

          {/* Utilization Chart */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: 500,
              marginBottom: '16px',
              color: '#495057'
            }}>
              Queue Utilization (%)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis dataKey="time" stroke="#6c757d" />
                <YAxis stroke="#6c757d" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Tweet Ingestion_util" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  dot={false}
                  name="Tweet Ingestion"
                />
                <Line 
                  type="monotone" 
                  dataKey="Fanout Service_util" 
                  stroke="#FF9800" 
                  strokeWidth={2}
                  dot={false}
                  name="Fanout Service"
                />
                <Line 
                  type="monotone" 
                  dataKey="Timeline Generator_util" 
                  stroke="#2196F3" 
                  strokeWidth={2}
                  dot={false}
                  name="Timeline Generator"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Queue Length Chart */}
          <div style={{ 
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: 500,
              marginBottom: '16px',
              color: '#495057'
            }}>
              Queue Depth (items)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis dataKey="time" stroke="#6c757d" />
                <YAxis stroke="#6c757d" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Tweet Ingestion_queue" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  dot={false}
                  name="Tweet Ingestion"
                />
                <Line 
                  type="monotone" 
                  dataKey="Fanout Service_queue" 
                  stroke="#FF9800" 
                  strokeWidth={2}
                  dot={false}
                  name="Fanout Service"
                />
                <Line 
                  type="monotone" 
                  dataKey="Timeline Generator_queue" 
                  stroke="#2196F3" 
                  strokeWidth={2}
                  dot={false}
                  name="Timeline Generator"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const QueueCard: FC<{ state: QueueState; formatNumber: (n: number) => string }> = ({ 
  state, 
  formatNumber 
}) => {
  const healthColors = {
    healthy: '#4CAF50',
    warning: '#FF9800',
    critical: '#f44336'
  };

  const healthIcons = {
    healthy: CheckCircle,
    warning: AlertTriangle,
    critical: AlertTriangle
  };

  const HealthIcon = healthIcons[state.health];
  const healthColor = healthColors[state.health];

  return (
    <div style={{
      border: `2px solid ${healthColor}`,
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: 'white'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '12px'
      }}>
        <HealthIcon size={20} color={healthColor} />
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px',
          fontWeight: 600,
          color: '#212529'
        }}>
          {state.name}
        </h3>
      </div>

      <div style={{ fontSize: '13px', color: '#495057', lineHeight: '1.6' }}>
        <MetricRow 
          label="Arrival Rate (λ)" 
          value={`${formatNumber(state.metrics.arrivalRate)} req/s`} 
        />
        <MetricRow 
          label="Service Rate (μ)" 
          value={`${formatNumber(state.metrics.serviceRate)} req/s`} 
        />
        <MetricRow 
          label="Utilization (ρ)" 
          value={`${formatNumber(state.metrics.utilization * 100)}%`}
          highlight={state.metrics.utilization > 0.7}
        />
        <MetricRow 
          label="Queue Length (L)" 
          value={formatNumber(state.metrics.queueLength)} 
        />
        <MetricRow 
          label="Wait Time (W)" 
          value={`${formatNumber(state.metrics.averageWaitTime * 1000)} ms`} 
        />

        {state.prediction.scalingRecommendation.action !== 'none' && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            borderLeft: '3px solid #FF9800'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: 600,
              marginBottom: '4px'
            }}>
              <Server size={14} />
              Scaling: {state.prediction.scalingRecommendation.currentServers} → {state.prediction.scalingRecommendation.targetServers} servers
            </div>
            <div style={{ fontSize: '12px', color: '#856404' }}>
              {state.prediction.scalingRecommendation.reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricRow: FC<{ 
  label: string; 
  value: string; 
  highlight?: boolean 
}> = ({ label, value, highlight }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between',
    padding: '4px 0',
    fontWeight: highlight ? 600 : 400,
    color: highlight ? '#f44336' : '#495057'
  }}>
    <span>{label}:</span>
    <span>{value}</span>
  </div>
);
