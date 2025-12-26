import React, { useState, useEffect } from 'react';
import { User, Clock } from 'lucide-react';

export const OnCallPanel: React.FC = () => {
  const [currentOnCall, setCurrentOnCall] = useState<any>(null);
  const [upcomingRotations, setUpcomingRotations] = useState<any[]>([]);

  useEffect(() => {
    // Add timeout to prevent hanging
    const fetchWithTimeout = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const [current, upcoming] = await Promise.all([
          fetch('/api/oncall/current', { signal: controller.signal }).then(r => r.json()).catch(() => null),
          fetch('/api/oncall/upcoming', { signal: controller.signal }).then(r => r.json()).catch(() => [])
        ]);
        clearTimeout(timeoutId);
        setCurrentOnCall(current);
        setUpcomingRotations(upcoming);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch on-call data:', error);
        }
      }
    };

    fetchWithTimeout();
    const interval = setInterval(fetchWithTimeout, 10000);
    
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-blue-500" />
        On-Call Rotation
      </h2>

      {/* Current On-Call */}
      {currentOnCall ? (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium mb-1">
                Currently On-Call
              </div>
              <div className="text-lg font-bold text-slate-900">
                {currentOnCall.name}
              </div>
              <div className="text-sm text-slate-600">
                {currentOnCall.timezone}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600">Recent Incidents</div>
              <div className="text-2xl font-bold text-blue-600">
                {currentOnCall.recent_incidents || 0}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
          <div className="text-sm text-slate-600">
            No active on-call schedule. Generating rotation...
          </div>
        </div>
      )}

      {/* Upcoming Rotations */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Upcoming Schedule
        </h3>
        {upcomingRotations.slice(0, 5).map((rotation, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
          >
            <div>
              <div className="font-medium text-slate-900">{rotation.name}</div>
              <div className="text-xs text-slate-600">{rotation.timezone}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">
                {new Date(rotation.start_time).toLocaleDateString()}
              </div>
              <div className="text-xs text-slate-500">
                {new Date(rotation.start_time).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
