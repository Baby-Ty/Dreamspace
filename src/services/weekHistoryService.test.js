// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as weekHistoryService from './weekHistoryService';

// Mock fetch globally
global.fetch = vi.fn();

describe('weekHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockWeekHistory = {
    '2025-W40': { totalGoals: 5, completedGoals: 4, score: 12, weekStartDate: '2025-10-06', weekEndDate: '2025-10-12' },
    '2025-W41': { totalGoals: 5, completedGoals: 3, score: 9, weekStartDate: '2025-10-13', weekEndDate: '2025-10-19' },
    '2025-W42': { totalGoals: 6, completedGoals: 5, score: 15, weekStartDate: '2025-10-20', weekEndDate: '2025-10-26' },
    '2025-W43': { totalGoals: 5, completedGoals: 5, score: 15, weekStartDate: '2025-10-27', weekEndDate: '2025-11-02' },
    '2025-W44': { totalGoals: 4, completedGoals: 2, score: 6, weekStartDate: '2025-11-03', weekEndDate: '2025-11-09' }
  };

  describe('getPastWeeks', () => {
    it('should successfully get past weeks history', async () => {
      const mockData = {
        userId: 'user@example.com',
        weekHistory: mockWeekHistory,
        totalWeeksTracked: 5
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await weekHistoryService.getPastWeeks('user@example.com');

      expect(result.success).toBe(true);
      expect(result.data.weekHistory).toEqual(mockWeekHistory);
      expect(Object.keys(result.data.weekHistory)).toHaveLength(5);
    });

    it('should handle empty history', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { userId: 'user@example.com', weekHistory: {}, totalWeeksTracked: 0 } 
        })
      });

      const result = await weekHistoryService.getPastWeeks('user@example.com');

      expect(result.success).toBe(true);
      expect(result.data.weekHistory).toEqual({});
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await weekHistoryService.getPastWeeks('user@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('getRecentWeeks', () => {
    it('should return most recent weeks in descending order', async () => {
      const mockData = {
        userId: 'user@example.com',
        weekHistory: mockWeekHistory
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await weekHistoryService.getRecentWeeks('user@example.com', 3);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0].weekId).toBe('2025-W44'); // Most recent first
      expect(result.data[1].weekId).toBe('2025-W43');
      expect(result.data[2].weekId).toBe('2025-W42');
    });

    it('should default to 12 weeks if count not specified', async () => {
      const largeHistory = {};
      for (let i = 1; i <= 20; i++) {
        largeHistory[`2025-W${String(i).padStart(2, '0')}`] = {
          totalGoals: 5,
          completedGoals: 4,
          score: 12
        };
      }

      const mockData = {
        userId: 'user@example.com',
        weekHistory: largeHistory
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await weekHistoryService.getRecentWeeks('user@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(12);
    });

    it('should handle fewer weeks than requested', async () => {
      const mockData = {
        userId: 'user@example.com',
        weekHistory: mockWeekHistory
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await weekHistoryService.getRecentWeeks('user@example.com', 10);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5); // Only 5 weeks available
    });
  });

  describe('getWeekStats', () => {
    it('should return stats for specific week', async () => {
      const mockData = {
        userId: 'user@example.com',
        weekHistory: mockWeekHistory
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await weekHistoryService.getWeekStats('user@example.com', '2025-W42');

      expect(result.success).toBe(true);
      expect(result.data.weekId).toBe('2025-W42');
      expect(result.data.totalGoals).toBe(6);
      expect(result.data.completedGoals).toBe(5);
      expect(result.data.score).toBe(15);
    });

    it('should handle week not found', async () => {
      const mockData = {
        userId: 'user@example.com',
        weekHistory: mockWeekHistory
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await weekHistoryService.getWeekStats('user@example.com', '2025-W99');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No stats found');
    });
  });

  describe('getCompletionRate', () => {
    it('should calculate completion rates for charting', async () => {
      const mockData = {
        userId: 'user@example.com',
        weekHistory: mockWeekHistory
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await weekHistoryService.getCompletionRate('user@example.com', 5);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
      
      // Check W42: 5/6 completed = 83%
      const week42 = result.data.find(w => w.weekId === '2025-W42');
      expect(week42.completionRate).toBe(83);
      expect(week42.totalGoals).toBe(6);
      expect(week42.completedGoals).toBe(5);
      
      // Check W44: 2/4 completed = 50%
      const week44 = result.data.find(w => w.weekId === '2025-W44');
      expect(week44.completionRate).toBe(50);
    });

    it('should handle weeks with zero goals', async () => {
      const historyWithZero = {
        '2025-W40': { totalGoals: 0, completedGoals: 0, score: 0 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { userId: 'user@example.com', weekHistory: historyWithZero } 
        })
      });

      const result = await weekHistoryService.getCompletionRate('user@example.com');

      expect(result.success).toBe(true);
      expect(result.data[0].completionRate).toBe(0);
    });
  });

  describe('getTotalStats', () => {
    it('should calculate total stats across all weeks', async () => {
      const mockData = {
        userId: 'user@example.com',
        weekHistory: mockWeekHistory
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData })
      });

      const result = await weekHistoryService.getTotalStats('user@example.com');

      expect(result.success).toBe(true);
      expect(result.data.totalWeeks).toBe(5);
      expect(result.data.totalGoals).toBe(25); // 5+5+6+5+4
      expect(result.data.completedGoals).toBe(19); // 4+3+5+5+2
      expect(result.data.totalScore).toBe(57); // 12+9+15+15+6
      expect(result.data.overallCompletionRate).toBe(76); // 19/25 = 76%
    });

    it('should handle empty history', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { userId: 'user@example.com', weekHistory: {} } 
        })
      });

      const result = await weekHistoryService.getTotalStats('user@example.com');

      expect(result.success).toBe(true);
      expect(result.data.totalWeeks).toBe(0);
      expect(result.data.totalGoals).toBe(0);
      expect(result.data.overallCompletionRate).toBe(0);
    });
  });
});

