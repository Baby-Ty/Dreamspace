import { config } from '../utils/env.js';

// MSAL configuration - improved for better reliability
// Determine the correct redirect URI based on environment
const getRedirectUri = () => {
  // Production domain
  if (window.location.hostname === 'dreamspace.tylerstewart.co.za') {
    return 'https://dreamspace.tylerstewart.co.za';
  }
  // Azure Static Web Apps domain
  if (window.location.hostname.includes('azurestaticapps.net')) {
    return window.location.origin;
  }
  // GitHub Pages domain  
  if (window.location.hostname.includes('github.io')) {
    return window.location.origin;
  }
  // Local development
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5173'; // Vite default port
  }
  // Fallback to current origin
  return window.location.origin;
};

// Get authority URL based on tenant ID from environment
const getAuthority = () => {
  const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
  if (tenantId) {
    return `https://login.microsoftonline.com/${tenantId}`;
  }
  // Fallback to common endpoint (multi-tenant) - works but less secure than tenant-specific
  console.warn('⚠️ VITE_AZURE_TENANT_ID not set. Using common endpoint (multi-tenant).');
  return 'https://login.microsoftonline.com/common';
};

// Get client ID from environment - REQUIRED in production
const getClientId = () => {
  const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
  if (!clientId) {
    const errorMsg = '❌ VITE_AZURE_CLIENT_ID is required. Set it in your .env file or deployment configuration.';
    console.error(errorMsg);
    // In production, this will cause MSAL initialization to fail with a clear error
    // In development, we throw to catch the issue early
    if (import.meta.env.DEV) {
      throw new Error(errorMsg);
    }
  }
  return clientId;
};

export const msalConfig = {
  auth: {
    // Client ID from environment variable - required for proper tenant isolation
    clientId: getClientId(),
    authority: getAuthority(), 
    redirectUri: getRedirectUri(),
    postLogoutRedirectUri: getRedirectUri(),
    navigateToLoginRequestUrl: false, // Avoid redirect loops
  },
  cache: {
    cacheLocation: "sessionStorage", // Use sessionStorage for better security
    storeAuthStateInCookie: false, // Set to true if you have issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // LogLevel.Error
            console.error('MSAL Error:', message);
            return;
          case 1: // LogLevel.Warning
            console.warn('MSAL Warning:', message);
            return;
          case 2: // LogLevel.Info
            console.info('MSAL Info:', message);
            return;
          case 3: // LogLevel.Verbose
            console.debug('MSAL Debug:', message);
            return;
        }
      }
    }
  }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
  scopes: ["User.Read", "profile", "openid", "email", "Calendars.ReadWrite"],
  redirectUri: getRedirectUri(), // Ensure consistent redirect URI
  prompt: "select_account" // Always show account picker for better UX
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphPhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value"
};
