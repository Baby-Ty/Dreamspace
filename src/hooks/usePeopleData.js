import { useState, useEffect, useMemo, useCallback } from 'react';
import peopleService from '../services/peopleService';

/**
 * Custom hook for People Dashboard data management
 * Handles fetching, caching, filtering, and transformations
 */
export function usePeopleData() {
  // Data state
  const [allUsers, setAllUsers] = useState([]);
  const [teamRelationships, setTeamRelationships] = useState([]);
  const [teamMetricsCache, setTeamMetricsCache] = useState({});
  const [coachingAlertsCache, setCoachingAlertsCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filterOffice, setFilterOffice] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('performance');
  const [userFilter, setUserFilter] = useState('unassigned'); // 'unassigned' | 'all' | 'deactivated'
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize localStorage for development mode
      await peopleService.initializeLocalStorage();

      // Load users and team relationships
      // Include inactive users to populate deactivated list
      const [usersResult, teamsResult] = await Promise.all([
        peopleService.getAllUsers(true), // true = include inactive
        peopleService.getTeamRelationships()
      ]);

      // Handle service results
      const users = usersResult.success ? usersResult.data : [];
      const teams = teamsResult.success ? teamsResult.data : [];

      setAllUsers(users);
      setTeamRelationships(teams);

      // Load metrics and alerts for each coach
      const metricsPromises = teams.map(team => 
        peopleService.getTeamMetrics(team.managerId)
          .then(result => result.success ? result.data : null)
          .catch(() => null)
      );

      const alertsPromises = teams.map(team => 
        peopleService.getCoachingAlerts(team.managerId)
          .then(result => result.success ? result.data : [])
          .catch(() => [])
      );

      const [metricsResults, alertsResults] = await Promise.all([
        Promise.all(metricsPromises),
        Promise.all(alertsPromises)
      ]);

      // Cache the results
      const newMetricsCache = {};
      const newAlertsCache = {};
      
      teams.forEach((team, index) => {
        newMetricsCache[team.managerId] = metricsResults[index];
        newAlertsCache[team.managerId] = alertsResults[index];
      });

      setTeamMetricsCache(newMetricsCache);
      setCoachingAlertsCache(newAlertsCache);

      console.log('✅ People dashboard data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading people dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Transform teams into coach objects with metrics
  const coaches = useMemo(() => {
    return teamRelationships.map(team => {
      const coach = allUsers.find(user => user.id === team.managerId);
      const teamMetrics = teamMetricsCache[team.managerId];
      const alerts = coachingAlertsCache[team.managerId] || [];
      
      return {
        ...coach,
        teamName: team.teamName,
        teamMetrics,
        alerts,
        performanceScore: teamMetrics ? teamMetrics.averageScore : 0,
        teamData: team
      };
    }).filter(coach => coach.id); // Filter out undefined coaches
  }, [teamRelationships, allUsers, teamMetricsCache, coachingAlertsCache]);

  // Separate active and deactivated users
  const activeUsers = useMemo(() => {
    return allUsers.filter(user => user.isActive !== false);
  }, [allUsers]);

  const deactivatedUsers = useMemo(() => {
    return allUsers.filter(user => user.isActive === false);
  }, [allUsers]);

  // Filter and sort coaches
  const filteredCoaches = useMemo(() => {
    let filtered = coaches.filter(coach => {
      const matchesOffice = filterOffice === 'all' || coach.office === filterOffice;
      const matchesSearch = coach.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coach.teamName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesOffice && matchesSearch;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'team-size':
          return (b.teamMetrics?.teamSize || 0) - (a.teamMetrics?.teamSize || 0);
        case 'alerts':
          return (b.alerts?.length || 0) - (a.alerts?.length || 0);
        default: // performance
          return (b.performanceScore || 0) - (a.performanceScore || 0);
      }
    });
  }, [coaches, filterOffice, searchTerm, sortBy]);

  // Get unassigned users (only from active users)
  const unassignedUsers = useMemo(() => {
    const coachIds = new Set(teamRelationships.map(team => team.managerId));
    const assignedUserIds = new Set(teamRelationships.flatMap(team => team.teamMembers || []));
    
    return activeUsers.filter(user => 
      !coachIds.has(user.id) && !assignedUserIds.has(user.id)
    );
  }, [activeUsers, teamRelationships]);

  // Get displayed users based on filter and search
  const displayedUsers = useMemo(() => {
    let baseUsers;
    
    switch (userFilter) {
      case 'all':
        baseUsers = activeUsers;
        break;
      case 'deactivated':
        baseUsers = deactivatedUsers;
        break;
      case 'unassigned':
      default:
        baseUsers = unassignedUsers;
        break;
    }
    
    if (userSearchTerm.trim()) {
      baseUsers = baseUsers.filter(user => 
        user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.office?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
    }
    
    return baseUsers;
  }, [userFilter, activeUsers, deactivatedUsers, unassignedUsers, userSearchTerm]);

  // Calculate overall metrics (use active users only)
  const overallMetrics = useMemo(() => {
    const totalEmployees = activeUsers.length;
    const totalCoaches = coaches.length;
    const totalTeamMembers = coaches.reduce((sum, coach) => sum + (coach.teamMetrics?.teamSize || 0), 0);
    const totalUnassigned = unassignedUsers.length;
    const avgEngagement = coaches.length > 0 
      ? coaches.reduce((sum, coach) => sum + (coach.teamMetrics?.engagementRate || 0), 0) / coaches.length
      : 0;
    const totalAlerts = coaches.reduce((sum, coach) => sum + (coach.alerts?.length || 0), 0);
    const avgTeamScore = coaches.length > 0
      ? coaches.reduce((sum, coach) => sum + (coach.performanceScore || 0), 0) / coaches.length
      : 0;

    return {
      totalEmployees,
      totalCoaches,
      totalTeamMembers,
      totalUnassigned,
      avgEngagement: Math.round(avgEngagement || 0),
      totalAlerts,
      avgTeamScore: Math.round(avgTeamScore || 0),
      programAdoption: totalEmployees > 0 
        ? Math.round(((totalTeamMembers + totalCoaches) / totalEmployees) * 100)
        : 0
    };
  }, [coaches, activeUsers.length, unassignedUsers.length]);

  // Get unique offices
  const offices = useMemo(
    () => [...new Set(allUsers.map(user => user.office).filter(Boolean))],
    [allUsers]
  );

  return {
    // Data
    allUsers,
    activeUsers,
    deactivatedUsers,
    coaches: filteredCoaches,
    unassignedUsers,
    displayedUsers,
    overallMetrics,
    offices,
    teamRelationships,
    
    // State
    loading,
    error,
    
    // Filters
    filterOffice,
    setFilterOffice,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    userFilter,
    setUserFilter,
    userSearchTerm,
    setUserSearchTerm,
    
    // Actions
    refreshData: loadData
  };
}
