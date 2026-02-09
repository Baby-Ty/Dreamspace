import { useCallback, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';

// Global lock to prevent multiple concurrent refresh attempts
let refreshInProgress = false;
let refreshPromise = null;

/**
 * Hook for managing authentication tokens
 * Provides token getters for Microsoft Graph API and backend API
 */
export function useTokens() {
  const { instance, accounts } = useMsal();
  const logoutCallbackRef = useRef(null);

  /**
   * Get access token for Microsoft Graph API
   * @returns {Promise<string|null>} Access token or null
   */
  const getToken = useCallback(async () => {
    if (accounts.length === 0) {
      return null;
    }
    
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });
      return response.accessToken;
    } catch (error) {
      console.error('Failed to acquire token:', error);
      return null;
    }
  }, [accounts, instance]);

  /**
   * Get ID token for our backend API
   * The ID token has audience = our client ID, suitable for our own API validation
   * @returns {Promise<string|null>} ID token or null
   */
  const getApiToken = useCallback(async () => {
    if (accounts.length === 0) {
      return null;
    }
    
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });
      return response.idToken;
    } catch (error) {
      console.error('Failed to acquire API token:', error);
      return null;
    }
  }, [accounts, instance]);

  /**
   * Set the logout callback to be called when token refresh fails completely
   * @param {Function} callback - Logout callback function
   */
  const setLogoutCallback = useCallback((callback) => {
    logoutCallbackRef.current = callback;
  }, []);

  /**
   * Refresh API token with fallback to interactive login
   * Attempts silent refresh first, falls back to popup if needed
   * Uses locking to prevent multiple concurrent refresh attempts
   * @returns {Promise<boolean>} True if token was refreshed successfully
   */
  const refreshApiToken = useCallback(async () => {
    // If refresh is already in progress, wait for it to complete
    if (refreshInProgress && refreshPromise) {
      console.log('🔄 Token refresh already in progress, waiting...');
      return await refreshPromise;
    }

    if (accounts.length === 0) {
      console.warn('Cannot refresh token: No accounts available');
      return false;
    }

    // Set lock and create promise
    refreshInProgress = true;
    refreshPromise = (async () => {
      try {
        // First attempt: Silent token acquisition
        console.log('🔄 Attempting silent token refresh...');
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
          forceRefresh: true  // Force refresh to get new token
        });
        
        if (response.idToken) {
          console.log('✅ Token refreshed silently');
          return true;
        }
        
        console.warn('Silent refresh returned no token, trying interactive login...');
      } catch (silentError) {
        console.warn('Silent token refresh failed:', silentError.message);
        
        // Second attempt: Interactive login (popup)
        try {
          console.log('🔄 Attempting interactive token refresh (popup)...');
          const response = await instance.acquireTokenPopup({
            ...loginRequest,
            account: accounts[0]
          });
          
          if (response.idToken) {
            console.log('✅ Token refreshed via popup');
            return true;
          }
        } catch (popupError) {
          console.error('Interactive token refresh failed:', popupError.message);
          
          // If popup was blocked, suggest redirect (but don't do it automatically)
          if (popupError.errorCode === 'popup_window_error' || 
              popupError.message?.includes('popup')) {
            console.warn('Popup blocked. User may need to allow popups or refresh the page.');
          }
        }
      }
      
      // If we get here, both silent and interactive refresh failed
      console.error('❌ Token refresh completely failed. Triggering logout...');
      
      // Trigger logout if callback is set
      if (logoutCallbackRef.current) {
        setTimeout(() => {
          logoutCallbackRef.current();
        }, 1000);
      }
      
      return false;
    })();

    try {
      return await refreshPromise;
    } finally {
      // Release lock
      refreshInProgress = false;
      refreshPromise = null;
    }
  }, [accounts, instance]);

  return { getToken, getApiToken, refreshApiToken, setLogoutCallback };
}
