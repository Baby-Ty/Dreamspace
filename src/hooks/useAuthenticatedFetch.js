// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useCallback } from 'react';
import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';

export function useAuthenticatedFetch(getToken) {
  return useCallback(async (url, opts = {}) => {
    try {
      // Get the token
      const token = await getToken();
      
      // Inject Authorization header
      const headers = {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      // Make the request
      const response = await fetch(url, {
        ...opts,
        headers
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        
        return fail(
          `HTTP_${response.status}`,
          `${response.status}: ${response.statusText}`,
          errorData
        );
      }
      
      // Parse JSON response
      const data = await response.json();
      return ok(data);
      
    } catch (error) {
      return fail(ERR.NETWORK, error.message || 'Network request failed');
    }
  }, [getToken]);
}
