// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';

/**
 * User Management Service for DreamSpace
 * Handles user role assignments, team management, and coach assignments
 */
class UserManagementService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    this.useCosmosDB = isLiveSite || !!(import.meta.env.VITE_COSMOS_ENDPOINT && import.meta.env.VITE_APP_ENV === 'production');
    
    console.log('👥🔧 User Management Service initialized:', {
      useCosmosDB: this.useCosmosDB,
      apiBase: this.apiBase
    });
  }

  /**
   * Promote user to coach
   * @param {string} userId - User ID
   * @param {string} teamName - Team name for the new coach
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
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

  /**
   * Assign user to existing coach
   * @param {string} userId - User ID
   * @param {string} coachId - Coach ID
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
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

  /**
   * Unassign user from coach/team
   * @param {string} userId - User ID
   * @param {string} coachId - Coach ID
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
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

  /**
   * Replace team coach
   * @param {string} oldCoachId - Old coach ID
   * @param {string} newCoachId - New coach ID
   * @param {string} teamName - Team name (optional)
   * @param {string} demoteOption - What to do with old coach ('unassigned', 'member', etc.)
   * @param {string} assignToTeamId - If demoting to member, which team to assign to
   * @returns {Promise<{success: boolean, data?: object, error?: object}>}
   */
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
        console.log('✅ Coach replaced in Cosmos DB:', { oldCoachId, newCoachId });
        return ok(result);
      } else {
        // Handle locally for development
        const success = await this.replaceCoachLocalStorage(oldCoachId, newCoachId, teamName, demoteOption, assignToTeamId);
        console.log('📱 Coach replaced in localStorage:', { oldCoachId, newCoachId });
        return ok({ success });
      }
    } catch (error) {
      console.error('❌ Error replacing team coach:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to replace team coach');
    }
  }

  // === LOCAL STORAGE FALLBACK METHODS (Development Mode) ===

  /**
   * Get localStorage teams helper
   * @returns {Promise<array>}
   */
  async getLocalStorageTeams() {
    const stored = localStorage.getItem('dreamspace_team_relationships');
    if (stored) {
      return JSON.parse(stored);
    }
    
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
   * Promote user to coach in localStorage
   * @param {string} userId - User ID
   * @param {string} teamName - Team name
   * @returns {Promise<boolean>}
   */
  async promoteUserLocalStorage(userId, teamName) {
    const teams = await this.getLocalStorageTeams();
    
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

  /**
   * Assign user to coach in localStorage
   * @param {string} userId - User ID
   * @param {string} coachId - Coach ID
   * @returns {Promise<boolean>}
   */
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

  /**
   * Unassign user from coach in localStorage
   * @param {string} userId - User ID
   * @param {string} coachId - Coach ID
   * @returns {Promise<boolean>}
   */
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

  /**
   * Replace coach in localStorage
   * @param {string} oldCoachId - Old coach ID
   * @param {string} newCoachId - New coach ID
   * @param {string} teamName - Team name
   * @param {string} demoteOption - Demotion option
   * @param {string} assignToTeamId - Team to assign old coach to
   * @returns {Promise<boolean>}
   */
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
      // Merge teams
      const existingMembers = new Set(teams[newTeamIndex].teamMembers);
      mergedMembers = [
        ...teams[newTeamIndex].teamMembers,
        ...oldTeam.teamMembers.filter(member => !existingMembers.has(member))
      ];
      teams.splice(newTeamIndex, 1);
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
}

// Create and export singleton instance
export const userManagementService = new UserManagementService();
export default userManagementService;






