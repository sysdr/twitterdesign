import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TweetDashboard } from './components/Dashboard/TweetDashboard';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-twitter-blue">
              Twitter Clone - Tweet Storage & Retrieval
            </h1>
            <p className="text-gray-600 mt-1">
              Lesson 2: Production-ready tweet storage system
            </p>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <TweetDashboard />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
