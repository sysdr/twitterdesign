import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import CSS after App to prevent blocking
import './index.css';

// Add error handling
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render React app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial;">
      <h1>Error Loading Application</h1>
      <p>${String(error)}</p>
      <p>Please check the browser console for details.</p>
    </div>
  `;
}
