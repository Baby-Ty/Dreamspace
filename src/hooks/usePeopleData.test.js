// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePeopleData } from './usePeopleData.js';
import peopleService from '../services/peopleService';

// Mock the peopleService
vi.mock('../services/peopleService', () => ({
  default: {
    getAllUsers: vi.fn(),
    getTeamRelationships: vi.fn(),
    getTeamMetrics: vi.fn(),
    getCoachingAlerts: vi.fn(),
    initializeLocalStorage: vi.fn()
  }
}));

describe('usePeopleData', () => {
  const mockUsers = [
    { 
      id: 1, 
      name: 'Coach One', 
      email: 'coach1@test.com', 
      office: 'New York',
      role: 'coach',
      score: 100,
      avatar: 'https://example.com/coach1.jpg'
    },
    { 
      id: 2, 
      name: 'Coach Two', 
      email: 'coach2@test.com', 
      office: 'London',
      role: 'coach',
      score: 95,
      avatar: 'https://example.com/coach2.jpg'
    },
    { 
      id: 3, 
      name: 'User One', 
      email: 'user1@test.com', 
      office: 'New York',
      role: 'user',
      score: 80
    },
    { 
      id: 4, 
      name: 'User Two', 
      email: 'user2@test.com', 
      office: 'London',
      role: 'user',
      score: 85
    }
  ];

  const mockTeams = [
    {
      managerId: 1,
      teamName: 'Alpha Team',
      teamMembers: [3]
    },
    {
      managerId: 2,
      teamName: 'Beta Team',
      teamMembers: [4]
    }
  ];

  const mockMetrics = {
    1: {
      teamSize: 1,
      averageScore: 80,
      engagementRate: 85,
      activeGoals: 3,
      completedGoals: 5,
      teamMembers: [
        { id: 3, name: 'User One', score: 80 }
      ]
    },
    2: {
      teamSize: 1,
      averageScore: 85,
      engagementRate: 90,
      activeGoals: 4,
      completedGoals: 6,
      teamMembers: [
        { id: 4, name: 'User Two', score: 85 }
      ]
    }
  };

  const mockAlerts = {
    1: [
      {
        id: 1,
        type: 'low_engagement',
        severity: 'medium',
        userId: 3,
        userName: 'User One',
        message: 'No activity in 7 days'
      }
    ],
    2: []
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    peopleService.initializeLocalStorage.mockResolvedValue();
    peopleService.getAllUsers.mockResolvedValue({ 
      success: true, 
      data: mockUsers 
    });
    peopleService.getTeamRelationships.mockResolvedValue({ 
      success: true, 
      data: mockTeams 
    });
    peopleService.getTeamMetrics.mockImplementation((managerId) => 
      Promise.resolve({ 
        success: true, 
        data: mockMetrics[managerId] 
      })
    );
    peopleService.getCoachingAlerts.mockImplementation((managerId) => 
      Promise.resolve({ 
        success: true, 
        data: mockAlerts[managerId] 
      })
    );
  });

  describe('Initial data loading', () => {
    it('should load all users and teams on mount', async () => {
      const { result } = renderHook(() => usePeopleData());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.allUsers).toHaveLength(4);
      expect(result.current.teamRelationships).toHaveLength(2);
      expect(peopleService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(peopleService.getTeamRelationships).toHaveBeenCalledTimes(1);
    });

    it('should load team metrics for all coaches', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(peopleService.getTeamMetrics).toHaveBeenCalledWith(1);
      expect(peopleService.getTeamMetrics).toHaveBeenCalledWith(2);
      expect(peopleService.getTeamMetrics).toHaveBeenCalledTimes(2);
    });

    it('should load coaching alerts for all coaches', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(peopleService.getCoachingAlerts).toHaveBeenCalledWith(1);
      expect(peopleService.getCoachingAlerts).toHaveBeenCalledWith(2);
      expect(peopleService.getCoachingAlerts).toHaveBeenCalledTimes(2);
    });

    it('should initialize coaches array with metrics', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.coaches).toHaveLength(2);
      expect(result.current.coaches[0].teamMetrics).toBeDefined();
      expect(result.current.coaches[0].teamMetrics.teamSize).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should handle getAllUsers error', async () => {
      peopleService.getAllUsers.mockResolvedValue({ 
        success: false, 
        error: { message: 'Failed to fetch users' } 
      });

      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still complete but with empty users
      expect(result.current.allUsers).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should handle getTeamRelationships error', async () => {
      peopleService.getTeamRelationships.mockResolvedValue({ 
        success: false, 
        error: { message: 'Failed to fetch teams' } 
      });

      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.teamRelationships).toEqual([]);
    });

    it('should handle metrics fetch error gracefully', async () => {
      peopleService.getTeamMetrics.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still load but metrics will be null
      expect(result.current.coaches).toHaveLength(2);
      expect(result.current.coaches[0].teamMetrics).toBeNull();
    });

    it('should set error state on complete failure', async () => {
      peopleService.getAllUsers.mockRejectedValue(
        new Error('Complete failure')
      );

      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Complete failure');
    });
  });

  describe('Filtering coaches', () => {
    it('should filter coaches by office', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Filter by New York office
      result.current.setFilterOffice('New York');

      await waitFor(() => {
        const filtered = result.current.filteredCoaches;
        expect(filtered).toHaveLength(1);
        expect(filtered[0].office).toBe('New York');
      });
    });

    it('should filter coaches by search term', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Search for "Two"
      result.current.setSearchTerm('Two');

      await waitFor(() => {
        const filtered = result.current.filteredCoaches;
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Coach Two');
      });
    });

    it('should return all coaches when filters are cleared', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Apply filter
      result.current.setFilterOffice('New York');
      
      await waitFor(() => {
        expect(result.current.filteredCoaches).toHaveLength(1);
      });

      // Clear filter
      result.current.setFilterOffice('all');

      await waitFor(() => {
        expect(result.current.filteredCoaches).toHaveLength(2);
      });
    });
  });

  describe('Sorting coaches', () => {
    it('should sort coaches by performance score', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.setSortBy('performance');

      await waitFor(() => {
        const sorted = result.current.filteredCoaches;
        expect(sorted[0].score).toBeGreaterThanOrEqual(sorted[1].score);
      });
    });

    it('should sort coaches by name', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.setSortBy('name');

      await waitFor(() => {
        const sorted = result.current.filteredCoaches;
        expect(sorted[0].name.localeCompare(sorted[1].name)).toBeLessThanOrEqual(0);
      });
    });

    it('should sort coaches by team size', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.setSortBy('teamSize');

      await waitFor(() => {
        const sorted = result.current.filteredCoaches;
        // All teams have size 1 in our mock data
        expect(sorted).toHaveLength(2);
      });
    });
  });

  describe('Computed metrics', () => {
    it('should calculate total metrics correctly', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metrics = result.current.totalMetrics;

      expect(metrics.totalCoaches).toBe(2);
      expect(metrics.totalTeamMembers).toBe(2); // 1 + 1
      expect(metrics.averageTeamSize).toBe(1); // (1 + 1) / 2
    });

    it('should handle coaches without metrics', async () => {
      peopleService.getTeamMetrics.mockResolvedValue({ 
        success: true, 
        data: null 
      });

      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metrics = result.current.totalMetrics;

      expect(metrics.totalCoaches).toBe(2);
      expect(metrics.totalTeamMembers).toBe(0);
    });
  });

  describe('Unique office list', () => {
    it('should extract unique offices from users', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const offices = result.current.uniqueOffices;

      expect(offices).toContain('New York');
      expect(offices).toContain('London');
      expect(offices).toHaveLength(2);
    });
  });

  describe('Refresh functionality', () => {
    it('should reload data when refreshData is called', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear the mock calls
      vi.clearAllMocks();

      // Call refresh
      result.current.refreshData();

      await waitFor(() => {
        expect(peopleService.getAllUsers).toHaveBeenCalledTimes(1);
        expect(peopleService.getTeamRelationships).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('User filtering for assignment', () => {
    it('should show non-coach users when showAllUsers is true', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.setShowAllUsers(true);

      await waitFor(() => {
        const users = result.current.filteredUsersForAssignment;
        expect(users.length).toBeGreaterThan(0);
        expect(users.every(u => u.role !== 'coach')).toBe(true);
      });
    });

    it('should filter users by search term', async () => {
      const { result } = renderHook(() => usePeopleData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.setShowAllUsers(true);
      result.current.setUserSearchTerm('One');

      await waitFor(() => {
        const users = result.current.filteredUsersForAssignment;
        expect(users).toHaveLength(1);
        expect(users[0].name).toBe('User One');
      });
    });
  });
});
