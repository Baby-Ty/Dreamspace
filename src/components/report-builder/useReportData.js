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

  // Helper: Get active weeks count (weeks with score > 0%)
  const getActiveWeeksCount = useCallback(async (userId) => {
    try {
      const response = await getPastWeeks(userId);
      if (!response.success) return 0;
      const weekHistory = response.data?.weekHistory || {};
      return Object.values(weekHistory).filter(week => week.score > 0).length;
    } catch (error) {
      console.error(`❌ Error fetching past weeks for user ${userId}:`, error);
      return 0;
    }
  }, []);

  // Generate report data from real sources
  const generateReportData = useCallback(async () => {
    setIsLoadingData(true);

    try {
      // Step 1: Resolve each user's team upfront
      const userTeamMap = new Map();
      allUsers.forEach(user => {
        const userIdStr = String(user.id);
        const userTeam = teamRelationships.find(team =>
          team.teamMembers && team.teamMembers.some(memberId => String(memberId) === userIdStr)
        ) || teamRelationships.find(team => String(team.managerId) === userIdStr);
        userTeamMap.set(user.id, userTeam);
      });

      // Step 2: Apply team filter
      const filteredUsers = allUsers.filter(user => {
        if (selectedTeams[0] === 'all') return true;
        const userTeam = userTeamMap.get(user.id);
        if (!userTeam) return false;
        return selectedTeams.map(String).includes(String(userTeam.managerId));
      });

      // Step 3: Pre-fetch meeting data ONCE per unique team (avoids N duplicate calls)
      const uniqueTeamIds = [
        ...new Set(
          filteredUsers
            .map(user => {
              const userTeam = userTeamMap.get(user.id);
              return userTeam?.teamId || userTeam?.id;
            })
            .filter(Boolean)
        )
      ];

      const meetingsByTeam = {};
      await Promise.all(
        uniqueTeamIds.map(async (teamId) => {
          try {
            console.log(`📅 Pre-fetching meetings for team ${teamId}`);
            const response = await coachingService.getMeetingAttendanceHistory(teamId);
            meetingsByTeam[teamId] = response.success ? (response.data || []) : [];
          } catch (err) {
            console.warn(`⚠️ Failed to fetch meetings for team ${teamId}:`, err);
            meetingsByTeam[teamId] = [];
          }
        })
      );

      // Step 4: Process users in batches to avoid overwhelming the API
      // (getPastWeeks is still 1 call per user, batching keeps concurrency manageable)
      const BATCH_SIZE = 8;
      const startDateStr = dateRange.startDate;
      const endDateStr = dateRange.endDate;

      const processUser = async (user) => {
        const userTeam = userTeamMap.get(user.id);
        const teamId = userTeam?.teamId || userTeam?.id;
        const userIdStr = String(user.id);

        // Count meetings from pre-fetched cache (no extra API call)
        const teamMeetings = meetingsByTeam[teamId] || [];
        const meetingsAttended = teamMeetings.filter(meeting => {
          const meetingDateStr = meeting.date ? meeting.date.split('T')[0] : null;
          if (!meetingDateStr) return false;
          if (meetingDateStr < startDateStr || meetingDateStr > endDateStr) return false;
          return meeting.attendees?.some(a => String(a.id) === userIdStr && a.present);
        }).length;

        // Only fetch dreams from API if dreamBook is not present on the user object at all
        // (getAllUsers returns dreamBook for privileged callers, even if empty array)
        let dreams = user.dreamBook != null ? user.dreamBook : null;
        if (dreams === null) {
          try {
            const userDataResult = await databaseService.loadFromCosmosDB(user.id);
            if (userDataResult.success && userDataResult.data) {
              dreams = userDataResult.data.dreamBook || [];
            }
          } catch {
            dreams = [];
          }
        }
        dreams = dreams || [];

        const publicDreams = dreams.filter(d => d.isPublic);
        const completedDreams = dreams.filter(d => d.completed);
        const allGoals = dreams.flatMap(d => d.goals || []);
        const completedGoals = allGoals.filter(g => g.completed);

        const categoryBreakdown = dreams.reduce((acc, dream) => {
          const category = dream.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        const engagementWeeksActive = await getActiveWeeksCount(user.id);

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
      };

      const results = [];
      for (let i = 0; i < filteredUsers.length; i += BATCH_SIZE) {
        const batch = filteredUsers.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(processUser));
        results.push(...batchResults);
      }
      return results.filter(Boolean);
    } catch (error) {
      console.error('Error generating report data:', error);
      return [];
    } finally {
      setIsLoadingData(false);
    }
  }, [allUsers, teamRelationships, selectedTeams, dateRange, getActiveWeeksCount]);

  // Load report data when filters change — skip if no team has been selected yet
  useEffect(() => {
    if (isOpen && selectedTeams.length > 0) {
      generateReportData().then(setReportData);
    } else if (!isOpen || selectedTeams.length === 0) {
      setReportData([]);
    }
  }, [isOpen, dateRange, selectedTeams, generateReportData]);

  return {
    reportData,
    isLoadingData,
    teams,
    refreshData: generateReportData
  };
}
