import React from 'react';

interface MediaStatsProps {
  totalFiles: number;
  totalSize: string;
  fileTypes: { [key: string]: number };
}

const MediaStats: React.FC<MediaStatsProps> = ({ totalFiles, totalSize, fileTypes }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalFiles}</div>
          <div className="text-sm text-gray-600">Total Files</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalSize}</div>
          <div className="text-sm text-gray-600">Total Size</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(fileTypes).length}</div>
          <div className="text-sm text-gray-600">File Types</div>
        </div>
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">File Type Distribution</h4>
        <div className="space-y-2">
          {Object.entries(fileTypes).map(([type, count]) => (
            <div key={type} className="flex justify-between text-sm">
              <span className="text-gray-600">{type.toUpperCase()}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MediaStats;
