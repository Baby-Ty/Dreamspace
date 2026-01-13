import { useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';

/**
 * Hook for managing authentication tokens
 * Provides token getters for Microsoft Graph API and backend API
 */
export function useTokens() {
  const { instance, accounts } = useMsal();

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

  return { getToken, getApiToken };
}
