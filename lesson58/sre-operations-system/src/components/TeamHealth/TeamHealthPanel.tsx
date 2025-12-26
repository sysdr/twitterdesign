import React, { useState, useEffect } from 'react';
import { Heart, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TeamHealthPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    // Add timeout to prevent hanging
    const fetchWithTimeout = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const [metricsResponse, trendsResponse] = await Promise.all([
          fetch('/api/team/health', { signal: controller.signal }),
          fetch('/api/team/health/trends', { signal: controller.signal })
        ]);
        clearTimeout(timeoutId);
        const metricsData = await metricsResponse.json();
        const trendsData = await trendsResponse.json();
        setMetrics(metricsData);
        setTrendData(trendsData);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch team health:', error);
        }
      }
    };

    fetchWithTimeout();
    const interval = setInterval(fetchWithTimeout, 15000);
    
    // Listen for manual refresh events
    const handleRefresh = () => {
      fetchWithTimeout();
    };
    window.addEventListener('refresh-dashboard', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-dashboard', handleRefresh);
    };
  }, []);

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500" />
          Team Health
        </h2>
        <div className="text-center py-8 text-slate-600">Loading metrics...</div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    if (level === 'high') return 'text-red-600 bg-red-100 border-red-300';
    if (level === 'medium') return 'text-orange-600 bg-orange-100 border-orange-300';
    return 'text-green-600 bg-green-100 border-green-300';
  };

  // Use real trend data, fallback to empty array if not loaded yet
  const chartData = trendData.length > 0 ? trendData : [
    { week: 'W1', incidents: 0, satisfaction: 7.5 },
    { week: 'W2', incidents: 0, satisfaction: 7.5 },
    { week: 'W3', incidents: 0, satisfaction: 7.5 },
    { week: 'W4', incidents: 0, satisfaction: 7.5 }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 text-pink-500" />
        Team Health
      </h2>

      {/* Burnout Risk */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${getRiskColor(metrics.burnoutRiskLevel)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium mb-1">Burnout Risk</div>
            <div className="text-2xl font-bold capitalize">
              {metrics.burnoutRiskLevel}
            </div>
          </div>
          <AlertTriangle className="w-8 h-8" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          label="Avg Incidents/Week"
          value={metrics.averageIncidentsPerWeek.toFixed(1)}
        />
        <MetricCard
          label="Satisfaction Score"
          value={metrics.engineerSatisfactionScore.toFixed(1)}
        />
        <MetricCard
          label="Avg Ack Time"
          value={`${Math.round(metrics.meanTimeToAcknowledge)}s`}
        />
        <MetricCard
          label="Avg Resolve Time"
          value={`${Math.round(metrics.meanTimeToResolve / 60)}m`}
        />
      </div>

      {/* Trend Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="incidents"
              stroke="#f97316"
              fillOpacity={1}
              fill="url(#colorIncidents)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 bg-slate-50 rounded-lg">
    <div className="text-xs text-slate-600 mb-1">{label}</div>
    <div className="text-lg font-bold text-slate-900">{value}</div>
  </div>
);
