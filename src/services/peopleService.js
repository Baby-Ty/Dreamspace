// People Hub service for DreamSpace - handles team management and coaching data

class PeopleService {
  constructor() {
    this.apiBase = '/api';
    this.useCosmosDB = !!(import.meta.env.VITE_COSMOS_ENDPOINT && import.meta.env.VITE_APP_ENV === 'production');
    
    console.log('👥 People Service initialized:', {
      useCosmosDB: this.useCosmosDB,
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved users from Cosmos DB:', result.users?.length || 0);
        return result.users || [];
      } else {
        // Fallback to localStorage for development
        const users = await this.getLocalStorageUsers();
        console.log('📱 Retrieved users from localStorage:', users.length);
        return users;
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      // Fallback to localStorage on error
      return this.getLocalStorageUsers();
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved team relationships from Cosmos DB:', result.teams?.length || 0);
        return result.teams || [];
      } else {
        // Fallback to localStorage for development
        const teams = await this.getLocalStorageTeams();
        console.log('📱 Retrieved team relationships from localStorage:', teams.length);
        return teams;
      }
    } catch (error) {
      console.error('❌ Error fetching team relationships:', error);
      // Fallback to localStorage on error
      return this.getLocalStorageTeams();
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved coaching alerts from Cosmos DB:', result.alerts?.length || 0);
        return result.alerts || [];
      } else {
        // Fallback to localStorage for development
        const alerts = await this.getLocalStorageCoachingAlerts(managerId);
        console.log('📱 Retrieved coaching alerts from localStorage:', alerts.length);
        return alerts;
      }
    } catch (error) {
      console.error('❌ Error fetching coaching alerts:', error);
      return [];
    }
  }

  // Get team metrics for a specific manager
  async getTeamMetrics(managerId) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/getTeamMetrics/${managerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved team metrics from Cosmos DB for manager:', managerId);
        return result.metrics;
      } else {
        // Fallback to localStorage for development
        const metrics = await this.getLocalStorageTeamMetrics(managerId);
        console.log('📱 Retrieved team metrics from localStorage for manager:', managerId);
        return metrics;
      }
    } catch (error) {
      console.error('❌ Error fetching team metrics:', error);
      return null;
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ User promoted to coach in Cosmos DB:', userId);
        return result;
      } else {
        // Handle locally for development
        const success = await this.promoteUserLocalStorage(userId, teamName);
        console.log('📱 User promoted to coach in localStorage:', userId);
        return { success };
      }
    } catch (error) {
      console.error('❌ Error promoting user to coach:', error);
      throw error;
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ User assigned to coach in Cosmos DB:', { userId, coachId });
        return result;
      } else {
        // Handle locally for development
        const success = await this.assignUserLocalStorage(userId, coachId);
        console.log('📱 User assigned to coach in localStorage:', { userId, coachId });
        return { success };
      }
    } catch (error) {
      console.error('❌ Error assigning user to coach:', error);
      throw error;
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ User unassigned from coach in Cosmos DB:', { userId, coachId });
        return result;
      } else {
        // Handle locally for development
        const success = await this.unassignUserLocalStorage(userId, coachId);
        console.log('📱 User unassigned from coach in localStorage:', { userId, coachId });
        return { success };
      }
    } catch (error) {
      console.error('❌ Error unassigning user from coach:', error);
      throw error;
    }
  }

  // Replace team coach
  async replaceTeamCoach(oldCoachId, newCoachId, teamName = null) {
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
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Coach replaced in Cosmos DB:', { oldCoachId, newCoachId, teamName });
        return result;
      } else {
        // Handle locally for development
        const success = await this.replaceCoachLocalStorage(oldCoachId, newCoachId, teamName);
        console.log('📱 Coach replaced in localStorage:', { oldCoachId, newCoachId, teamName });
        return { success };
      }
    } catch (error) {
      console.error('❌ Error replacing team coach:', error);
      throw error;
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

  async replaceCoachLocalStorage(oldCoachId, newCoachId, teamName = null) {
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
