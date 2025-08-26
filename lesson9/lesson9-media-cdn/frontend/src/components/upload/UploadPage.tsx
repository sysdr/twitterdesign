import React from 'react';
import MediaUpload from './MediaUpload';

const UploadPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Media Files
          </h1>
          <p className="text-lg text-gray-600">
            Upload your images, videos, and documents to the Twitter Media CDN
          </p>
        </div>
        
        <MediaUpload />
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Supported File Types
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>Images:</strong> JPG, PNG, GIF, WebP (max 10MB)
            </div>
            <div>
              <strong>Videos:</strong> MP4, MOV, AVI (max 100MB)
            </div>
            <div>
              <strong>Documents:</strong> PDF, DOC, TXT (max 25MB)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
