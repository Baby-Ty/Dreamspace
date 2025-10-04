// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDreamConnections } from './useDreamConnections';
import peopleService from '../services/peopleService';

// Mock the service
vi.mock('../services/peopleService', () => ({
  default: {
    getAllUsers: vi.fn(),
    getTeamRelationships: vi.fn(),
    initializeLocalStorage: vi.fn()
  }
}));

// Mock AppContext
vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    currentUser: {
      id: 'user-1',
      name: 'Test User',
      dreamCategories: ['Learning', 'Health']
    }
  })
}));

describe('useDreamConnections', () => {
  const mockUsers = [
    {
      id: 'user-1',
      name: 'Test User',
      office: 'Cape Town',
      dreamCategories: ['Learning', 'Health']
    },
    {
      id: '2',
      name: 'John Doe',
      office: 'Cape Town',
      dreamCategories: ['Learning', 'Health', 'Travel']
    },
    {
      id: '3',
      name: 'Jane Smith',
      office: 'Johannesburg',
      dreamCategories: ['Learning', 'Career']
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    peopleService.initializeLocalStorage.mockResolvedValue(undefined);
    peopleService.getAllUsers.mockResolvedValue({
      success: true,
      data: mockUsers
    });
    peopleService.getTeamRelationships.mockResolvedValue({
      success: true,
      data: []
    });
  });

  it('should load connections and provide pagination', async () => {
    const { result } = renderHook(() => useDreamConnections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Basic shape test
    expect(result.current).toHaveProperty('connections');
    expect(result.current).toHaveProperty('currentPage');
    expect(result.current).toHaveProperty('totalPages');
    expect(Array.isArray(result.current.connections)).toBe(true);
  });

  it('should provide pagination controls', async () => {
    const { result } = renderHook(() => useDreamConnections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.goToNextPage).toBe('function');
    expect(typeof result.current.goToPrevPage).toBe('function');
    expect(typeof result.current.goToPage).toBe('function');
  });

  it('should provide filter setters', async () => {
    const { result } = renderHook(() => useDreamConnections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.setCategoryFilter).toBe('function');
    expect(typeof result.current.setLocationFilter).toBe('function');
    expect(typeof result.current.setSearchTerm).toBe('function');
  });

  it('should handle search term updates (debounced)', async () => {
    const { result } = renderHook(() => useDreamConnections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearchTerm('John');
    });

    // Verify search term was set
    await waitFor(() => {
      expect(result.current.searchTerm).toBe('John');
    });
  });

  it('should handle errors gracefully', async () => {
    peopleService.getAllUsers.mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useDreamConnections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.connections).toEqual([]);
  });
});
