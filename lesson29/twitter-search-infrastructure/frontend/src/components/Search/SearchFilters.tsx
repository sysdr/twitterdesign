import React from 'react';

interface SearchFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onFiltersChange }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Media Type
        </label>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
          <option value="">All</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="gif">GIF</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verified Only
        </label>
        <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
          <option value="">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
    </div>
  );
};

