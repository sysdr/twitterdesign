import React, { useState, useEffect } from 'react';
import { PhotoIcon, VideoCameraIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import MediaUpload from './upload/MediaUpload';
import MediaStats from './media/MediaStats';
import RecentUploads from './media/RecentUploads';

interface DashboardStats {
  totalMedia: number;
  totalImages: number;
  totalVideos: number;
  processingCount: number;
  storageUsed: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMedia: 0,
    totalImages: 0,
    totalVideos: 0,
    processingCount: 0,
    storageUsed: 0
  });

  useEffect(() => {
    // Simulate stats loading
    setTimeout(() => {
      setStats({
        totalMedia: 1247,
        totalImages: 892,
        totalVideos: 355,
        processingCount: 3,
        storageUsed: 2.4 // GB
      });
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Media Management Dashboard
        </h2>
        <p className="text-gray-600">
          Upload, process, and distribute media through our global CDN
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PhotoIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Images
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalImages.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <VideoCameraIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Videos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalVideos.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Processing
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.processingCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Storage Used
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.storageUsed} GB
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Quick Upload
        </h3>
        <MediaUpload 
          onUploadComplete={(media) => {
            console.log('Upload completed:', media);
            // Refresh stats
          }}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MediaStats 
          totalFiles={stats.totalImages + stats.totalVideos}
          totalSize={`${stats.storageUsed} GB`}
          fileTypes={{
            'image': stats.totalImages,
            'video': stats.totalVideos
          }}
        />
        <RecentUploads />
      </div>
    </div>
  );
};

export default Dashboard;
