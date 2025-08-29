import { useState } from 'react';
import { SearchBar } from './components/search/SearchBar';
import { Dashboard } from './components/dashboard/Dashboard';
import { Navigation } from './components/navigation/Navigation';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'search'>('dashboard');

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results);
      setCurrentView('search'); // Switch to search view after search
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewChange = (view: 'dashboard' | 'search') => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onViewChange={handleViewChange} currentView={currentView} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' ? (
          <Dashboard />
        ) : (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-center mb-8">Twitter Search & Discovery</h1>
              <SearchBar onSearch={handleSearch} />
            </div>
            
            {isSearching && <p className="text-center mt-4">Searching...</p>}
            
            {searchResults.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Search Results</h2>
                {searchResults.map((result: any) => (
                  <div key={result.id} className="bg-white p-4 rounded-lg shadow mb-4">
                    <p>{result.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
