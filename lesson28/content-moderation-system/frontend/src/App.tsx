import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ModerationQueue from './components/ModerationQueue';
import Appeals from './components/Appeals';
import Analytics from './components/Analytics';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/queue" element={<ModerationQueue />} />
              <Route path="/appeals" element={<Appeals />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </main>
          <ToastContainer position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
