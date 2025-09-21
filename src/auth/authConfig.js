// MSAL configuration that works for both development and production
export const msalConfig = {
  auth: {
    clientId: "ebe60b7a-93c9-4b12-8375-4ab3181000e8", // Your Azure client ID
    // Multi-tenant: allows users from any Azure AD tenant
    authority: "https://login.microsoftonline.com/common", 
    // Single-tenant (original): authority: "https://login.microsoftonline.com/fe3fb5c4-c612-405e-bee1-60ba20a1bdff",
    redirectUri: window.location.origin, // Dynamically uses current origin (localhost:5173 or production URL)
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false, // Prevents issues with SPA redirects
  },
  cache: {
    cacheLocation: "localStorage", // Changed from sessionStorage to localStorage for better persistence
    storeAuthStateInCookie: true, // Enable cookie storage for better compatibility
  },
  system: {
    allowNativeBroker: false, // Disables WAM Broker
    windowHashTimeout: 60000, // Increase timeout for popup windows
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case "Error":
            console.error('[MSAL Error]', message);
            return;
          case "Info":
            console.info('[MSAL Info]', message);
            return;
          case "Verbose":
            console.debug('[MSAL Verbose]', message);
            return;
          case "Warning":
            console.warn('[MSAL Warning]', message);
            return;
        }
      },
      logLevel: "Info" // Enable more detailed logging
    }
  }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
  scopes: ["User.Read"],
  // Simplified request without extra parameters to avoid SPA client-type issues
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphPhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value"
};
