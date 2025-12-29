import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './components/Dashboard/Dashboard';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);
