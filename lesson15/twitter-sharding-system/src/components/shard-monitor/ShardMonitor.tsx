import React from 'react';
import { Database, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ShardMonitorProps {
  shards: any[];
}

const ShardMonitor: React.FC<ShardMonitorProps> = ({ shards }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLoadColor = (load: number) => {
    if (load >= 80) return 'bg-red-500';
    if (load >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {shards.map((shard) => (
        <div key={shard.id} className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(shard.status)}
              <h3 className="ml-2 text-lg font-medium text-gray-900">{shard.name}</h3>
            </div>
            <span className={`px-2 py-1 rounded text-sm ${
              shard.status === 'healthy' ? 'bg-green-100 text-green-800' :
              shard.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {shard.status}
            </span>
          </div>
          
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>Load</span>
                <span>{Math.round(shard.load_percentage)}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getLoadColor(shard.load_percentage)}`}
                  style={{ width: `${shard.load_percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Users</span>
                <p className="font-medium">{shard.user_count.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Tweets</span>
                <p className="font-medium">{shard.tweet_count.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="pt-2 border-t text-xs text-gray-500">
              <p>Host: {shard.host}:{shard.port}</p>
              <p>Last check: {new Date(shard.last_health_check).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShardMonitor;
