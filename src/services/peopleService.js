// People Hub service for DreamSpace - handles team management and coaching data
import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';

class PeopleService {
  constructor() {
    // Always use Cosmos DB on the live site, regardless of environment variables
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

  // Get all users with their team assignments and roles
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

  // Get team relationships and coaching assignments
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

  // Get coaching alerts for a specific manager
  async getCoachingAlerts(managerId) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/getCoachingAlerts/${managerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved coaching alerts from Cosmos DB:', result.alerts?.length || 0);
        return ok(result.alerts || []);
      } else {
        // Fallback to localStorage for development
        const alerts = await this.getLocalStorageCoachingAlerts(managerId);
        console.log('📱 Retrieved coaching alerts from localStorage:', alerts.length);
        return ok(alerts);
      }
    } catch (error) {
      console.error('❌ Error fetching coaching alerts:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to fetch coaching alerts');
    }
  }

  // Get team metrics for a specific manager
  async getTeamMetrics(managerId) {
    console.log('🔍 getTeamMetrics called:', {
      managerId,
      useCosmosDB: this.useCosmosDB,
      environment: import.meta.env.VITE_APP_ENV,
      cosmosEndpoint: import.meta.env.VITE_COSMOS_ENDPOINT ? 'SET' : 'NOT SET'
    });
    
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/getTeamMetrics/${managerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved team metrics from Cosmos DB for manager:', managerId);
        console.log('🔍 Team metrics response:', {
          hasResult: !!result,
          hasMetrics: !!result.metrics,
          metricsType: typeof result.metrics,
          teamSize: result.metrics?.teamSize,
          teamMembers: result.metrics?.teamMembers?.length
        });
        return ok(result.metrics);
      } else {
        // Fallback to localStorage for development
        const metrics = await this.getLocalStorageTeamMetrics(managerId);
        console.log('📱 Retrieved team metrics from localStorage for manager:', managerId);
        return ok(metrics);
      }
    } catch (error) {
      console.error('❌ Error fetching team metrics:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to fetch team metrics');
    }
  }

  // Promote user to coach
  async promoteUserToCoach(userId, teamName) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/promoteUserToCoach`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            teamName,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ User promoted to coach in Cosmos DB:', userId);
        return ok(result);
      } else {
        // Handle locally for development
        const success = await this.promoteUserLocalStorage(userId, teamName);
        console.log('📱 User promoted to coach in localStorage:', userId);
        return ok({ success });
      }
    } catch (error) {
      console.error('❌ Error promoting user to coach:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to promote user to coach');
    }
  }

  // Assign user to existing coach
  async assignUserToCoach(userId, coachId) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/assignUserToCoach`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            coachId,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ User assigned to coach in Cosmos DB:', { userId, coachId });
        return ok(result);
      } else {
        // Handle locally for development
        const success = await this.assignUserLocalStorage(userId, coachId);
        console.log('📱 User assigned to coach in localStorage:', { userId, coachId });
        return ok({ success });
      }
    } catch (error) {
      console.error('❌ Error assigning user to coach:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to assign user to coach');
    }
  }

  // Unassign user from coach/team
  async unassignUserFromTeam(userId, coachId) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/unassignUserFromTeam`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            coachId,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ User unassigned from coach in Cosmos DB:', { userId, coachId });
        return ok(result);
      } else {
        // Handle locally for development
        const success = await this.unassignUserLocalStorage(userId, coachId);
        console.log('📱 User unassigned from coach in localStorage:', { userId, coachId });
        return ok({ success });
      }
    } catch (error) {
      console.error('❌ Error unassigning user from coach:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to unassign user from coach');
    }
  }

  // Update user profile
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

  // Replace team coach
  async replaceTeamCoach(oldCoachId, newCoachId, teamName = null, demoteOption = 'unassigned', assignToTeamId = null) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/replaceTeamCoach`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldCoachId,
            newCoachId,
            teamName,
            demoteOption,
            assignToTeamId,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Coach replaced in Cosmos DB:', { oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId });
        return ok(result);
      } else {
        // Handle locally for development
        const success = await this.replaceCoachLocalStorage(oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId);
        console.log('📱 Coach replaced in localStorage:', { oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId });
        return ok({ success });
      }
    } catch (error) {
      console.error('❌ Error replacing team coach:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to replace team coach');
    }
  }

  // === LOCAL STORAGE FALLBACK METHODS (Development Mode) ===

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

  async getLocalStorageCoachingAlerts(managerId) {
    // Use mock data function for alerts in development
    try {
      const { getCoachingAlerts } = await import('../data/mockData.js');
      return getCoachingAlerts(managerId);
    } catch (error) {
      console.error('Error loading coaching alerts:', error);
      return [];
    }
  }

  async getLocalStorageTeamMetrics(managerId) {
    // Use mock data function for metrics in development
    try {
      const { getTeamMetrics } = await import('../data/mockData.js');
      return getTeamMetrics(managerId);
    } catch (error) {
      console.error('Error loading team metrics:', error);
      return null;
    }
  }

  async promoteUserLocalStorage(userId, teamName) {
    const teams = await this.getLocalStorageTeams();
    const users = await this.getLocalStorageUsers();
    
    // Add new team relationship
    const newTeam = {
      managerId: userId,
      teamMembers: [],
      teamName: teamName,
      managerRole: "Dream Coach",
      createdAt: new Date().toISOString()
    };
    
    teams.push(newTeam);
    localStorage.setItem('dreamspace_team_relationships', JSON.stringify(teams));
    
    return true;
  }

  async assignUserLocalStorage(userId, coachId) {
    const teams = await this.getLocalStorageTeams();
    
    // Find the coach's team and add the user
    const coachTeam = teams.find(t => t.managerId === coachId);
    if (coachTeam && !coachTeam.teamMembers.includes(userId)) {
      coachTeam.teamMembers.push(userId);
      localStorage.setItem('dreamspace_team_relationships', JSON.stringify(teams));
      return true;
    }
    
    return false;
  }

  async unassignUserLocalStorage(userId, coachId) {
    const teams = await this.getLocalStorageTeams();
    
    // Find the coach's team and remove the user
    const coachTeam = teams.find(t => t.managerId === coachId);
    if (coachTeam && coachTeam.teamMembers.includes(userId)) {
      coachTeam.teamMembers = coachTeam.teamMembers.filter(id => id !== userId);
      localStorage.setItem('dreamspace_team_relationships', JSON.stringify(teams));
      return true;
    }
    
    return false;
  }

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

  async replaceCoachLocalStorage(oldCoachId, newCoachId, teamName = null, demoteOption = 'unassigned', assignToTeamId = null) {
    const teams = await this.getLocalStorageTeams();
    
    // Find the old coach's team
    const oldTeamIndex = teams.findIndex(t => t.managerId === oldCoachId);
    if (oldTeamIndex === -1) return false;
    
    const oldTeam = teams[oldTeamIndex];
    
    // Check if new coach already has a team
    const newTeamIndex = teams.findIndex(t => t.managerId === newCoachId);
    let mergedMembers = [...oldTeam.teamMembers];
    
    if (newTeamIndex !== -1) {
      // Merge teams - combine members and remove new coach's old team
      const existingMembers = new Set(teams[newTeamIndex].teamMembers);
      mergedMembers = [
        ...teams[newTeamIndex].teamMembers,
        ...oldTeam.teamMembers.filter(member => !existingMembers.has(member))
      ];
      teams.splice(newTeamIndex, 1); // Remove new coach's old team
    }
    
    // Update the team with new coach
    teams[oldTeamIndex] = {
      ...oldTeam,
      managerId: newCoachId,
      teamName: teamName || `Coach ${newCoachId}'s Team`,
      teamMembers: mergedMembers,
      lastModified: new Date().toISOString()
    };
    
    localStorage.setItem('dreamspace_team_relationships', JSON.stringify(teams));
    return true;
  }

  // Initialize localStorage with mock data if empty (development mode)
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
}

// Create and export singleton instance
export const peopleService = new PeopleService();
export default peopleService;
