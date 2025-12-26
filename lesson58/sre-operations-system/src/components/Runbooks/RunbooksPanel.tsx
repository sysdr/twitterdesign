import React, { useState, useEffect } from 'react';
import { Book, Play, TrendingUp } from 'lucide-react';

export const RunbooksPanel: React.FC = () => {
  const [runbooks, setRunbooks] = useState<any[]>([]);

  useEffect(() => {
    // Add timeout to prevent hanging
    const fetchWithTimeout = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch('/api/runbooks', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        setRunbooks(data);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch runbooks:', error);
        }
      }
    };

    fetchWithTimeout();
    const interval = setInterval(fetchWithTimeout, 20000);
    
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
        <Book className="w-6 h-6 text-green-500" />
        Automated Runbooks
      </h2>

      <div className="space-y-3">
        {runbooks.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <Book className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p>No runbooks available</p>
          </div>
        ) : (
          runbooks.map((runbook) => (
          <div
            key={runbook.id}
            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-slate-900">{runbook.name}</div>
              <Play className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-sm text-slate-600 mb-3">
              {runbook.description}
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="font-medium">
                  {typeof runbook.success_rate === 'string' 
                    ? parseFloat(runbook.success_rate).toFixed(1)
                    : (runbook.success_rate ?? 0).toFixed(1)}% success
                </span>
              </span>
              <span className="text-slate-500">
                Executed {runbook.execution_count} times
              </span>
              <span className="text-slate-500">
                Avg {Math.round((typeof runbook.avg_execution_time === 'string' 
                  ? parseInt(runbook.avg_execution_time, 10) 
                  : runbook.avg_execution_time ?? 0) / 1000)}s
              </span>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
};
