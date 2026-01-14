import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { GraphService } from '../services/graphService';
import { apiClient } from '../services/apiClient';

// Import split modules for single responsibility
import { useTokens } from '../auth/useTokens';
import { useUserProfile } from '../auth/useUserProfile';
import { determineUserRole } from '../auth/roleUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);

  // Use token management hook
  const { getToken, getApiToken } = useTokens();

  // Wire up apiClient when MSAL auth succeeds (accounts populated)
  // This MUST run before fetchUserProfile so API calls are authenticated
  useEffect(() => {
    if (accounts.length > 0 && getApiToken) {
      apiClient.setTokenGetter(getApiToken);
      console.log('🔐 API Client wired with authentication token');
    }
  }, [accounts.length, getApiToken]);

  // Create authenticated fetch and graph service
  const authedFetch = useAuthenticatedFetch(getToken);
  const graph = useMemo(() => GraphService(authedFetch, getToken, getApiToken), [authedFetch, getToken, getApiToken]);

  // Use user profile management hook
  const { fetchUserProfile, createFallbackUser, refreshFromDatabase } = useUserProfile(graph);

  // Handle account changes and fetch profile
  useEffect(() => {
    console.log('🔄 AuthContext useEffect:', { 
      accountsLength: accounts.length, 
      inProgress, 
      isLoading 
    });
    
    if (accounts.length > 0) {
      const account = accounts[0];
      console.log('👤 Found MSAL account:', account.name);
      handleFetchUserProfile(account);
    } else if (inProgress === 'none') {
      console.log('🏁 No accounts found and MSAL not in progress, setting loading to false');
      setIsLoading(false);
    }
  }, [accounts, inProgress]);

  // Fetch user profile and set state
  const handleFetchUserProfile = async (account) => {
    try {
      setIsLoading(true);
      
      const userData = await fetchUserProfile(account);
      const role = determineUserRole(account, null, userData);

      setUser(userData);
      setUserRole(role);
      console.log('✅ User profile setup completed with', userData.dreamBook?.length || 0, 'dreams');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to basic account info
      const basicUser = createFallbackUser(account);
      setUser(basicUser);
      setUserRole(determineUserRole(account, null, basicUser));
      console.log('✅ Basic user setup completed');
    } finally {
      console.log('🏁 Finishing user profile fetch');
      setIsLoading(false);
    }
  };

  // Login handler
  const login = async () => {
    try {
      setIsLoading(true);
      setLoginError(null);
      
      // Try popup first, fallback to redirect if popup is blocked
      try {
        await instance.loginPopup(loginRequest);
      } catch (popupError) {
        if (popupError.errorCode === 'popup_window_error' || 
            popupError.message?.includes('popup') || 
            popupError.name === 'BrowserAuthError') {
          console.log('Popup blocked, trying redirect...');
          setLoginError('Popup was blocked. Redirecting to login page...');
          setTimeout(() => instance.loginRedirect(loginRequest), 2000);
          return;
        }
        throw popupError;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(getLoginErrorMessage(error));
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      apiClient.clearTokenGetter();
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin
      });
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Refresh user role from database (useful after promotions)
  const refreshUserRole = useCallback(async () => {
    // Prevent loops with timestamp check
    const roleUpdateTimestamp = sessionStorage.getItem('roleUpdateInProgress');
    if (roleUpdateTimestamp) {
      const elapsed = Date.now() - parseInt(roleUpdateTimestamp, 10);
      if (elapsed < 5000) {
        console.log('⏭️ Role update in progress, skipping refresh...', { elapsed });
        return;
      }
      sessionStorage.removeItem('roleUpdateInProgress');
    }
    
    if (!user?.id) {
      console.warn('No user ID available for refresh');
      return;
    }
    
    try {
      const updatedUser = await refreshFromDatabase(user.id, user);
      if (updatedUser) {
        const newRole = determineUserRole(accounts[0], null, updatedUser);
        console.log('✅ User role refreshed:', { oldRole: userRole, newRole });
        setUser(updatedUser);
        setUserRole(newRole);
        return { success: true, role: newRole };
      }
      return { success: false, error: 'Failed to load user data' };
    } catch (error) {
      console.error('❌ Error refreshing user role:', error);
      return { success: false, error: error.message };
    }
  }, [user, accounts, userRole, refreshFromDatabase]);

  // Refresh user role when window regains focus
  useEffect(() => {
    const handleFocus = async () => {
      if (user?.id && accounts.length > 0) {
        console.log('🔄 Window regained focus, checking for role updates...');
        await refreshUserRole();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, accounts, refreshUserRole]);

  const value = {
    user,
    userRole,
    isAuthenticated: !!user,
    isLoading,
    loginError,
    login,
    logout,
    refreshUserRole,
    clearLoginError: () => setLoginError(null),
    getToken,
    getApiToken,
    graph
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper: Get user-friendly login error message
function getLoginErrorMessage(error) {
  if (error.errorCode === 'user_cancelled') {
    return 'Login was cancelled. Please try again when ready.';
  } else if (error.errorCode === 'network_error') {
    return 'Network error. Please check your connection and try again.';
  } else if (error.errorCode === 'invalid_client') {
    return 'Configuration error. Please contact support.';
  } else if (error.message?.includes('AADSTS')) {
    return 'Microsoft authentication error. Please try again or contact your IT administrator.';
  }
  return 'Login failed. Please try again.';
}
