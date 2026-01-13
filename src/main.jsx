import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './auth/authConfig';
import App from './App.jsx'
import './index.css'
// Initialize Application Insights monitoring
import './config/appInsights';
// Initialize logger with appropriate level for environment
import { setLogLevel, LogLevel, logger } from './utils/logger';

// Set log level based on environment (DEBUG in dev, WARN in prod)
if (import.meta.env.PROD) {
  setLogLevel(LogLevel.WARN); // Only show warnings and errors in production
}

// These console.log calls will be stripped in production builds by esbuild
console.log('🚀 Initializing DreamSpace App...');
console.log('MSAL Config:', { 
  clientId: msalConfig.auth.clientId, 
  redirectUri: msalConfig.auth.redirectUri,
  authority: msalConfig.auth.authority
});

let msalInstance;
try {
  msalInstance = new PublicClientApplication(msalConfig);
  console.log('✅ MSAL instance created successfully');
} catch (error) {
  console.error('❌ Failed to create MSAL instance:', error);
  throw error;
}

// Add error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Use logger for structured error tracking (goes to App Insights in prod)
    logger.critical('app', 'React component error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1>Something went wrong</h1>
          <details>
            <summary>Error details (for debugging)</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button onClick={() => window.location.reload()}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)