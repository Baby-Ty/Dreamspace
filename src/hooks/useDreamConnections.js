// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState, useEffect, useMemo, useCallback } from 'react';
import peopleService from '../services/peopleService';
import { useApp } from '../context/AppContext';

/**
 * Custom hook for Dream Connect data management
 * Handles fetching, filtering, pagination, and connection generation
 */
export function useDreamConnections() {
  const { currentUser } = useApp();
  
  // Data state
  const [allUsers, setAllUsers] = useState([]);
  const [suggestedConnections, setSuggestedConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 8; // 2 rows of 4 columns

  // Don't auto-load - Dream Connect is a "Coming Soon" feature
  // Data loads only when the component explicitly calls refreshData() on mount
  // This prevents expensive getAllUsers call from running on every app load
  useEffect(() => {
    // No-op: Defer loading until page is actually visited
    setIsLoading(false);
  }, []);

  const loadData = useCallback(async () => {
    const userId = currentUser?.id || currentUser?.userId;
    if (!userId) {
      console.log('❌ DreamConnect: No user ID, skipping load');
      setIsLoading(false);
      return;
    }

    console.log('🔄 DreamConnect: Loading connections', {
      currentUserId: userId,
      currentUserName: currentUser?.name
    });

    try {
      setError(null);
      setIsLoading(true);

      // Get all users
      const usersResult = await peopleService.getAllUsers();
      const users = usersResult.success ? usersResult.data : [];
      
      setAllUsers(users);

      // Generate suggested connections
      const suggestions = generateSuggestedConnections(users, currentUser);
      setSuggestedConnections(suggestions);

      console.log('✅ Dream Connect data loaded:', {
        totalUsers: users.length,
        suggestions: suggestions.length
      });
    } catch (err) {
      console.error('❌ Error loading Dream Connect data:', err);
      setError(err.message || 'Failed to load users');
      setSuggestedConnections([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Generate suggested connections based on shared interests
  const generateSuggestedConnections = useCallback((users, user) => {
    if (!users || !user) return [];

    const currentUserId = user.id || user.userId;

    // Filter out current user
    const otherUsers = users.filter(u => 
      u.id !== currentUserId && 
      u.userId !== currentUserId &&
      u.id !== user.id && 
      u.userId !== user.userId
    );

    // Calculate shared categories and create suggestions
    return otherUsers.map(u => {
      const sharedCategories = getSharedCategories(
        user.dreamCategories || [], 
        u.dreamCategories || []
      );

      return {
        ...u,
        sharedCategories,
        sampleDreams: u.sampleDreams || generateSampleDreamsFromCategories(u.dreamCategories || [])
      };
    })
    // Sort by compatibility (shared categories), then activity, then name
    .sort((a, b) => {
      const diff = b.sharedCategories.length - a.sharedCategories.length;
      if (diff !== 0) return diff;
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, []);

  const getSharedCategories = (userCats, otherCats) => {
    return userCats.filter(cat => otherCats.includes(cat));
  };

  const generateSampleDreamsFromCategories = (categories) => {
    const samplesByCategory = {
      'Learning': { title: 'Learn a New Skill', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=60&auto=format&fit=crop' },
      'Health': { title: 'Get Fit — 3x a Week', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=60&auto=format&fit=crop' },
      'Travel': { title: 'Visit a New Country', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=60&auto=format&fit=crop' },
      'Creative': { title: 'Start a Creative Project', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&q=60&auto=format&fit=crop' },
      'Career': { title: 'Earn a Certification', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=60&auto=format&fit=crop' },
      'Financial': { title: 'Save for a Big Goal', image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=60&auto=format&fit=crop' },
      'Community': { title: 'Volunteer for a Cause', image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=60&auto=format&fit=crop' }
    };

    return categories.slice(0, 3).map(category => ({
      title: samplesByCategory[category]?.title || 'Personal Growth Goal',
      category,
      image: samplesByCategory[category]?.image || 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=600&q=60&auto=format&fit=crop'
    }));
  };

  // Map "Finance" to "Financial" for consistency
  const mapCategory = useCallback((c) => (c === 'Finance' ? 'Financial' : c), []);

  // Filter connections based on category, location, and search
  const filteredConnections = useMemo(() => {
    return suggestedConnections.filter(u => {
      // Category filter
      if (categoryFilter !== 'All') {
        const userCategories = u.dreamCategories || [];
        if (!userCategories.includes(mapCategory(categoryFilter))) {
          return false;
        }
      }
      
      // Location filter
      if (locationFilter !== 'All' && u.office !== locationFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(term);
        const matchesOffice = u.office?.toLowerCase().includes(term);
        const matchesCategories = u.dreamCategories?.some(cat => 
          cat.toLowerCase().includes(term)
        );
        return matchesName || matchesOffice || matchesCategories;
      }
      
      return true;
    });
  }, [suggestedConnections, categoryFilter, locationFilter, searchTerm, mapCategory]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredConnections.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedConnections = filteredConnections.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, locationFilter, searchTerm]);

  // Get unique locations for filter
  const locations = useMemo(
    () => ['All', ...new Set(allUsers.map(u => u.office).filter(Boolean))],
    [allUsers]
  );

  // Navigation handlers
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return {
    // Data
    connections: paginatedConnections,
    filteredCount: filteredConnections.length,
    totalCount: suggestedConnections.length,
    allUsersCount: allUsers.length,
    locations,
    
    // State
    isLoading,
    error,
    
    // Filters
    categoryFilter,
    setCategoryFilter,
    locationFilter,
    setLocationFilter,
    searchTerm,
    setSearchTerm,
    
    // Pagination
    currentPage,
    totalPages,
    goToNextPage,
    goToPrevPage,
    goToPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    
    // Actions
    refreshData: loadData,
    mapCategory
  };
}

