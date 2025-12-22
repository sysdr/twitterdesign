import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Target, Zap, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface CostData {
  timestamp: string;
  cost: number;
  service: string;
}

interface BudgetData {
  id: string;
  name: string;
  limit: number;
  spent: number;
  forecasted: number;
  status: string;
}

interface Recommendation {
  id: string;
  title: string;
  type: string;
  savings: number;
  confidence: number;
}

interface Anomaly {
  id: string;
  service: string;
  severity: string;
  deviation: number;
  description: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Dashboard() {
  const [costData, setCostData] = useState<CostData[]>([]);
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [totalCost, setTotalCost] = useState({ hourly: 0, daily: 0, monthly: 0 });

  useEffect(() => {
    // Fetch initial data
    fetchDashboardData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard summary
      const summaryRes = await fetch('/api/dashboard/summary');
      if (summaryRes.ok) {
        const summary: any = await summaryRes.json();
        setTotalCost(summary.totalCost);
        setBudgets(summary.budgetStatus || []);
      }

      // Fetch current costs
      const costsRes = await fetch('/api/costs/current');
      if (costsRes.ok) {
        const costsData: any = await costsRes.json();
        const formattedCosts: CostData[] = costsData.costs.map((c: any) => ({
          timestamp: c.timestamp,
          cost: c.cost,
          service: c.serviceId
        }));
        setCostData(formattedCosts);
      }

      // Fetch optimizations
      const optimizationsRes = await fetch('/api/optimizations');
      if (optimizationsRes.ok) {
        const optData: any = await optimizationsRes.json();
        setRecommendations(optData.recommendations || []);
      }

      // Fetch anomalies
      const anomaliesRes = await fetch('/api/anomalies');
      if (anomaliesRes.ok) {
        const anomaliesData: any = await anomaliesRes.json();
        setAnomalies(anomaliesData.anomalies || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const aggregateCostsByService = () => {
    const byService = new Map<string, number>();
    costData.forEach(d => {
      const current = byService.get(d.service) || 0;
      byService.set(d.service, current + d.cost);
    });
    
    return Array.from(byService.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));
  };

  const getCostTrend = () => {
    const byMinute = new Map<string, number>();
    costData.forEach(d => {
      const minute = d.timestamp.substring(0, 16);
      const current = byMinute.get(minute) || 0;
      byMinute.set(minute, current + d.cost);
    });
    
    return Array.from(byMinute.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-20)
      .map(([time, cost]) => ({
        time: new Date(time).toLocaleTimeString(),
        cost: parseFloat(cost.toFixed(3))
      }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500';
      case 'critical': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            FinOps Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time infrastructure cost tracking and optimization
          </p>
        </div>

        {/* Cost Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Hourly Cost</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${totalCost.hourly.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Current burn rate</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Daily Projection</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${totalCost.daily.toFixed(0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">At current rate</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Monthly Forecast</h3>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${totalCost.monthly.toFixed(0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Forecasted spend</p>
          </div>
        </div>

        {/* Cost Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Cost Trend (Last 20 Minutes)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getCostTrend()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by Service */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cost by Service
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={aggregateCostsByService()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: $${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {aggregateCostsByService().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Budget Status
            </h2>
            <div className="space-y-4">
              {budgets.map(budget => {
                const utilization = (budget.forecasted / budget.limit) * 100;
                return (
                  <div key={budget.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {budget.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${getStatusColor(budget.status)} h-3 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Spent: ${budget.spent.toLocaleString()}</span>
                      <span>Limit: ${budget.limit.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Optimization Recommendations */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Optimization Opportunities
            </h2>
            <span className="text-sm text-green-600 font-medium">
              Total Savings: ${recommendations.reduce((sum, r) => sum + r.savings, 0).toLocaleString()}/month
            </span>
          </div>
          <div className="space-y-3">
            {recommendations.map(rec => (
              <div key={rec.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{rec.title}</p>
                    <p className="text-sm text-gray-600">
                      {rec.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} • 
                      Confidence: {(rec.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ${rec.savings.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">per month</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly Alerts */}
        {anomalies.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              Cost Anomalies Detected
            </h2>
            <div className="space-y-3">
              {anomalies.map(anomaly => (
                <div key={anomaly.id} className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{anomaly.service}</p>
                      <p className="text-sm mt-1">{anomaly.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
