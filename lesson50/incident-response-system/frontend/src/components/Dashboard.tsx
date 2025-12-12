import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import type { Incident, Metrics } from '../types';

const API_BASE = 'http://localhost:3050/api';

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    fetchIncidents();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchIncidents();
      fetchMetrics();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE}/incidents`);
      const data = await res.json();
      setIncidents(data);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/metrics`);
      const data = await res.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'detected': 'bg-yellow-100 text-yellow-800',
      'classified': 'bg-blue-100 text-blue-800',
      'remediating': 'bg-purple-100 text-purple-800',
      'escalation_pending': 'bg-orange-100 text-orange-800',
      'escalated': 'bg-red-100 text-red-800',
      'resolved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'P0': 'border-red-500 bg-gradient-to-r from-red-50 to-red-100/50',
      'P1': 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100/50',
      'P2': 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100/50',
      'P3': 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100/50'
    };
    return colors[severity] || 'border-gray-500 bg-gradient-to-r from-gray-50 to-gray-100/50';
  };

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md shadow-xl border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-gray-900 flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Activity className="text-white" size={40} />
                </div>
                <span className="text-gray-900">
                  Incident Response System
                </span>
              </h1>
              <p className="text-gray-600 mt-2 text-xl font-semibold ml-20">Automated failure detection and remediation</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-full border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span className="text-sm font-semibold text-green-700">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <MetricCard
              icon={<Activity className="text-blue-600" size={24} />}
              label="Total Incidents (24h)"
              value={metrics.total_incidents}
              color="blue"
            />
            <MetricCard
              icon={<CheckCircle className="text-green-600" size={24} />}
              label="Auto-Resolved"
              value={`${metrics.auto_resolution_rate}%`}
              subtitle={`${metrics.auto_resolved} incidents`}
              color="green"
            />
            <MetricCard
              icon={<Clock className="text-purple-600" size={24} />}
              label="Avg MTTR"
              value={`${metrics.avg_mttr_seconds}s`}
              subtitle="Mean Time To Recovery"
              color="purple"
            />
            <MetricCard
              icon={<Users className="text-orange-600" size={24} />}
              label="Escalated"
              value={metrics.escalated_count}
              subtitle="Required human intervention"
              color="orange"
            />
          </div>
        )}

        {/* Active Incidents Panel */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/60 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-lg">
                <AlertTriangle className="text-white" size={28} />
              </div>
              <span>Active Incidents</span>
              <span className="px-4 py-1 bg-red-100 text-red-700 rounded-full text-lg font-bold border-2 border-red-300">
                {activeIncidents.length}
              </span>
            </h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700">Auto-refreshing every 5s</span>
            </div>
          </div>

          <div className="space-y-4">
            {activeIncidents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                <p className="text-lg">All systems operational</p>
                <p className="text-sm">No active incidents</p>
              </div>
            ) : (
              activeIncidents.map(incident => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={() => setSelectedIncident(incident)}
                  formatTime={formatTime}
                  formatDuration={formatDuration}
                  getStatusColor={getStatusColor}
                  getSeverityColor={getSeverityColor}
                />
              ))
            )}
          </div>
        </div>

        {/* Recent Resolved Incidents */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/60 p-8 hover:shadow-3xl transition-all duration-300">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg">
              <TrendingUp className="text-white" size={28} />
            </div>
            Recent Resolutions
          </h2>

          <div className="space-y-3">
            {incidents
              .filter(i => i.status === 'resolved')
              .slice(0, 10)
              .map(incident => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-300 shadow-sm cursor-pointer hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 hover:shadow-md transition-all duration-300"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle className="text-green-600" size={20} />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {incident.alert_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {incident.service} • Resolved by {incident.resolved_by}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-700">
                      {formatDuration(incident.resolved_at! - incident.created_at)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatTime(incident.resolved_at!)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Incident Details Modal */}
        {selectedIncident && (
          <IncidentDetailsModal
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
            formatTime={formatTime}
            formatDuration={formatDuration}
          />
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, subtitle, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-50 border-blue-400/60 shadow-xl hover:shadow-2xl',
    green: 'bg-gradient-to-br from-green-50 via-emerald-100/50 to-teal-50 border-green-400/60 shadow-xl hover:shadow-2xl',
    purple: 'bg-gradient-to-br from-purple-50 via-violet-100/50 to-fuchsia-50 border-purple-400/60 shadow-xl hover:shadow-2xl',
    orange: 'bg-gradient-to-br from-orange-50 via-amber-100/50 to-yellow-50 border-orange-400/60 shadow-xl hover:shadow-2xl'
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-3xl p-7 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 backdrop-blur-sm`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/60 rounded-lg shadow-sm">
          {icon}
        </div>
        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-4xl font-extrabold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-sm font-medium text-gray-600 mt-2">{subtitle}</div>}
    </div>
  );
}

function IncidentCard({ incident, onClick, formatTime, formatDuration, getStatusColor, getSeverityColor }: any) {
  const duration = incident.resolved_at 
    ? incident.resolved_at - incident.created_at 
    : Date.now() - incident.created_at;

  return (
    <div
      className={`${getSeverityColor(incident.severity)} border-l-4 rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>
              {incident.status}
            </span>
            <span className="px-2 py-1 rounded bg-gray-800 text-white text-xs font-bold">
              {incident.severity}
            </span>
            <span className="text-sm text-gray-600">#{incident.id}</span>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {incident.alert_name}
          </h3>
          
          <div className="text-sm text-gray-700 mb-3">
            <span className="font-semibold">{incident.service}</span>
            {incident.incident_type && (
              <span className="ml-3 text-gray-600">
                • Type: {incident.incident_type}
              </span>
            )}
            {incident.confidence && (
              <span className="ml-3 text-gray-600">
                • Confidence: {(incident.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          {incident.actions_taken.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {incident.actions_taken.map((action: any, i: number) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded text-xs ${
                    action.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {action.step}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatDuration(duration)}
          </div>
          <div className="text-xs text-gray-600">
            {incident.created_at && !isNaN(incident.created_at) ? (
              <>Started {formatTime(incident.created_at)}</>
            ) : (
              <span className="text-gray-400">Start time unavailable</span>
            )}
          </div>
          {incident.escalated_to && (
            <div className="mt-2 text-xs text-red-700 font-semibold">
              Escalated to {incident.escalated_to}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IncidentDetailsModal({ incident, onClose, formatTime, formatDuration }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Incident Details #{incident.id}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Alert Name</div>
                <div className="font-semibold">{incident.alert_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Service</div>
                <div className="font-semibold">{incident.service}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Severity</div>
                <div className="font-semibold">{incident.severity}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-semibold">{incident.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Incident Type</div>
                <div className="font-semibold">{incident.incident_type || 'Classifying...'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Duration</div>
                <div className="font-semibold">
                  {formatDuration(
                    (incident.resolved_at || Date.now()) - incident.created_at
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-3">
              {incident.timeline.map((event: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="text-xs text-gray-600 w-24 flex-shrink-0">
                    {formatTime(event.timestamp)}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      event.result === 'success' ? 'text-green-700' :
                      event.result === 'failure' ? 'text-red-700' :
                      'text-gray-900'
                    }`}>
                      {event.description}
                    </div>
                    {event.error && (
                      <div className="text-sm text-red-600 mt-1">{event.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          {incident.metrics && Object.keys(incident.metrics).length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Metrics</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm">{JSON.stringify(incident.metrics, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
