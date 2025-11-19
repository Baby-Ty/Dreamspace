// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as currentWeekService from './currentWeekService';
import { ErrorCodes } from '../constants/errors';

// Mock fetch globally
global.fetch = vi.fn();

describe('currentWeekService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentWeek', () => {
    it('should successfully get current week', async () => {
      const mockData = {
        id: 'user@example.com',
        userId: 'user@example.com',
        weekId: '2025-W47',
        goals: [],
        stats: { totalGoals: 0, completedGoals: 0, score: 0 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await currentWeekService.getCurrentWeek('user@example.com');

      expect(result.success).toBe(true);
      expect(result.data.weekId).toBe('2025-W47');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/getCurrentWeek/user@example.com'),
        expect.any(Object)
      );
    });

    it('should handle not found (no current week)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null })
      });

      const result = await currentWeekService.getCurrentWeek('user@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await currentWeekService.getCurrentWeek('user@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      });

      const result = await currentWeekService.getCurrentWeek('user@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get current week');
    });
  });

  describe('saveCurrentWeek', () => {
    const mockUserId = 'user@example.com';
    const mockWeekId = '2025-W47';
    const mockGoals = [
      {
        id: 'goal_1',
        title: 'Test Goal',
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];

    it('should successfully save current week', async () => {
      const mockResponse = {
        id: mockUserId,
        userId: mockUserId,
        weekId: mockWeekId,
        goals: mockGoals
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      });

      const result = await currentWeekService.saveCurrentWeek(
        mockUserId,
        mockWeekId,
        mockGoals
      );

      expect(result.success).toBe(true);
      expect(result.data.weekId).toBe(mockWeekId);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/saveCurrentWeek'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(mockWeekId)
        })
      );
    });

    it('should pass optional stats', async () => {
      const mockStats = { totalGoals: 1, completedGoals: 0, score: 0 };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await currentWeekService.saveCurrentWeek(
        mockUserId,
        mockWeekId,
        mockGoals,
        mockStats
      );

      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.stats).toEqual(mockStats);
    });

    it('should handle save errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid data' })
      });

      const result = await currentWeekService.saveCurrentWeek(
        mockUserId,
        mockWeekId,
        mockGoals
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('archiveWeek', () => {
    it('should successfully archive week', async () => {
      const mockSummary = {
        totalGoals: 5,
        completedGoals: 4,
        score: 12,
        weekStartDate: '2025-11-17',
        weekEndDate: '2025-11-23'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      const result = await currentWeekService.archiveWeek(
        'user@example.com',
        '2025-W47',
        mockSummary
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/archiveWeek'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('toggleGoalCompletion', () => {
    it('should toggle goal from incomplete to complete', async () => {
      const goals = [
        { id: 'goal_1', completed: false },
        { id: 'goal_2', completed: false }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      const result = await currentWeekService.toggleGoalCompletion(
        'user@example.com',
        '2025-W47',
        'goal_1',
        goals
      );

      expect(result.success).toBe(true);
      const savedGoals = JSON.parse(global.fetch.mock.calls[0][1].body).goals;
      const toggledGoal = savedGoals.find(g => g.id === 'goal_1');
      expect(toggledGoal.completed).toBe(true);
      expect(toggledGoal.completedAt).toBeTruthy();
    });

    it('should toggle goal from complete to incomplete', async () => {
      const goals = [
        { id: 'goal_1', completed: true, completedAt: '2025-11-18T10:00:00Z' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await currentWeekService.toggleGoalCompletion(
        'user@example.com',
        '2025-W47',
        'goal_1',
        goals
      );

      const savedGoals = JSON.parse(global.fetch.mock.calls[0][1].body).goals;
      const toggledGoal = savedGoals.find(g => g.id === 'goal_1');
      expect(toggledGoal.completed).toBe(false);
      expect(toggledGoal.completedAt).toBeNull();
    });
  });

  describe('skipGoal', () => {
    it('should mark goal as skipped', async () => {
      const goals = [
        { id: 'goal_1', completed: false }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await currentWeekService.skipGoal(
        'user@example.com',
        '2025-W47',
        'goal_1',
        goals
      );

      const savedGoals = JSON.parse(global.fetch.mock.calls[0][1].body).goals;
      const skippedGoal = savedGoals.find(g => g.id === 'goal_1');
      expect(skippedGoal.skipped).toBe(true);
      expect(skippedGoal.skippedAt).toBeTruthy();
    });
  });

  describe('incrementMonthlyGoal', () => {
    it('should increment completion count for monthly goal', async () => {
      const goals = [
        {
          id: 'goal_1',
          recurrence: 'monthly',
          frequency: 4,
          completionCount: 2,
          completionDates: []
        }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await currentWeekService.incrementMonthlyGoal(
        'user@example.com',
        '2025-W47',
        'goal_1',
        goals
      );

      const savedGoals = JSON.parse(global.fetch.mock.calls[0][1].body).goals;
      const goal = savedGoals.find(g => g.id === 'goal_1');
      expect(goal.completionCount).toBe(3);
      expect(goal.completionDates.length).toBe(1);
      expect(goal.completed).toBe(false);
    });

    it('should mark goal complete when reaching frequency', async () => {
      const goals = [
        {
          id: 'goal_1',
          recurrence: 'monthly',
          frequency: 3,
          completionCount: 2,
          completionDates: []
        }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      await currentWeekService.incrementMonthlyGoal(
        'user@example.com',
        '2025-W47',
        'goal_1',
        goals
      );

      const savedGoals = JSON.parse(global.fetch.mock.calls[0][1].body).goals;
      const goal = savedGoals.find(g => g.id === 'goal_1');
      expect(goal.completionCount).toBe(3);
      expect(goal.completed).toBe(true);
    });
  });
});

