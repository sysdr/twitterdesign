import React, { useState, useEffect } from 'react';
import { Clock, Zap, Target } from 'lucide-react';

interface PerformanceMetric {
  timestamp: Date;
  responseTime: number;
  requestsPerSecond: number;
  successRate: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [currentRPS, setCurrentRPS] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    // Simulate performance monitoring
    const interval = setInterval(() => {
      const now = new Date();
      const responseTime = Math.random() * 100 + 20; // 20-120ms
      const rps = Math.random() * 50 + 10; // 10-60 RPS
      const successRate = 95 + Math.random() * 5; // 95-100%

      const newMetric: PerformanceMetric = {
        timestamp: now,
        responseTime,
        requestsPerSecond: rps,
        successRate,
      };

      setMetrics(prev => [...prev.slice(-19), newMetric]); // Keep last 20 points
      setCurrentRPS(rps);
      setRequestCount(prev => prev + Math.floor(rps));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const avgResponseTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length 
    : 0;

  const avgSuccessRate = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
    : 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Zap className="mr-2" size={20} />
        Performance Monitor
      </h3>

      <div className="space-y-4">
        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="text-orange-600 mr-3" size={24} />
              <div>
                <p className="font-semibold text-orange-900">Avg Response Time</p>
                <p className="text-sm text-orange-600">Last 20 requests</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-orange-600">
              {avgResponseTime.toFixed(0)}ms
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center">
              <Target className="text-indigo-600 mr-3" size={24} />
              <div>
                <p className="font-semibold text-indigo-900">Current RPS</p>
                <p className="text-sm text-indigo-600">Requests per second</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-indigo-600">
              {currentRPS.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="pt-4 border-t">
          <div className="mb-2 text-sm font-medium text-gray-700">Response Time Trend</div>
          <div className="h-24 flex items-end space-x-1">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="flex-1 bg-twitter-blue rounded-t-sm"
                style={{
                  height: `${(metric.responseTime / 150) * 100}%`,
                  minHeight: '2px',
                }}
                title={`${metric.responseTime.toFixed(1)}ms at ${metric.timestamp.toLocaleTimeString()}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0ms</span>
            <span>150ms</span>
          </div>
        </div>

        {/* Performance Targets */}
        <div className="pt-4 border-t space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Target Response Time:</span>
            <span className={`font-semibold ${avgResponseTime < 100 ? 'text-green-600' : 'text-red-600'}`}>
              &lt; 100ms {avgResponseTime < 100 ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Target Throughput:</span>
            <span className={`font-semibold ${currentRPS > 100 ? 'text-green-600' : 'text-yellow-600'}`}>
              100+ RPS {currentRPS > 100 ? '✓' : '○'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Success Rate:</span>
            <span className={`font-semibold ${avgSuccessRate > 99 ? 'text-green-600' : 'text-yellow-600'}`}>
              {avgSuccessRate.toFixed(1)}% {avgSuccessRate > 99 ? '✓' : '○'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Requests:</span>
            <span className="font-mono text-gray-900">{requestCount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
