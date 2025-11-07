import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';
import databaseService from '../services/databaseService';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { GraphService } from '../services/graphService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);

  // Token getter function (memoized to prevent unnecessary re-renders)
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

  // Create authenticated fetch and graph service
  const authedFetch = useAuthenticatedFetch(getToken);
  const graph = useMemo(() => GraphService(authedFetch, getToken), [authedFetch, getToken]);

  useEffect(() => {
    console.log('🔄 AuthContext useEffect:', { 
      accountsLength: accounts.length, 
      inProgress, 
      isLoading 
    });
    
    if (accounts.length > 0) {
      const account = accounts[0];
      console.log('👤 Found MSAL account:', account.name);
      fetchUserProfile(account);
    } else if (inProgress === 'none') {
      console.log('🏁 No accounts found and MSAL not in progress, setting loading to false');
      setIsLoading(false);
    }
  }, [accounts, inProgress]);

  const fetchUserProfile = async (account) => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching user profile for:', account.name);
      
      // Call Microsoft Graph to get user profile using graph service
      console.log('📞 Calling Microsoft Graph API...');
      const profileResult = await graph.getMe();

      if (profileResult.success) {
        const profileData = profileResult.data;
        
        // Try to upload user photo to blob storage
        let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.displayName)}&background=EC4B5C&color=fff&size=100`;
        const userId = profileData.userPrincipalName || profileData.mail || account.username;
        
        console.log('📸 Attempting to upload profile picture to blob storage...');
        const uploadResult = await graph.uploadMyPhotoToStorage(userId);
        if (uploadResult.success && uploadResult.data) {
          avatarUrl = uploadResult.data;
          console.log('✅ Profile picture uploaded to blob storage:', avatarUrl);
        } else {
          console.log('ℹ️ No profile photo available from Microsoft 365, using generated avatar');
        }

        // Create fresh profile for authenticated users
        // Note: dreamCategories will be populated from global data in AppContext
        let userData = {
          id: profileData.userPrincipalName || profileData.mail || account.username,
          aadObjectId: account.localAccountId,
          name: profileData.displayName,
          email: profileData.mail || profileData.userPrincipalName,
          office: determineOfficeFromProfile(profileData),
          avatar: avatarUrl,
          dreamBook: [],
          careerGoals: [],
          developmentPlan: [],
          score: 0,
          connects: [],
          dreamsCount: 0,
          connectsCount: 0
        };

        // Check if user data already exists before creating new profile
        try {
          console.log('🔄 Checking for existing user data in database...');
          const existingData = await databaseService.loadUserData(userData.id);
          
          // Unwrap the response - loadUserData returns { success: true, data: {...} }
          if (existingData && existingData.success && existingData.data) {
            // User data already exists, merge with existing data
            console.log('✅ Found existing user data, merging with current profile');
            // Check old format with currentUser wrapper or new format direct data
            const existingUser = existingData.data.currentUser || existingData.data;
            console.log('📚 Existing dreams count:', existingUser.dreamBook?.length || 0);
            console.log('📊 Data structure version:', existingUser.dataStructureVersion || 1);
            userData = {
              ...existingUser,
              // Update only basic profile info, keep everything else
              name: userData.name,
              email: userData.email,
              office: userData.office,
              avatar: userData.avatar
            };
            console.log('📚 Merged dreams count:', userData.dreamBook?.length || 0);
          } else {
            // No existing data, save new user profile (6-container architecture)
            console.log('🆕 No existing data found, saving new user profile with 6-container structure');
            // Save minimal profile (no arrays - those go to separate containers)
            const minimalProfile = {
              id: userData.id,
              userId: userData.id,
              name: userData.name,
              email: userData.email,
              office: userData.office,
              avatar: userData.avatar,
              score: 0,
              dreamsCount: 0,
              connectsCount: 0,
              weeksActiveCount: 0,
              currentYear: new Date().getFullYear(),
              dataStructureVersion: 3,
              role: 'user',
              isActive: true,
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            };
            
            const saveResult = await databaseService.saveUserData(userData.id, minimalProfile);
            if (saveResult.success) {
              console.log('✅ New user profile saved successfully (6-container, v3)');
              
              // Create empty dreams document for new user
              try {
                const itemService = (await import('../services/itemService.js')).default;
                await itemService.saveDreams(userData.id, [], []);
                console.log('✅ Created empty dreams document for new user');
              } catch (dreamsError) {
                console.error('⚠️ Failed to create initial dreams document:', dreamsError);
                // Continue anyway - it will be created when they add their first dream
              }
              
              // Update userData with the saved profile properties to prevent duplicate saves
              userData = { ...userData, ...minimalProfile };
            } else {
              console.log('ℹ️ Profile save failed but continuing with login:', saveResult.error);
            }
          }
        } catch (error) {
          console.error('❌ Error checking/updating user profile:', error);
          // Continue with login even if database operations fail
          console.log('ℹ️ Continuing with login despite error');
        }

        // Get roles from the ID token (Entra App Roles)
        const userRole = determineUserRoleFromToken(account, profileData, userData);

        setUser(userData);
        setUserRole(userRole);
        console.log('✅ User profile setup completed with', userData.dreamBook?.length || 0, 'dreams');
      } else {
        console.error('Failed to fetch profile:', profileResult.error);
        throw new Error(profileResult.error.message);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to basic account info
      console.log('🔄 Using fallback basic user info');
      const basicUser = {
        id: account.localAccountId || account.username || Date.now().toString(),
        name: account.name,
        email: account.username,
        office: 'Remote',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=EC4B5C&color=fff&size=100`,
        dreamBook: [],
        careerGoals: [],
        developmentPlan: [],
        score: 0,
        connects: [],
        dreamsCount: 0,
        connectsCount: 0
      };
      setUser(basicUser);
      setUserRole(determineUserRoleFromToken(account, null, basicUser));
      console.log('✅ Basic user setup completed');
    } finally {
      console.log('🏁 Finishing user profile fetch');
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

  const login = async () => {
    try {
      setIsLoading(true);
      setLoginError(null); // Clear any previous errors
      
      // Microsoft login
      
      // Try popup first, fallback to redirect if popup is blocked
      try {
        await instance.loginPopup(loginRequest);
      } catch (popupError) {
        // Check if error is due to popup being blocked
        if (popupError.errorCode === 'popup_window_error' || 
            popupError.message?.includes('popup') || 
            popupError.name === 'BrowserAuthError') {
          console.log('Popup blocked, trying redirect...');
          setLoginError('Popup was blocked. Redirecting to login page...');
          // Give user a moment to see the message
          setTimeout(() => {
            instance.loginRedirect(loginRequest);
          }, 2000);
          return;
        }
        throw popupError; // Re-throw if it's not a popup issue
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.errorCode === 'user_cancelled') {
        errorMessage = 'Login was cancelled. Please try again when ready.';
      } else if (error.errorCode === 'network_error') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.errorCode === 'invalid_client') {
        errorMessage = 'Configuration error. Please contact support.';
      } else if (error.message?.includes('AADSTS')) {
        errorMessage = 'Microsoft authentication error. Please try again or contact your IT administrator.';
      }
      
      setLoginError(errorMessage);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Microsoft logout
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin
      });
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    userRole,
    isAuthenticated: !!user,
    isLoading,
    loginError,
    login,
    logout,
    clearLoginError: () => setLoginError(null),
    getToken,
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
