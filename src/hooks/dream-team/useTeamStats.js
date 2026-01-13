import { useMemo } from 'react';

/**
 * Hook for computing team statistics
 */
export function useTeamStats(teamData, teamMembers) {
  return useMemo(() => {
    if (!teamData || !teamMembers.length) {
      return {
        totalScore: 0,
        averageScore: 0,
        engagementRate: 0,
        totalDreams: 0,
        totalConnects: 0,
        memberRegions: [],
        sharedInterests: [],
        recentlyCompletedDreams: [],
        goalsCloseToFinish: []
      };
    }

    // Basic stats from API
    const totalScore = teamData.totalScore || 0;
    const averageScore = teamData.averageScore || 0;
    const engagementRate = teamData.engagementRate || 0;
    const totalDreams = teamData.totalDreams || 0;
    const totalConnects = teamData.totalConnects || 0;

    // Member regions (unique offices)
    const memberRegions = [...new Set(
      teamMembers
        .map(m => m.office)
        .filter(Boolean)
    )];

    // Shared interests (dream categories that appear in multiple members)
    const categoryCounts = {};
    teamMembers.forEach(member => {
      let categories = member.dreamCategories || [];
      if (categories.length === 0 && member.dreamBook) {
        categories = [...new Set(member.dreamBook.map(d => d.category).filter(Boolean))];
      }
      categories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });
    const sharedInterests = Object.entries(categoryCounts)
      .filter(([_, count]) => count > 1)
      .map(([category]) => category)
      .slice(0, 10);

    // Recently completed dreams (only public dreams)
    const recentlyCompletedDreams = [];
    teamMembers.forEach(member => {
      const dreams = (member.dreamBook || []).filter(dream => dream.isPublic === true);
      dreams.forEach(dream => {
        const hasCompletedGoals = dream.goals?.some(g => g.completed) || false;
        const isCompleted = dream.progress === 100 || dream.completed;
        if (hasCompletedGoals || isCompleted) {
          recentlyCompletedDreams.push({
            dreamId: dream.id,
            title: dream.title,
            category: dream.category,
            memberName: member.name,
            memberId: member.id,
            completedAt: dream.updatedAt || dream.createdAt
          });
        }
      });
    });
    recentlyCompletedDreams.sort((a, b) => {
      const dateA = new Date(a.completedAt || 0);
      const dateB = new Date(b.completedAt || 0);
      return dateB - dateA;
    });

    // Goals close to finish (weeksRemaining <= 2, only from public dreams)
    const goalsCloseToFinish = [];
    teamMembers.forEach(member => {
      const dreams = (member.dreamBook || []).filter(dream => dream.isPublic === true);
      dreams.forEach(dream => {
        const goals = dream.goals || [];
        goals.forEach(goal => {
          if (goal.active && !goal.completed && goal.weeksRemaining !== undefined) {
            if (goal.weeksRemaining <= 2 && goal.weeksRemaining > 0) {
              goalsCloseToFinish.push({
                goalId: goal.id,
                goalTitle: goal.title,
                dreamTitle: dream.title,
                dreamCategory: dream.category,
                memberName: member.name,
                memberId: member.id,
                weeksRemaining: goal.weeksRemaining
              });
            }
          }
        });
      });
    });
    goalsCloseToFinish.sort((a, b) => a.weeksRemaining - b.weeksRemaining);

    return {
      totalScore,
      averageScore,
      engagementRate,
      totalDreams,
      totalConnects,
      memberRegions,
      sharedInterests,
      recentlyCompletedDreams: recentlyCompletedDreams.slice(0, 5),
      goalsCloseToFinish: goalsCloseToFinish.slice(0, 5)
    };
  }, [teamData, teamMembers]);
}
