// MSAL configuration that works for both development and production
export const msalConfig = {
  auth: {
    clientId: "ebe60b7a-93c9-4b12-8375-4ab3181000e8", // Your Azure client ID
    // Multi-tenant: allows users from any Azure AD tenant
    authority: "https://login.microsoftonline.com/common", 
    // Single-tenant (original): authority: "https://login.microsoftonline.com/fe3fb5c4-c612-405e-bee1-60ba20a1bdff",
    redirectUri: window.location.origin, // Dynamically uses current origin (localhost:5173 or production URL)
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
  scopes: ["User.Read", "profile", "openid", "email"],
  // Request roles claim in the token
  extraQueryParameters: {
    claims: JSON.stringify({
      id_token: {
        roles: null
      }
    })
  }
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphPhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value"
};
