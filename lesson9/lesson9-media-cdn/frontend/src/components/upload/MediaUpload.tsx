import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, XMarkIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { uploadMedia } from '../../services/mediaService';

interface MediaFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  mediaId?: string;
  error?: string;
}

interface MediaUploadProps {
  onUploadComplete?: (media: any) => void;
  maxFiles?: number;
  accept?: string[];
}

const MediaUpload: React.FC<MediaUploadProps> = ({ 
  onUploadComplete,
  maxFiles = 10,
  accept = ['image/*', 'video/*']
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Start uploads
    newFiles.forEach(fileItem => {
      uploadFile(fileItem);
    });
  }, []);

  const uploadFile = async (fileItem: MediaFile) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploading' }
          : f
      ));

      const result = await uploadMedia(fileItem.file, 'user123', (progress) => {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, progress }
            : f
        ));
      });

      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'processing', mediaId: result.id, progress: 100 }
          : f
      ));

      // Poll for processing completion
      pollProcessingStatus(fileItem.id, result.id);

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'error', error: (error as Error).message }
          : f
      ));
    }
  };

  const pollProcessingStatus = async (fileId: string, mediaId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/media/${mediaId}/status`);
        const data = await response.json();

        if (data.status === 'ready') {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'complete' }
              : f
          ));
          
          if (onUploadComplete) {
            const mediaResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/media/${mediaId}`);
            const mediaData = await mediaResponse.json();
            onUploadComplete(mediaData);
          }
          return;
        }

        if (data.status === 'failed') {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error', error: 'Processing failed' }
              : f
          ));
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error', error: 'Processing timeout' }
              : f
          ));
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: 'Status check failed' }
            : f
        ));
      }
    };

    poll();
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    maxSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '52428800') // 50MB
  });

  const getStatusColor = (status: MediaFile['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'uploading': return 'text-blue-500';
      case 'processing': return 'text-yellow-500';
      case 'complete': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: MediaFile['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'uploading': return 'Uploading';
      case 'processing': return 'Processing';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select files'
          }
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports images and videos up to 50MB
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Upload Progress</h4>
          {files.map((fileItem) => (
            <div key={fileItem.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    {fileItem.file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(fileItem.file)}
                        alt={fileItem.file.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        <VideoCameraIcon className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileItem.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${getStatusColor(fileItem.status)}`}>
                        {getStatusText(fileItem.status)}
                      </span>
                      {fileItem.error && (
                        <span className="text-xs text-red-500">
                          - {fileItem.error}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {(fileItem.status === 'uploading' || fileItem.status === 'processing') && (
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileItem.progress}%` }}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
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

export default MediaUpload;
