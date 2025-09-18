import React from 'react';
import { Region } from '../../types';

interface Props {
  regions: Region[];
}

export const RegionStatus: React.FC<Props> = ({ regions }) => {
  const getStatusColor = (status: Region['status']) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'DEGRADED': return 'bg-yellow-500';
      case 'PARTITIONED': return 'bg-red-500';
      case 'OFFLINE': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Region Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {regions.map(region => (
          <div key={region.id} className="border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{region.name}</h4>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(region.status)}`} />
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Location: {region.location}</div>
              <div>Latency: {region.latency}ms</div>
              <div>Conflict Rate: {(region.conflictRate * 100).toFixed(1)}%</div>
              <div>Last Sync: {Math.floor((Date.now() - region.lastSync) / 1000)}s ago</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
