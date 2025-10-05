// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { describe, it, expect, vi } from 'vitest';
import { GraphService } from './graphService.js';
import { ok, fail } from '../utils/errorHandling.js';
import { ErrorCodes } from '../constants/errors.js';

describe('GraphService', () => {
  describe('getMe', () => {
    it('should return user data on successful fetch', async () => {
      // Stub authedFetch to return successful response
      const mockUserData = {
        id: '123',
        displayName: 'Test User',
        mail: 'test@example.com',
        userPrincipalName: 'test@company.com',
        jobTitle: 'Developer',
        officeLocation: 'New York'
      };

      const authedFetch = vi.fn().mockResolvedValue(ok(mockUserData));
      const graph = GraphService(authedFetch);

      const result = await graph.getMe();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserData);
      expect(authedFetch).toHaveBeenCalledWith('https://graph.microsoft.com/v1.0/me');
    });

    it('should return error when fetch fails', async () => {
      // Stub authedFetch to return error
      const authedFetch = vi.fn().mockResolvedValue(
        fail(ErrorCodes.NETWORK, 'Network error')
      );
      const graph = GraphService(authedFetch);

      const result = await graph.getMe();

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ErrorCodes.NETWORK);
      expect(result.error.message).toBe('Network error');
    });

    it('should handle validation errors', async () => {
      // Return invalid data (missing required id field)
      const invalidData = {
        displayName: 'Test User'
        // missing 'id' field
      };

      const authedFetch = vi.fn().mockResolvedValue(ok(invalidData));
      const graph = GraphService(authedFetch);

      const result = await graph.getMe();

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ErrorCodes.VALIDATION);
    });
  });

  describe('getUser', () => {
    it('should return user data for valid userId', async () => {
      const mockUserData = {
        id: '456',
        displayName: 'Another User',
        mail: 'another@example.com',
        userPrincipalName: 'another@company.com'
      };

      const authedFetch = vi.fn().mockResolvedValue(ok(mockUserData));
      const graph = GraphService(authedFetch);

      const result = await graph.getUser('456');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserData);
      expect(authedFetch).toHaveBeenCalledWith('https://graph.microsoft.com/v1.0/users/456');
    });

    it('should return error for missing userId', async () => {
      const authedFetch = vi.fn();
      const graph = GraphService(authedFetch);

      const result = await graph.getUser('');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(authedFetch).not.toHaveBeenCalled();
    });

    it('should handle fetch failure', async () => {
      const authedFetch = vi.fn().mockResolvedValue(
        fail(ErrorCodes.NETWORK, 'User not found')
      );
      const graph = GraphService(authedFetch);

      const result = await graph.getUser('999');

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User not found');
    });
  });

  describe('searchUsers', () => {
    it('should return list of users for valid query', async () => {
      const mockUsersResponse = {
        value: [
          { id: '1', displayName: 'User One', mail: 'one@example.com' },
          { id: '2', displayName: 'User Two', mail: 'two@example.com' }
        ]
      };

      const authedFetch = vi.fn().mockResolvedValue(ok(mockUsersResponse));
      const graph = GraphService(authedFetch);

      const result = await graph.searchUsers('test');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].displayName).toBe('User One');
    });

    it('should return error for empty query', async () => {
      const authedFetch = vi.fn();
      const graph = GraphService(authedFetch);

      const result = await graph.searchUsers('');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(authedFetch).not.toHaveBeenCalled();
    });

    it('should handle search failure', async () => {
      const authedFetch = vi.fn().mockResolvedValue(
        fail(ErrorCodes.NETWORK, 'Search failed')
      );
      const graph = GraphService(authedFetch);

      const result = await graph.searchUsers('test');

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Search failed');
    });
  });

  describe('getMyPhoto', () => {
    it('should return null when getToken is not provided', async () => {
      const authedFetch = vi.fn();
      const graph = GraphService(authedFetch, null);

      const result = await graph.getMyPhoto();

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(ErrorCodes.INVALID_CONFIG);
    });

    it('should return null when token is not available', async () => {
      const authedFetch = vi.fn();
      const getToken = vi.fn().mockResolvedValue(null);
      const graph = GraphService(authedFetch, getToken);

      const result = await graph.getMyPhoto();

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });
});

