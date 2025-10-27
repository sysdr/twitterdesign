import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SearchInterface } from './components/Search/SearchInterface';
import './App.css';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchInterface />
    </QueryClientProvider>
  );
};

export default App;

