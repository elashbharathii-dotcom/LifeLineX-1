import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeLanguageProvider, AuthProvider, EmergencyProvider } from './context/AppProviders';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeLanguageProvider>
      <AuthProvider>
        <EmergencyProvider>
          <App />
        </EmergencyProvider>
      </AuthProvider>
    </ThemeLanguageProvider>
  </React.StrictMode>
);
