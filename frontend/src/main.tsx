import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './components/ui/Toast';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  </React.StrictMode>,
);
