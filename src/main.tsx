import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import { Toaster } from './app/components/ui/sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--card)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
      }}
    />
  </React.StrictMode>
);
