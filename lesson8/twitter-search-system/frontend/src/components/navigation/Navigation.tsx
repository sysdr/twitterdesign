import { BarChart3, Search, Home } from 'lucide-react';

interface NavigationProps {
  onViewChange: (view: 'dashboard' | 'search') => void;
  currentView: 'dashboard' | 'search';
}

export const Navigation: React.FC<NavigationProps> = ({ onViewChange, currentView }) => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Home className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Twitter Search</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => onViewChange('search')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'search'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Search className="h-4 w-4 inline mr-2" />
              Search
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
