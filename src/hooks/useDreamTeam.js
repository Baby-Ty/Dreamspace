// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { coachingService } from '../services/coachingService';
import { useApp } from '../context/AppContext';
import peopleService from '../services/peopleService';
import { useTeamMemberEnhancer, useTeamStats } from './dream-team';

/**
 * Custom hook for Dream Team data management
 * Handles fetching team data, computing stats, and determining coach status
 */
export function useDreamTeam() {
  const { currentUser } = useApp();
  
  // Data state
  const [teamData, setTeamData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load team data
  useEffect(() => {
    loadTeamData();
  }, [currentUser?.id, currentUser?.userId]);

  const loadTeamData = useCallback(async () => {
    const userId = currentUser?.id || currentUser?.userId;
    if (!userId) {
      console.log('❌ DreamTeam: No user ID, skipping load');
      setIsLoading(false);
      return;
    }

    console.log('🔄 DreamTeam: Loading team data', {
      currentUserId: userId,
      currentUserName: currentUser?.name
    });

    try {
      setError(null);
      setIsLoading(true);

      // Get team metrics - try as coach first
      let metricsResult = await coachingService.getTeamMetrics(userId);
      
      console.log('🔍 Team metrics result:', {
        success: metricsResult.success,
        hasData: !!metricsResult.data,
        managerId: metricsResult.data?.managerId,
        teamMembersCount: metricsResult.data?.teamMembers?.length,
        userId
      });
      
      if (!metricsResult.success) {
        // If not found as coach, user might be a member - need to find their team
        let coachId = currentUser?.assignedCoachId || currentUser?.teamManagerId;
        
        // If coachId is not available, try to find it by querying team relationships
        if (!coachId || coachId === userId) {
          console.log('🔍 Coach ID not found in user data, querying team relationships...');
          try {
            const teamsResult = await peopleService.getTeamRelationships();
            if (teamsResult.success && Array.isArray(teamsResult.data)) {
              const userTeam = teamsResult.data.find(team => 
                team.teamMembers && team.teamMembers.includes(userId)
              );
              if (userTeam && userTeam.managerId) {
                coachId = userTeam.managerId;
                console.log('✅ Found team via team relationships:', coachId);
              }
            }
          } catch (teamQueryError) {
            console.warn('⚠️ Could not query team relationships:', teamQueryError);
          }
        }
        
        if (coachId && coachId !== userId) {
          metricsResult = await coachingService.getTeamMetrics(coachId);
          if (!metricsResult.success) {
            const errorMsg = typeof metricsResult.error === 'string' 
              ? metricsResult.error 
              : (metricsResult.error?.message || metricsResult.error?.error || 'Team not found');
            throw new Error(errorMsg);
          }
          console.log('✅ DreamTeam: Loaded as team member', {
            coachId,
            managerId: metricsResult.data?.managerId,
            teamMembers: metricsResult.data?.teamMembers?.length
          });
        } else {
          const errorMsg = typeof metricsResult.error === 'string' 
            ? metricsResult.error 
            : (metricsResult.error?.message || metricsResult.error?.error || 'Team not found');
          throw new Error(errorMsg);
        }
      } else {
        console.log('✅ DreamTeam: Loaded as coach', {
          managerId: metricsResult.data?.managerId,
          teamMembers: metricsResult.data?.teamMembers?.length
        });
      }
      
      setTeamData(metricsResult.data);
    } catch (err) {
      console.error('❌ Error loading Dream Team data:', err);
      setError(err.message || 'Failed to load team data');
      setTeamData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Enhance team members with avatars, dreams, and computed stats
  const { teamMembers, isEnhancing } = useTeamMemberEnhancer(teamData, currentUser);

  // Determine if current user is the coach
  const isCoach = useMemo(() => {
    if (!currentUser) return false;
    
    const userId = currentUser.id || currentUser.userId;
    
    // Check 1: User role field (string) - primary check
    if (currentUser.role === 'coach' || currentUser.role === 'manager') {
      console.log('✅ User is coach (role field):', currentUser.role);
      return true;
    }
    
    // Check 2: User roles object (nested) - secondary check
    if (currentUser.roles?.coach === true || currentUser.isCoach === true) {
      console.log('✅ User is coach (roles.coach or isCoach):', currentUser.roles?.coach, currentUser.isCoach);
      return true;
    }
    
    // Check 3: Team relationship (userId matches team managerId) - fallback check
    if (teamData?.managerId) {
      const isTeamCoach = userId === teamData.managerId;
      if (isTeamCoach) {
        console.log('✅ User is coach (team manager):', userId, '===', teamData.managerId);
        return true;
      }
    }
    
    // Check 4: If user has team members assigned, they're likely a coach
    if (teamData?.teamMembers && teamData.teamMembers.length > 0) {
      const hasTeamMembers = teamData.teamMembers.some(member => {
        const memberId = member.id || member.userId;
        return memberId !== userId;
      });
      if (hasTeamMembers && teamData.managerId === userId) {
        console.log('✅ User is coach (has team members and is manager):', teamData.teamMembers.length);
        return true;
      }
    }
    
    console.log('❌ User is NOT a coach:', {
      userId,
      role: currentUser.role,
      rolesCoach: currentUser.roles?.coach,
      isCoach: currentUser.isCoach,
      teamManagerId: teamData?.managerId,
      hasTeamMembers: teamData?.teamMembers?.length > 0
    });
    
    return false;
  }, [teamData, currentUser]);

  // Compute team statistics
  const teamStats = useTeamStats(teamData, teamMembers);

  // Combined loading state: true if API is loading OR team members are being enhanced
  const isTruelyLoading = isLoading || isEnhancing;

  return {
    // Data
    teamData,
    teamMembers,
    teamStats,
    isCoach,
    
    // State
    isLoading: isTruelyLoading,
    error,
    
    // Actions
    refreshData: loadTeamData
  };
}
