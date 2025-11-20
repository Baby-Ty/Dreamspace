// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import peopleService from '../services/peopleService';

/**
 * Custom hook for Dream Coach data management
 * Handles loading team metrics, coaching alerts, and team member filtering
 */
export function useDreamCoachData() {
  const { currentUser } = useApp();
  
  // Data state
  const [teamMetrics, setTeamMetrics] = useState(null);
  const [coachingAlerts, setCoachingAlerts] = useState([]);
  const [teamNotes, setTeamNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Load coach data from the API
   */
  const loadCoachData = useCallback(async () => {
    console.log('🎯 Loading coach data:', {
      hasCurrentUser: !!currentUser,
      currentUserId: currentUser?.id,
      currentUserUserId: currentUser?.userId,
    });
    
    // Use id or userId - handle both formats
    const userId = currentUser?.id || currentUser?.userId;
    if (!userId) {
      console.log('❌ No currentUser.id or currentUser.userId, skipping loadCoachData');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      
      console.log('🔄 Calling peopleService APIs with userId:', userId);

      const [metricsResult, alertsResult] = await Promise.all([
        peopleService.getTeamMetrics(userId),
        peopleService.getCoachingAlerts(userId)
      ]);

      console.log('📊 Raw API responses received:', {
        metricsResult,
        alertsResult,
        metricsSuccess: metricsResult?.success,
        alertsSuccess: alertsResult?.success
      });

      // Handle new { success, data, error } format
      if (!metricsResult?.success) {
        throw new Error(metricsResult?.error?.message || 'Failed to load team metrics');
      }
      if (!alertsResult?.success) {
        throw new Error(alertsResult?.error?.message || 'Failed to load coaching alerts');
      }

      const metrics = metricsResult.data;
      const alerts = alertsResult.data;

      setTeamMetrics(metrics);
      setCoachingAlerts(alerts || []);
      setTeamNotes([]); // For now, empty array until we implement coaching notes API
      
      console.log('✅ Loaded coach data:', {
        userId,
        hasMetrics: !!metrics,
        alertsCount: alerts?.length || 0,
        teamSize: metrics?.teamSize
      });
    } catch (error) {
      console.error('❌ Error loading coach data:', error);
      setError(error.message || 'Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, currentUser?.userId]);

  // Load data on mount and when user changes
  useEffect(() => {
    loadCoachData();
  }, [loadCoachData]);

  /**
   * Refresh data manually
   */
  const refreshData = useCallback(async () => {
    await loadCoachData();
  }, [loadCoachData]);

  /**
   * Get team members from metrics
   */
  const teamMembers = useMemo(() => {
    return teamMetrics?.teamMembers || [];
  }, [teamMetrics]);

  /**
   * Get filtered team members based on search and status
   */
  const filteredTeamMembers = useMemo(() => {
    let filtered = teamMembers;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(member => 
        member.name?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => {
        switch (filterStatus) {
          case 'at-risk':
            return member.riskLevel === 'high' || member.engagementLevel === 'low';
          case 'active':
            return member.engagementLevel === 'high' || member.engagementLevel === 'medium';
          case 'new':
            // Consider new if they have less than 2 dreams or joined recently
            return (member.dreamsCount || 0) < 2;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [teamMembers, searchTerm, filterStatus]);

  /**
   * Get urgent alerts (high priority)
   */
  const urgentAlerts = useMemo(() => {
    return coachingAlerts.filter(alert => 
      alert.priority === 'high' || alert.type === 'no-activity'
    );
  }, [coachingAlerts]);

  /**
   * Get metric value safely
   */
  const getMetricValue = useCallback((key, defaultValue = 0) => {
    return teamMetrics?.[key] ?? defaultValue;
  }, [teamMetrics]);

  return {
    // Loading and error states
    isLoading,
    error,
    
    // Data
    teamMetrics,
    coachingAlerts,
    urgentAlerts,
    teamNotes,
    teamMembers,
    filteredTeamMembers,
    
    // Filter state
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    
    // Actions
    refreshData,
    getMetricValue,
  };
}






