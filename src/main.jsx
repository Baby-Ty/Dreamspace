import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './auth/authConfig';
import App from './App.jsx'
import './index.css'

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL instance before rendering
const initializeMsal = async () => {
  try {
    console.log('🔄 Initializing MSAL...');
    await msalInstance.initialize();
    console.log('✅ MSAL initialized successfully');
    
    // Handle redirect promise after initialization
    try {
      const response = await msalInstance.handleRedirectPromise();
      if (response) {
        console.log('✅ Redirect response handled during initialization:', response);
      }
    } catch (redirectError) {
      console.error('❌ Error handling redirect during initialization:', redirectError);
    }
    
    // Render the app after MSAL is initialized
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('❌ MSAL initialization failed:', error);
    // Render app anyway with error state
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Authentication Error</h2>
          <p>Failed to initialize Microsoft authentication. Please refresh the page.</p>
          <pre>{error.message}</pre>
        </div>
      </React.StrictMode>,
    );
  }
};

// Start the initialization process
initializeMsal();