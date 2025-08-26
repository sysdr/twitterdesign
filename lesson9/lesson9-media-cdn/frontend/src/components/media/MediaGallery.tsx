import React, { useState, useEffect } from 'react';
import { PhotoIcon, VideoCameraIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface MediaFile {
  id: string;
  filename: string;
  type: 'image' | 'video' | 'document';
  url: string;
  size: number;
  uploadedAt: string;
  thumbnail?: string;
}

const MediaGallery: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');

  useEffect(() => {
    // Simulate loading media files
    setTimeout(() => {
      setMediaFiles([
        {
          id: '1',
          filename: 'sample-image.jpg',
          type: 'image',
          url: '/api/media/sample-image.jpg',
          size: 1024 * 1024,
          uploadedAt: new Date().toISOString(),
          thumbnail: '/api/media/thumbnails/sample-image.jpg'
        },
        {
          id: '2',
          filename: 'sample-video.mp4',
          type: 'video',
          url: '/api/media/sample-video.mp4',
          size: 5 * 1024 * 1024,
          uploadedAt: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredFiles = mediaFiles.filter(file => 
    filter === 'all' || file.type === filter
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-blue-500" />;
      case 'video':
        return <VideoCameraIcon className="h-8 w-8 text-red-500" />;
      case 'document':
        return <DocumentIcon className="h-8 w-8 text-green-500" />;
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Media Gallery</h1>
        
        {/* Filter buttons */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'image', 'video', 'document'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No media files</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' ? 'No media files uploaded yet.' : `No ${filter} files found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mb-3">
                  Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors">
                    View
                  </button>
                  <button className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition-colors">
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
