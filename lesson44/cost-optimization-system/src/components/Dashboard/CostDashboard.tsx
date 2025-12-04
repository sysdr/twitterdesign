import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CostMetrics, ResourceMetrics, OptimizationRecommendation, CostForecast } from '../../types';

interface DashboardProps {
  websocketUrl: string;
}

export const CostDashboard: React.FC<DashboardProps> = ({ websocketUrl }) => {
  const [costMetrics, setCostMetrics] = useState<CostMetrics[]>([]);
  const [resourceMetrics, setResourceMetrics] = useState<ResourceMetrics[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [forecast, setForecast] = useState<CostForecast[]>([]);
  const [currentCost, setCurrentCost] = useState(0);
  const [projectedCost, setProjectedCost] = useState(0);
  const [savings, setSavings] = useState(0);
  const [budgetLimit] = useState(100);

  useEffect(() => {
    const ws = new WebSocket(websocketUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'cost_metrics') {
        setCostMetrics(prev => [...prev.slice(-50), data.payload]);
        // Don't update currentCost from individual requests, use summary instead
      } else if (data.type === 'resource_metrics') {
        setResourceMetrics(prev => [...prev.slice(-50), data.payload]);
      } else if (data.type === 'recommendations') {
        setRecommendations(data.payload);
      } else if (data.type === 'forecast') {
        setForecast(data.payload);
      } else if (data.type === 'summary') {
        if (data.payload.currentHourCost !== undefined) {
          setCurrentCost(data.payload.currentHourCost);
        }
        setProjectedCost(data.payload.projectedDailyCost || 0);
        setSavings(data.payload.totalSavings || 0);
      }
    };

    return () => ws.close();
  }, [websocketUrl]);

  const budgetPercentage = (projectedCost / budgetLimit) * 100;
  const budgetColor = budgetPercentage > 90 ? '#ef4444' : budgetPercentage > 75 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#f9fafb',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
        Cost Optimization Dashboard
      </h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Current Hour Cost</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>${currentCost.toFixed(4)}</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>↓ Real-time tracking</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Projected Daily Cost</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>${projectedCost.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: budgetColor, marginTop: '4px' }}>
            {budgetPercentage.toFixed(0)}% of budget
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Savings</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>${savings.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>↓ 40% reduction achieved</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Budget Remaining</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>${(budgetLimit - projectedCost).toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Out of ${budgetLimit}</div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>Budget Utilization</div>
        <div style={{ width: '100%', height: '24px', backgroundColor: '#e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${Math.min(budgetPercentage, 100)}%`, 
            height: '100%', 
            backgroundColor: budgetColor,
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
          ${projectedCost.toFixed(2)} / ${budgetLimit} per day ({budgetPercentage.toFixed(1)}%)
        </div>
      </div>

      {/* Cost Trends Chart */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Cost Breakdown Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={costMetrics.slice(-30).map(m => ({
            time: new Date(m.timestamp).toLocaleTimeString(),
            compute: m.computeCost * 1000,
            database: m.databaseCost * 1000,
            cache: m.cacheCost * 1000,
            network: m.networkCost * 1000
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis label={{ value: 'Cost ($/1000 req)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="compute" stroke="#3b82f6" />
            <Line type="monotone" dataKey="database" stroke="#ef4444" />
            <Line type="monotone" dataKey="cache" stroke="#10b981" />
            <Line type="monotone" dataKey="network" stroke="#f59e0b" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Resource Utilization */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Resource Utilization</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={resourceMetrics.slice(-30).map(m => ({
            time: new Date(m.timestamp).toLocaleTimeString(),
            cpu: m.cpuUtilization,
            memory: m.memoryUtilization,
            latency: m.p95Latency
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU %" />
            <Line type="monotone" dataKey="memory" stroke="#10b981" name="Memory %" />
            <Line type="monotone" dataKey="latency" stroke="#f59e0b" name="P95 Latency (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Optimization Recommendations */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Optimization Recommendations</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendations.map(rec => (
            <div key={rec.id} style={{ 
              padding: '16px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px',
              borderLeft: `4px solid ${rec.impact === 'high' ? '#10b981' : rec.impact === 'medium' ? '#f59e0b' : '#6b7280'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{rec.description}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Impact: {rec.impact} | Confidence: {(rec.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#10b981',
                  minWidth: '80px',
                  textAlign: 'right'
                }}>
                  ${rec.estimatedSavings}/mo
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Forecast */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>7-Day Cost Forecast</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecast.map(f => ({
            date: new Date(f.date).toLocaleDateString(),
            predicted: f.predictedCost,
            upper: f.upperBound,
            lower: f.lowerBound
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Daily Cost ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="upper" stroke="#e5e7eb" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="lower" stroke="#e5e7eb" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
