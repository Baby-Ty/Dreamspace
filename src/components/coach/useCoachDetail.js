import { useState, useMemo, useEffect, useCallback } from 'react';

/**
 * Custom hook for CoachDetailModal business logic
 * Handles filtering, sorting, and derived data
 */
export function useCoachDetail(coach) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('score');

  // Extract team data
  const teamMetrics = coach?.teamMetrics;
  const coachingAlerts = coach?.alerts || [];
  const teamMembers = teamMetrics?.teamMembers || [];

  // Filter and sort team members
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = teamMembers.filter(member => {
      switch (filterStatus) {
        case 'excelling':
          return member.score >= 60;
        case 'on-track':
          return member.score >= 30 && member.score < 60;
        case 'needs-attention':
          return member.score < 30;
        default:
          return true;
      }
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'dreams':
          return (b.dreamsCount || 0) - (a.dreamsCount || 0);
        case 'connects':
          return (b.connectsCount || 0) - (a.connectsCount || 0);
        default: // score
          return (b.score || 0) - (a.score || 0);
      }
    });
  }, [teamMembers, filterStatus, sortBy]);

  // Status helpers
  const getStatusColor = useCallback((score) => {
    if (score >= 60) return 'text-professional-gray-700 bg-professional-gray-100 border-professional-gray-300';
    if (score >= 30) return 'text-professional-gray-700 bg-professional-gray-100 border-professional-gray-300';
    return 'text-amber-800 bg-amber-100 border-amber-300';
  }, []);

  const getStatusText = useCallback((score) => {
    if (score >= 60) return 'Excelling';
    if (score >= 30) return 'On Track';
    return 'Needs Attention';
  }, []);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    if (!teamMetrics) return null;

    const exceeding = teamMembers.filter(m => m.score >= 60).length;
    const onTrack = teamMembers.filter(m => m.score >= 30 && m.score < 60).length;
    const needsAttention = teamMembers.filter(m => m.score < 30).length;

    return {
      teamSize: teamMetrics.teamSize || teamMembers.length,
      averageScore: teamMetrics.averageScore || 0,
      engagementRate: teamMetrics.engagementRate || 0,
      exceeding,
      onTrack,
      needsAttention,
      totalDreams: teamMembers.reduce((sum, m) => sum + (m.dreamsCount || 0), 0),
      totalConnects: teamMembers.reduce((sum, m) => sum + (m.connectsCount || 0), 0)
    };
  }, [teamMetrics, teamMembers]);

  return {
    // Tab state
    activeTab,
    setActiveTab,
    
    // Filter/sort state
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    
    // Data
    teamMetrics,
    coachingAlerts,
    teamMembers,
    filteredAndSortedMembers,
    summaryMetrics,
    
    // Helpers
    getStatusColor,
    getStatusText
  };
}

