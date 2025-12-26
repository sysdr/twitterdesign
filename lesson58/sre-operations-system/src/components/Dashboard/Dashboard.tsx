import React, { useState, useEffect } from 'react';
import { AlertCircle, Users, Activity, CheckCircle } from 'lucide-react';
import { OnCallPanel } from '../OnCall/OnCallPanel';
import { IncidentsList } from '../Incidents/IncidentsList';
import { RunbooksPanel } from '../Runbooks/RunbooksPanel';
import { TeamHealthPanel } from '../TeamHealth/TeamHealthPanel';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activeIncidents: 0,
    onCallEngineers: 0,
    avgResponseTime: 0,
    automationRate: 0
  });
  const [isSettingUp, setIsSettingUp] = useState(false);

  const setupDemoData = async () => {
    setIsSettingUp(true);
    try {
      const response = await fetch('/api/setup/demo', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        console.log('Demo data setup successful:', data);
        setIsSettingUp(false);
        // Trigger refresh of all components after a short delay to ensure API has processed the data
        setTimeout(() => {
          window.dispatchEvent(new Event('refresh-dashboard'));
        }, 300);
      } else {
        setIsSettingUp(false);
        alert('Setup completed but returned unexpected result');
      }
    } catch (error) {
      console.error('Failed to setup demo data:', error);
      alert('Failed to setup demo data. Please check the server is running on port 8080.');
      setIsSettingUp(false);
    }
  };

  useEffect(() => {
    // Don't block rendering - fetch data asynchronously after component mounts
    const fetchStats = async () => {
      try {
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const [incidents, metrics, onCall] = await Promise.all([
          fetch('/api/incidents/active', { signal: controller.signal })
            .then(r => r.json())
            .catch(() => []),
          fetch('/api/incidents/metrics', { signal: controller.signal })
            .then(r => r.json())
            .catch(() => ({})),
          fetch('/api/oncall/current', { signal: controller.signal })
            .then(r => r.json())
            .catch(() => null)
        ]);
        
        clearTimeout(timeoutId);

        const totalIncidents = parseInt(metrics?.total || '0', 10);
        const automatedCount = parseInt(metrics?.automated_count || '0', 10);
        const avgAckTime = parseFloat(metrics?.avg_ack_time || '0');

        setStats({
          activeIncidents: Array.isArray(incidents) ? incidents.length : 0,
          onCallEngineers: onCall ? 1 : 0,
          avgResponseTime: Math.round(avgAckTime),
          automationRate: totalIncidents > 0 && automatedCount > 0
            ? Math.round((automatedCount / totalIncidents) * 100) 
            : 0
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch stats:', error);
        }
      }
    };

    // Listen for manual refresh events
    const handleRefresh = () => {
      // Add a small delay to ensure API has processed the data
      setTimeout(fetchStats, 500);
    };
    window.addEventListener('refresh-dashboard', handleRefresh);

    // Delay initial fetch slightly to ensure page renders first
    const initialTimeout = setTimeout(fetchStats, 100);
    // Then fetch every 10 seconds for real-time updates
    const interval = setInterval(fetchStats, 10000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      window.removeEventListener('refresh-dashboard', handleRefresh);
    };
  }, []);


  // Render immediately, don't wait for data
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              SRE Operations Center
            </h1>
            <p className="text-slate-600">
              Real-time incident management and team operations
            </p>
          </div>
          <button
            onClick={setupDemoData}
            disabled={isSettingUp}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSettingUp ? 'Setting up...' : 'Setup Demo Data'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Incidents"
            value={stats.activeIncidents}
            icon={<AlertCircle className="w-6 h-6" />}
            color="bg-orange-500"
          />
          <StatCard
            title="On-Call Engineers"
            value={stats.onCallEngineers}
            icon={<Users className="w-6 h-6" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Avg Response Time"
            value={`${stats.avgResponseTime}s`}
            icon={<Activity className="w-6 h-6" />}
            color="bg-green-500"
          />
          <StatCard
            title="Automation Rate"
            value={`${stats.automationRate}%`}
            icon={<CheckCircle className="w-6 h-6" />}
            color="bg-purple-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OnCallPanel />
          <IncidentsList />
          <RunbooksPanel />
          <TeamHealthPanel />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
    <div className="flex items-center justify-between mb-4">
      <span className="text-slate-600 text-sm font-medium">{title}</span>
      <div className={`${color} text-white p-3 rounded-lg shadow-md`}>
        {icon}
      </div>
    </div>
    <div className="text-3xl font-bold text-slate-900">{value}</div>
  </div>
);
