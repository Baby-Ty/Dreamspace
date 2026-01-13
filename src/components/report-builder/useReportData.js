import { useState, useCallback, useEffect, useMemo } from 'react';
import { coachingService } from '../../services/coachingService';
import { getPastWeeks } from '../../services/weekHistoryService';
import databaseService from '../../services/databaseService';

/**
 * Hook for fetching and managing report data
 * Handles meeting attendance, engagement metrics, and user dreams data
 */
export function useReportData({
  isOpen,
  allUsers,
  teamRelationships,
  selectedTeams,
  dateRange
}) {
  const [reportData, setReportData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Teams with coach names
  const teams = useMemo(() => {
    return teamRelationships.map(team => {
      const coach = allUsers.find(u => u.id === team.managerId);
      return {
        id: team.managerId,
        name: team.teamName,
        coachName: coach?.name || 'Unknown Coach',
        teamId: team.teamId || team.id
      };
    });
  }, [teamRelationships, allUsers]);

  // Helper: Get meeting attendance count for a user's team within date range
  const getMeetingAttendanceCount = useCallback(async (userId, teamId) => {
    if (!teamId) {
      console.log(`⚠️ No teamId for user ${userId}, skipping meeting attendance`);
      return 0;
    }
    
    try {
      console.log(`📅 Fetching meeting attendance for user ${userId}, team ${teamId}`);
      const response = await coachingService.getMeetingAttendanceHistory(teamId);
      
      if (!response.success) {
        console.warn(`⚠️ Failed to fetch meeting attendance for team ${teamId}:`, response.error);
        return 0;
      }
      
      const meetings = response.data || [];
      const startDateStr = dateRange.startDate;
      const endDateStr = dateRange.endDate;
      const userIdStr = String(userId);
      
      // Filter meetings within date range
      const filteredMeetings = meetings.filter(meeting => {
        const meetingDateStr = meeting.date ? meeting.date.split('T')[0] : null;
        if (!meetingDateStr) return false;
        return meetingDateStr >= startDateStr && meetingDateStr <= endDateStr;
      });
      
      // Count user's attendance
      const attendanceCount = filteredMeetings.reduce((count, meeting) => {
        const attendee = meeting.attendees?.find(a => String(a.id) === userIdStr);
        return attendee?.present ? count + 1 : count;
      }, 0);
      
      return attendanceCount;
    } catch (error) {
      console.error(`❌ Error fetching meeting attendance for user ${userId}, team ${teamId}:`, error);
      return 0;
    }
  }, [dateRange]);

  // Helper: Get active weeks count (weeks with score > 0%)
  const getActiveWeeksCount = useCallback(async (userId) => {
    try {
      const response = await getPastWeeks(userId);
      
      if (!response.success) {
        return 0;
      }
      
      const weekHistory = response.data?.weekHistory || {};
      const activeWeeks = Object.values(weekHistory).filter(week => week.score > 0);
      return activeWeeks.length;
    } catch (error) {
      console.error(`❌ Error fetching past weeks for user ${userId}:`, error);
      return 0;
    }
  }, []);

  // Generate report data from real sources
  const generateReportData = useCallback(async () => {
    setIsLoadingData(true);
    
    try {
      const reportPromises = allUsers.map(async (user) => {
        const userIdStr = String(user.id);
        const userTeam = teamRelationships.find(team => 
          team.teamMembers && team.teamMembers.some(memberId => String(memberId) === userIdStr)
        );
        
        // Apply team filter
        if (selectedTeams[0] !== 'all') {
          if (!userTeam) return null;
          
          const userTeamManagerId = String(userTeam.managerId);
          const selectedTeamIds = selectedTeams.map(id => String(id));
          
          if (!selectedTeamIds.includes(userTeamManagerId)) return null;
        }

        // Fetch dreams if not already in user object
        let dreams = user.dreamBook || [];
        
        if (!dreams || dreams.length === 0) {
          try {
            const userDataResult = await databaseService.loadFromCosmosDB(user.id);
            if (userDataResult.success && userDataResult.data) {
              dreams = userDataResult.data.dreamBook || [];
            }
          } catch (dreamError) {
            dreams = [];
          }
        }

        const publicDreams = dreams.filter(d => d.isPublic);
        const completedDreams = dreams.filter(d => d.completed);
        const allGoals = dreams.flatMap(d => d.goals || []);
        const completedGoals = allGoals.filter(g => g.completed);
        
        // Group dreams by category
        const categoryBreakdown = dreams.reduce((acc, dream) => {
          const category = dream.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        const teamId = userTeam?.teamId || userTeam?.id;
        
        // Fetch async data
        const [meetingsAttended, engagementWeeksActive] = await Promise.all([
          getMeetingAttendanceCount(user.id, teamId),
          getActiveWeeksCount(user.id)
        ]);

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          team: userTeam?.teamName || 'No Team',
          coach: userTeam ? allUsers.find(u => u.id === userTeam.managerId)?.name : 'No Coach',
          meetingsAttended,
          dreamsCreated: dreams.length,
          dreamsCompleted: completedDreams.length,
          publicDreamTitles: publicDreams.map(d => d.title),
          dreamCategories: categoryBreakdown,
          goalsCreated: allGoals.length,
          goalsCompleted: completedGoals.length,
          engagementWeeksActive
        };
      });

      const results = await Promise.all(reportPromises);
      return results.filter(Boolean);
    } catch (error) {
      console.error('Error generating report data:', error);
      return [];
    } finally {
      setIsLoadingData(false);
    }
  }, [allUsers, teamRelationships, selectedTeams, getMeetingAttendanceCount, getActiveWeeksCount]);

  // Load report data when filters change
  useEffect(() => {
    if (isOpen) {
      generateReportData().then(setReportData);
    }
  }, [isOpen, dateRange, selectedTeams, generateReportData]);

  return {
    reportData,
    isLoadingData,
    teams,
    refreshData: generateReportData
  };
}
