// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useMemo, useCallback } from 'react';
import adminService from '../services/adminService';

/**
 * Custom hook for Admin Dashboard data management
 * Handles loading users, analytics, and managing admin filters
 */
export function useAdminData() {
  // Data state
  const [allUsers, setAllUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [offices, setOffices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [anonymizeNames, setAnonymizeNames] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'users'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  /**
   * Load admin data from the API
   */
  const loadAdminData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const [usersResult, analyticsResult, officesResult] = await Promise.all([
        adminService.getAllUsersForAdmin(),
        adminService.getAdminAnalytics(),
        adminService.getOffices()
      ]);

      // Handle service response format
      const users = usersResult.success ? usersResult.data : [];
      const analyticsData = analyticsResult.success ? analyticsResult.data : null;
      const officesData = officesResult.success ? officesResult.data : [];

      setAllUsers(users);
      setAnalytics(analyticsData);
      setOffices(officesData);
      
      console.log('✅ Loaded admin data:', {
        users: users.length,
        offices: officesData.length,
        analytics: !!analyticsData
      });
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      setError(error.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  /**
   * Refresh data manually
   */
  const refreshData = useCallback(async () => {
    await loadAdminData();
  }, [loadAdminData]);

  /**
   * Calculate derived metrics
   */
  const totalUsers = useMemo(() => analytics?.totalUsers || 0, [analytics]);
  const dreamBookPercentage = useMemo(() => analytics?.dreamBookPercentage || 0, [analytics]);
  const categoryStats = useMemo(() => analytics?.categoryStats || [], [analytics]);
  const topConnectors = useMemo(() => analytics?.topConnectors || [], [analytics]);
  const lowEngagementUsers = useMemo(() => analytics?.lowEngagementUsers || [], [analytics]);

  /**
   * Filter users by selected office
   */
  const filteredUsers = useMemo(() => {
    if (selectedOffice === 'all') {
      return allUsers;
    }
    return allUsers.filter(user => user.office === selectedOffice);
  }, [allUsers, selectedOffice]);

  /**
   * Anonymize name if privacy mode is enabled
   */
  const anonymizeName = useCallback((name) => {
    if (!anonymizeNames) return name;
    const parts = name.split(' ');
    return `${parts[0][0]}. ${parts[1] ? parts[1][0] + '.' : ''}`;
  }, [anonymizeNames]);

  /**
   * Anonymize email if privacy mode is enabled
   */
  const anonymizeEmail = useCallback((email) => {
    if (!anonymizeNames) return email;
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  }, [anonymizeNames]);

  /**
   * Handle opening user modal
   */
  const handleOpenUserModal = useCallback((user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  }, []);

  /**
   * Handle closing user modal
   */
  const handleCloseUserModal = useCallback(() => {
    setSelectedUser(null);
    setShowUserModal(false);
  }, []);

  /**
   * Calculate average score
   */
  const averageScore = useMemo(() => {
    if (totalUsers === 0) return 0;
    const sum = allUsers.reduce((acc, user) => acc + (user.score || 0), 0);
    return Math.round(sum / totalUsers);
  }, [allUsers, totalUsers]);

  return {
    // Loading and error states
    isLoading,
    error,
    
    // Data
    allUsers,
    analytics,
    offices,
    filteredUsers,
    
    // Metrics
    totalUsers,
    dreamBookPercentage,
    categoryStats,
    topConnectors,
    lowEngagementUsers,
    averageScore,
    
    // Filter state
    anonymizeNames,
    setAnonymizeNames,
    selectedOffice,
    setSelectedOffice,
    viewMode,
    setViewMode,
    
    // Modal state
    selectedUser,
    showUserModal,
    handleOpenUserModal,
    handleCloseUserModal,
    
    // Actions
    refreshData,
    anonymizeName,
    anonymizeEmail,
  };
}





