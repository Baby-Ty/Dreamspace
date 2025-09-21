import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest, graphConfig } from '../auth/authConfig';
// Import mock data only for demo mode
import { allUsers, currentUser } from '../data/mockData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Redirect handling is now done in main.jsx during MSAL initialization

  useEffect(() => {
    // Skip MSAL account checking if we're in demo mode
    if (isDemoMode) {
      return;
    }
    
    console.log('🔍 Auth Debug:', { 
      accountsLength: accounts.length, 
      inProgress, 
      isDemoMode 
    });
    
    // Don't process accounts while MSAL operations are in progress
    if (inProgress !== 'none') {
      console.log('⏳ MSAL operation in progress:', inProgress);
      return;
    }
    
    if (accounts.length > 0) {
      const account = accounts[0];
      console.log('👤 Found account:', account.username);
      fetchUserProfile(account);
    } else {
      console.log('❌ No accounts found');
      setIsLoading(false);
    }
  }, [accounts, isDemoMode, inProgress]);

  const fetchUserProfile = async (account) => {
    try {
      console.log('🔄 Fetching user profile for:', account.username);
      setIsLoading(true);
      
      // Get access token for Microsoft Graph
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: account
      });
      
      console.log('✅ Token acquired successfully');

      // Call Microsoft Graph to get user profile
      const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
        headers: {
          'Authorization': `Bearer ${response.accessToken}`
        }
      });

      if (graphResponse.ok) {
        const profileData = await graphResponse.json();
        
        // Try to get user photo
        let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName)}&background=EC4B5C&color=fff&size=100`;
        try {
          const photoResponse = await fetch(graphConfig.graphPhotoEndpoint, {
            headers: {
              'Authorization': `Bearer ${response.accessToken}`
            }
          });
          if (photoResponse.ok) {
            const photoBlob = await photoResponse.blob();
            avatarUrl = URL.createObjectURL(photoBlob);
          }
        } catch (photoError) {
          console.log('No profile photo available, using generated avatar');
        }

        // For real Microsoft users, don't use mock data - create fresh profile
        // Mock data is only for demo mode
        const userData = {
         id: account.localAccountId || account.username,
          name: profileData.displayName,
          email: profileData.mail || profileData.userPrincipalName,
          office: determineOfficeFromProfile(profileData),
          avatar: avatarUrl,
          dreamBook: [],
          careerGoals: [],
          developmentPlan: [],
          score: 0,
          connects: [],
          dreamCategories: [],
          dreamsCount: 0,
          connectsCount: 0
        };

        // Get roles from the ID token (Entra App Roles)
        const userRole = determineUserRoleFromToken(account, profileData, userData);

        setUser(userData);
        setUserRole(userRole);
        
        console.log('User authenticated:', userData, 'Role:', userRole);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      
      // If token acquisition fails, try interactive login
      if (error.name === 'InteractionRequiredAuthError') {
        console.log('🔄 Interaction required, trying popup login...');
        try {
          await instance.loginPopup(loginRequest);
          // After successful popup login, the useEffect will be triggered again
          return;
        } catch (popupError) {
          console.error('❌ Popup login failed:', popupError);
        }
      }
      
      // Fallback to basic account info
      const basicUser = {
        id: Date.now(),
        name: account.name,
        email: account.username,
        office: 'Remote',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=EC4B5C&color=fff&size=100`,
        dreamBook: [],
        careerGoals: [],
        developmentPlan: [],
        score: 0,
        connects: [],
        dreamCategories: [],
        dreamsCount: 0,
        connectsCount: 0
      };
      setUser(basicUser);
      setUserRole(determineUserRoleFromToken(account, null, basicUser));
    } finally {
      setIsLoading(false);
    }
  };

  const determineOfficeFromProfile = (profile) => {
    // Logic to determine office based on profile
    if (profile.officeLocation) return profile.officeLocation;
    if (profile.city) return profile.city;
    if (profile.country === 'South Africa') {
      return 'Cape Town'; // Default for SA users
    }
    return 'Remote';
  };

  const determineUserRoleFromToken = (account, profile, userData) => {
    try {
      // Sarah Johnson admin override only applies in demo mode
      if (isDemoMode && userData.id === 1) return 'admin';
      
      // Get roles from the ID token claims (Entra App Roles)
      const idTokenClaims = account?.idTokenClaims;
      const roles = idTokenClaims?.roles || [];
      
      console.log('User roles from Entra ID:', roles);
      
      // Map Entra roles to application roles
      // Priority order: admin > manager > coach > employee
      if (roles.includes('DreamSpace.Admin') || roles.includes('Admin')) {
        return 'admin';
      } else if (roles.includes('DreamSpace.Manager') || roles.includes('Manager')) {
        return 'manager';
      } else if (roles.includes('DreamSpace.Coach') || roles.includes('Coach')) {
        return 'coach';
      }
      
      // Fallback to job title-based logic if no app roles are assigned
      if (profile) {
        const jobTitle = profile.jobTitle?.toLowerCase() || '';
        const department = profile.department?.toLowerCase() || '';
        
        if (jobTitle.includes('admin') || jobTitle.includes('administrator')) {
          return 'admin';
        } else if (jobTitle.includes('manager') || jobTitle.includes('lead') || department.includes('management')) {
          return 'manager';
        } else if (jobTitle.includes('coach') || jobTitle.includes('mentor')) {
          return 'coach';
        }
      }
      
      // Default role
      return 'employee';
    } catch (error) {
      console.error('Error determining user role:', error);
      return 'employee';
    }
  };

  const login = async (isDemo = false) => {
    try {
      console.log('🔄 Login attempt:', { isDemo });
      setIsLoading(true);
      
      if (isDemo) {
        // Demo login - use Sarah Johnson's data from mockData
        console.log('👤 Demo login');
        setIsDemoMode(true);
        setUser(currentUser);
        setUserRole('admin'); // Sarah is an admin in the demo
        setIsLoading(false);
        return;
      }
      
      // Regular Microsoft login
      console.log('🔐 Starting Microsoft login...');
      setIsDemoMode(false);
      
      // Try popup login with simplified configuration
      const result = await instance.loginPopup({
        scopes: ["User.Read"],
        prompt: "select_account"
      });
      console.log('✅ Login popup completed:', result);
      
      // The useEffect will handle the account processing
    } catch (error) {
      console.error('❌ Login failed:', error);
      setIsLoading(false);
      
      // Provide more specific error information
      if (error.errorCode === 'user_cancelled') {
        console.log('ℹ️ User cancelled login');
      } else if (error.errorCode === 'popup_window_error') {
        console.log('⚠️ Popup blocked or failed to open');
      }
    }
  };

  const logout = async () => {
    try {
      // Check if this is a demo user
      if (isDemoMode) {
        // Demo user logout - just clear state
        setUser(null);
        setUserRole(null);
        setIsDemoMode(false);
        return;
      }
      
      // Regular Microsoft logout
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin
      });
      setUser(null);
      setUserRole(null);
      setIsDemoMode(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    userRole,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
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
