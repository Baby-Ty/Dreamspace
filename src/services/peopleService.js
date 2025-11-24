// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';

/**
 * People Service for DreamSpace
 * Handles core user and team relationship data
 */
class PeopleService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    this.useCosmosDB = isLiveSite || !!(import.meta.env.VITE_COSMOS_ENDPOINT && import.meta.env.VITE_APP_ENV === 'production');
    
    console.log('👥 People Service initialized:', {
      useCosmosDB: this.useCosmosDB,
      isLiveSite,
      hostname: window.location.hostname,
      apiBase: this.apiBase,
      environment: import.meta.env.VITE_APP_ENV
    });
  }

  /**
   * Get all users with their team assignments and roles
   * @returns {Promise<{success: boolean, data?: array, error?: object}>}
   */
  async getAllUsers() {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/getAllUsers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved users from Cosmos DB:', result.users?.length || 0);
        return ok(result.users || []);
      } else {
        // Fallback to localStorage for development
        const users = await this.getLocalStorageUsers();
        console.log('📱 Retrieved users from localStorage:', users.length);
        return ok(users);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      // Fallback to localStorage on error
      const users = await this.getLocalStorageUsers();
      return ok(users);
    }
  }

  /**
   * Get team relationships and coaching assignments
   * @returns {Promise<{success: boolean, data?: array, error?: object}>}
   */
  async getTeamRelationships() {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/getTeamRelationships`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved team relationships from Cosmos DB:', result.teams?.length || 0);
        return ok(result.teams || []);
      } else {
        // Fallback to localStorage for development
        const teams = await this.getLocalStorageTeams();
        console.log('📱 Retrieved team relationships from localStorage:', teams.length);
        return ok(teams);
      }
    } catch (error) {
      console.error('❌ Error fetching team relationships:', error);
      // Fallback to localStorage on error
      const teams = await this.getLocalStorageTeams();
      return ok(teams);
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {object} profileData - Profile data to update
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
  async updateUserProfile(userId, profileData) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/updateUserProfile/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData)
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ User profile updated in Cosmos DB:', userId);
        return ok(result);
      } else {
        // Handle locally for development
        const success = await this.updateUserProfileLocalStorage(userId, profileData);
        console.log('📱 User profile updated in localStorage:', userId);
        return ok({ success });
      }
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to update user profile');
    }
  }

  // === LOCAL STORAGE FALLBACK METHODS (Development Mode) ===

  /**
   * Get users from localStorage (development mode)
   * @returns {Promise<array>}
   */
  async getLocalStorageUsers() {
    const stored = localStorage.getItem('dreamspace_all_users');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Import mock data as fallback
    try {
      const { allUsers } = await import('../data/mockData.js');
      localStorage.setItem('dreamspace_all_users', JSON.stringify(allUsers));
      return allUsers;
    } catch (error) {
      console.error('Error loading mock user data:', error);
      return [];
    }
  }

  /**
   * Get teams from localStorage (development mode)
   * @returns {Promise<array>}
   */
  async getLocalStorageTeams() {
    const stored = localStorage.getItem('dreamspace_team_relationships');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Import mock data as fallback
    try {
      const { teamRelationships } = await import('../data/mockData.js');
      localStorage.setItem('dreamspace_team_relationships', JSON.stringify(teamRelationships));
      return teamRelationships;
    } catch (error) {
      console.error('Error loading mock team data:', error);
      return [];
    }
  }

  /**
   * Update user profile in localStorage (development mode)
   * @param {string} userId - User ID
   * @param {object} profileData - Profile data
   * @returns {Promise<boolean>}
   */
  async updateUserProfileLocalStorage(userId, profileData) {
    const users = await this.getLocalStorageUsers();
    
    // Find the user and update their profile
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        name: profileData.name || users[userIndex].name,
        title: profileData.title || users[userIndex].title,
        office: profileData.office || users[userIndex].office,
        department: profileData.department || users[userIndex].department,
        roles: profileData.roles || users[userIndex].roles,
        manager: profileData.manager || users[userIndex].manager,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('dreamspace_all_users', JSON.stringify(users));
      return true;
    }
    
    return false;
  }

  /**
   * Initialize localStorage with mock data if empty (development mode)
   * @returns {Promise<void>}
   */
  async initializeLocalStorage() {
    if (this.useCosmosDB) return; // Skip in production
    
    try {
      const { allUsers, teamRelationships } = await import('../data/mockData.js');
      
      if (!localStorage.getItem('dreamspace_all_users')) {
        localStorage.setItem('dreamspace_all_users', JSON.stringify(allUsers));
        console.log('📱 Initialized users in localStorage');
      }
      
      if (!localStorage.getItem('dreamspace_team_relationships')) {
        localStorage.setItem('dreamspace_team_relationships', JSON.stringify(teamRelationships));
        console.log('📱 Initialized team relationships in localStorage');
      }
    } catch (error) {
      console.error('❌ Error initializing localStorage:', error);
    }
  }

  // === LEGACY METHODS (For backwards compatibility) ===
  // These methods now delegate to the new services
  // Import them at runtime to avoid circular dependencies

  /**
   * @deprecated Use coachingService.getTeamMetrics() instead
   */
  async getTeamMetrics(managerId) {
    console.warn('⚠️ peopleService.getTeamMetrics() is deprecated. Use coachingService.getTeamMetrics() instead');
    const { coachingService } = await import('./coachingService.js');
    return coachingService.getTeamMetrics(managerId);
  }

  /**
   * @deprecated Use coachingService.getCoachingAlerts() instead
   */
  async getCoachingAlerts(managerId) {
    console.warn('⚠️ peopleService.getCoachingAlerts() is deprecated. Use coachingService.getCoachingAlerts() instead');
    const { coachingService } = await import('./coachingService.js');
    return coachingService.getCoachingAlerts(managerId);
  }

  /**
   * @deprecated Use userManagementService.promoteUserToCoach() instead
   */
  async promoteUserToCoach(userId, teamName) {
    console.warn('⚠️ peopleService.promoteUserToCoach() is deprecated. Use userManagementService.promoteUserToCoach() instead');
    const { userManagementService } = await import('./userManagementService.js');
    return userManagementService.promoteUserToCoach(userId, teamName);
  }

  /**
   * @deprecated Use userManagementService.assignUserToCoach() instead
   */
  async assignUserToCoach(userId, coachId) {
    console.warn('⚠️ peopleService.assignUserToCoach() is deprecated. Use userManagementService.assignUserToCoach() instead');
    const { userManagementService } = await import('./userManagementService.js');
    return userManagementService.assignUserToCoach(userId, coachId);
  }

  /**
   * @deprecated Use userManagementService.unassignUserFromTeam() instead
   */
  async unassignUserFromTeam(userId, coachId) {
    console.warn('⚠️ peopleService.unassignUserFromTeam() is deprecated. Use userManagementService.unassignUserFromTeam() instead');
    const { userManagementService } = await import('./userManagementService.js');
    return userManagementService.unassignUserFromTeam(userId, coachId);
  }

  /**
   * @deprecated Use userManagementService.replaceTeamCoach() instead
   */
  async replaceTeamCoach(oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId) {
    console.warn('⚠️ peopleService.replaceTeamCoach() is deprecated. Use userManagementService.replaceTeamCoach() instead');
    const { userManagementService } = await import('./userManagementService.js');
    return userManagementService.replaceTeamCoach(oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId);
  }

  /**
   * Upload a user background image from a URL (e.g., DALL-E generated images)
   * The backend will fetch the image server-side to avoid CORS issues
   * @param {string} userId - User ID
   * @param {string} imageUrl - URL of the image to upload
   * @returns {Promise<{success: boolean, data?: {url: string}, error?: string}>}
   */
  async uploadUserBackgroundImageFromUrl(userId, imageUrl) {
    try {
      console.log('📸 Uploading user background image from URL:', { userId, imageUrl });

      const response = await fetch(`${this.apiBase}/uploadUserBackgroundImage/${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ User background image uploaded from URL:', result.url);
        return ok({ url: result.url });
      } else {
        // Handle 404 (function not deployed) or other errors
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Response is not JSON (e.g., 404 returns empty body)
          if (response.status === 404) {
            errorMessage = 'Upload endpoint not found. Please ensure the Azure Function is deployed.';
          }
        }
        console.error('❌ Error uploading user background image from URL:', errorMessage);
        return fail(ErrorCodes.SAVE_ERROR, errorMessage);
      }
    } catch (error) {
      console.error('❌ Error uploading user background image from URL:', error);
      return fail(ErrorCodes.SAVE_ERROR, error.message || 'Failed to upload user background image from URL');
    }
  }

  /**
   * Update user's card background image
   * @param {string} userId - User ID
   * @param {string} imageUrl - Background image URL (should be blob storage URL)
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
  async updateUserBackgroundImage(userId, imageUrl) {
    if (!userId) {
      return fail(ErrorCodes.INVALID_INPUT, 'User ID is required');
    }

    if (!imageUrl) {
      return fail(ErrorCodes.INVALID_INPUT, 'Image URL is required');
    }

    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/updateUserProfile/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cardBackgroundImage: imageUrl
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return fail(ErrorCodes.NETWORK, errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Updated user background image:', userId);
        return ok(result);
      } else {
        // Fallback to localStorage for development
        const users = await this.getLocalStorageUsers();
        const userIndex = users.findIndex(u => u.id === userId || u.userId === userId);
        
        if (userIndex === -1) {
          return fail(ErrorCodes.VALIDATION, 'User not found');
        }

        users[userIndex].cardBackgroundImage = imageUrl;
        localStorage.setItem('dreamspace_all_users', JSON.stringify(users));
        console.log('📱 Updated user background image in localStorage:', userId);
        return ok({ success: true, id: userId });
      }
    } catch (error) {
      console.error('❌ Error updating user background image:', error);
      return fail(ErrorCodes.NETWORK, error.message || 'Failed to update background image');
    }
  }
}

// Create and export singleton instance
export const peopleService = new PeopleService();
export default peopleService;
