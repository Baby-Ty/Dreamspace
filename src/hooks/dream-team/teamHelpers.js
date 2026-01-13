import { getCurrentWeek } from '../../services/currentWeekService';

/**
 * Generate accent color from user ID hash
 */
export function getAccentColor(userId) {
  if (!userId) return 'netsurit-red';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['netsurit-red', 'netsurit-coral', 'netsurit-orange'];
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Calculate activity status based on recent activity
 */
export function getActivityStatus(member) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentDreamUpdates = (member.dreamBook || []).filter(dream => {
    const updatedAt = dream.updatedAt || dream.createdAt;
    if (!updatedAt) return false;
    const updateDate = new Date(updatedAt);
    return updateDate > oneWeekAgo;
  });

  const hasRecentActivity = recentDreamUpdates.length > 0;

  if (hasRecentActivity) {
    return 'active';
  }

  const monthDreamUpdates = (member.dreamBook || []).filter(dream => {
    const updatedAt = dream.updatedAt || dream.createdAt;
    if (!updatedAt) return false;
    const updateDate = new Date(updatedAt);
    return updateDate > oneMonthAgo;
  });

  if (monthDreamUpdates.length > 0) {
    return 'recent';
  }

  return 'inactive';
}

/**
 * Calculate completed goals and dreams counts
 */
export function calculateCompletionStats(member) {
  const dreams = member.dreamBook || [];
  
  let completedGoalsCount = 0;
  dreams.forEach(dream => {
    const goals = dream.goals || [];
    completedGoalsCount += goals.filter(g => g.completed === true).length;
  });

  const completedDreamsCount = dreams.filter(dream => 
    dream.progress === 100 || dream.completed === true
  ).length;

  return { completedGoalsCount, completedDreamsCount };
}

/**
 * Calculate weekly progress percentage
 */
export async function calculateWeeklyProgress(memberId) {
  try {
    const weekResult = await getCurrentWeek(memberId);
    if (weekResult.success && weekResult.data?.goals) {
      const goals = weekResult.data.goals;
      const totalGoals = goals.length;
      if (totalGoals === 0) return 0;
      const completedGoals = goals.filter(g => g.completed === true).length;
      return Math.round((completedGoals / totalGoals) * 100);
    }
    return 0;
  } catch (error) {
    console.warn(`⚠️ Could not calculate weekly progress for member ${memberId}:`, error);
    return 0;
  }
}
