// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { peopleService } from './peopleService.js';

describe('PeopleService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset service to non-Cosmos mode for testing
    peopleService.useCosmosDB = false;
  });

  describe('getAllUsers', () => {
    it('should return users from localStorage', async () => {
      // Setup mock data
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'user1@test.com', role: 'user' },
        { id: 2, name: 'User 2', email: 'user2@test.com', role: 'coach' }
      ];
      
      localStorage.setItem('dreamspace_all_users', JSON.stringify(mockUsers));

      const result = await peopleService.getAllUsers();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('User 1');
    });

    it('should return empty array if no users exist', async () => {
      // Don't initialize mock data
      peopleService.initializeLocalStorage = vi.fn();
      localStorage.clear();
      
      const result = await peopleService.getAllUsers();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle corrupted localStorage data', async () => {
      // Mock JSON.parse to throw
      const originalParse = JSON.parse;
      JSON.parse = vi.fn(() => { throw new Error('Invalid JSON'); });
      
      localStorage.setItem('dreamspace_all_users', 'invalid json');

      const result = await peopleService.getAllUsers();

      // Should handle error gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Restore
      JSON.parse = originalParse;
    });
  });

  describe('getTeamRelationships', () => {
    it('should return team relationships from localStorage', async () => {
      const mockTeams = [
        {
          managerId: 1,
          teamName: 'Team Alpha',
          teamMembers: [2, 3, 4]
        },
        {
          managerId: 5,
          teamName: 'Team Beta',
          teamMembers: [6, 7]
        }
      ];
      
      localStorage.setItem('dreamspace_team_relationships', JSON.stringify(mockTeams));

      const result = await peopleService.getTeamRelationships();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].teamName).toBe('Team Alpha');
      expect(result.data[0].teamMembers).toHaveLength(3);
    });

    it('should return empty array if no teams exist', async () => {
      localStorage.clear();
      
      const result = await peopleService.getTeamRelationships();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getTeamMetrics', () => {
    beforeEach(async () => {
      // Setup users
      const mockUsers = [
        { 
          id: 1, 
          name: 'Coach', 
          email: 'coach@test.com', 
          role: 'coach',
          score: 100,
          dreamsCount: 5
        },
        { 
          id: 2, 
          name: 'Member 1', 
          email: 'member1@test.com', 
          role: 'user',
          score: 80,
          dreamsCount: 3
        },
        { 
          id: 3, 
          name: 'Member 2', 
          email: 'member2@test.com', 
          role: 'user',
          score: 90,
          dreamsCount: 4
        }
      ];
      localStorage.setItem('dreamspace_all_users', JSON.stringify(mockUsers));

      // Setup teams
      const mockTeams = [
        {
          managerId: 1,
          teamName: 'Test Team',
          teamMembers: [2, 3]
        }
      ];
      localStorage.setItem('dreamspace_team_relationships', JSON.stringify(mockTeams));
    });

    it('should calculate team metrics correctly', async () => {
      const result = await peopleService.getTeamMetrics(1);

      expect(result.success).toBe(true);
      expect(result.data.teamSize).toBe(2);
      expect(result.data.teamName).toBe('Test Team');
      expect(result.data.teamMembers).toHaveLength(2);
      expect(result.data.averageScore).toBe(85); // (80 + 90) / 2
    });

    it('should return error if coach not found', async () => {
      const result = await peopleService.getTeamMetrics(999);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should handle coach with no team members', async () => {
      // Add coach with empty team
      const mockTeams = [
        {
          managerId: 1,
          teamName: 'Empty Team',
          teamMembers: []
        }
      ];
      localStorage.setItem('dreamspace_team_relationships', JSON.stringify(mockTeams));

      const result = await peopleService.getTeamMetrics(1);

      expect(result.success).toBe(true);
      expect(result.data.teamSize).toBe(0);
      expect(result.data.teamMembers).toHaveLength(0);
    });
  });

  describe('promoteUserToCoach', () => {
    beforeEach(() => {
      const mockUsers = [
        { id: 1, name: 'User 1', email: 'user1@test.com', role: 'user' },
        { id: 2, name: 'User 2', email: 'user2@test.com', role: 'coach' }
      ];
      localStorage.setItem('dreamspace_all_users', JSON.stringify(mockUsers));
    });

    it('should promote user to coach', async () => {
      const result = await peopleService.promoteUserToCoach(1);

      expect(result.success).toBe(true);

      // Check that user role was updated
      const users = JSON.parse(localStorage.getItem('dreamspace_all_users'));
      const promotedUser = users.find(u => u.id === 1);
      expect(promotedUser.role).toBe('coach');
    });

    it('should create team for promoted coach', async () => {
      await peopleService.promoteUserToCoach(1);

      const teams = JSON.parse(localStorage.getItem('dreamspace_team_relationships') || '[]');
      const newTeam = teams.find(t => t.managerId === 1);
      
      expect(newTeam).toBeDefined();
      expect(newTeam.teamName).toContain('User 1');
      expect(newTeam.teamMembers).toEqual([]);
    });

    it('should return error if user not found', async () => {
      const result = await peopleService.promoteUserToCoach(999);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('assignUserToCoach', () => {
    beforeEach(() => {
      const mockUsers = [
        { id: 1, name: 'Coach', email: 'coach@test.com', role: 'coach' },
        { id: 2, name: 'User', email: 'user@test.com', role: 'user' }
      ];
      localStorage.setItem('dreamspace_all_users', JSON.stringify(mockUsers));

      const mockTeams = [
        {
          managerId: 1,
          teamName: 'Test Team',
          teamMembers: []
        }
      ];
      localStorage.setItem('dreamspace_team_relationships', JSON.stringify(mockTeams));
    });

    it('should assign user to coach team', async () => {
      const result = await peopleService.assignUserToCoach(2, 1);

      expect(result.success).toBe(true);

      const teams = JSON.parse(localStorage.getItem('dreamspace_team_relationships'));
      const team = teams.find(t => t.managerId === 1);
      
      expect(team.teamMembers).toContain(2);
    });

    it('should not add user if already in team', async () => {
      // First assignment
      await peopleService.assignUserToCoach(2, 1);
      
      // Try to assign again
      const result = await peopleService.assignUserToCoach(2, 1);

      expect(result.success).toBe(true);

      const teams = JSON.parse(localStorage.getItem('dreamspace_team_relationships'));
      const team = teams.find(t => t.managerId === 1);
      
      // Should only appear once
      expect(team.teamMembers.filter(id => id === 2)).toHaveLength(1);
    });

    it('should return error if coach not found', async () => {
      const result = await peopleService.assignUserToCoach(2, 999);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('getCoachingAlerts', () => {
    beforeEach(() => {
      const mockUsers = [
        { 
          id: 1, 
          name: 'Coach', 
          email: 'coach@test.com', 
          role: 'coach',
          score: 100
        },
        { 
          id: 2, 
          name: 'Member 1', 
          email: 'member1@test.com', 
          role: 'user',
          score: 10, // Low score
          dreamsCount: 0 // No dreams
        },
        { 
          id: 3, 
          name: 'Member 2', 
          email: 'member2@test.com', 
          role: 'user',
          score: 80,
          dreamsCount: 5
        }
      ];
      localStorage.setItem('dreamspace_all_users', JSON.stringify(mockUsers));

      const mockTeams = [
        {
          managerId: 1,
          teamName: 'Test Team',
          teamMembers: [2, 3]
        }
      ];
      localStorage.setItem('dreamspace_team_relationships', JSON.stringify(mockTeams));
    });

    it('should generate alerts for low engagement', async () => {
      const result = await peopleService.getCoachingAlerts(1);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      
      // Should have alert for member with low score
      const lowScoreAlert = result.data.find(
        alert => alert.userId === 2 && alert.type === 'low_engagement'
      );
      expect(lowScoreAlert).toBeDefined();
    });

    it('should return empty array for coach with no team', async () => {
      const mockTeams = [
        {
          managerId: 1,
          teamName: 'Empty Team',
          teamMembers: []
        }
      ];
      localStorage.setItem('dreamspace_team_relationships', JSON.stringify(mockTeams));

      const result = await peopleService.getCoachingAlerts(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return error if coach not found', async () => {
      const result = await peopleService.getCoachingAlerts(999);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Error handling', () => {
    it('should handle localStorage quota exceeded', async () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const result = await peopleService.promoteUserToCoach(1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });
});

