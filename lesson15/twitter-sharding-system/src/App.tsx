import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ShardDashboard from './components/dashboard/ShardDashboard';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000, // Refresh every 5 seconds
      staleTime: 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Twitter Sharding System
                </h1>
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Lesson 15
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Real-time Database Sharding Monitor
              </div>
            </div>
          </div>
        </header>
        <main>
          <ShardDashboard />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;