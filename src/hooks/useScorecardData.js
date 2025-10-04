// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useMemo } from 'react';
import { Trophy, Target, TrendingUp, Star, Medal } from 'lucide-react';

/**
 * Custom hook for scorecard calculations and data transformations
 * Centralizes all business logic for the scorecard page
 */
export function useScorecardData(currentUser, scoringHistory, scoringRules) {
  // Calculate total score
  const totalScore = useMemo(() => {
    return scoringHistory.reduce((sum, item) => sum + item.points, 0);
  }, [scoringHistory]);

  // Calculate dream progress statistics
  const dreamProgressStats = useMemo(() => {
    if (!currentUser?.dreamBook) {
      return {
        totalDreams: 0,
        averageProgress: 0,
        completedDreams: 0,
        activeDreams: 0
      };
    }

    const totalDreams = currentUser.dreamBook.length;
    const averageProgress = totalDreams > 0
      ? Math.round(currentUser.dreamBook.reduce((sum, dream) => sum + dream.progress, 0) / totalDreams)
      : 0;
    const completedDreams = currentUser.dreamBook.filter(dream => dream.progress === 100).length;
    const activeDreams = currentUser.dreamBook.filter(dream => dream.progress > 0 && dream.progress < 100).length;

    return {
      totalDreams,
      averageProgress,
      completedDreams,
      activeDreams
    };
  }, [currentUser?.dreamBook]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    return {
      dreamsCompleted: {
        count: scoringHistory.filter(item => item.type === 'dreamCompleted').length,
        points: scoringHistory.filter(item => item.type === 'dreamCompleted').reduce((sum, item) => sum + item.points, 0)
      },
      dreamConnects: {
        count: scoringHistory.filter(item => item.type === 'dreamConnect').length,
        points: scoringHistory.filter(item => item.type === 'dreamConnect').reduce((sum, item) => sum + item.points, 0)
      },
      groupAttendance: {
        count: scoringHistory.filter(item => item.type === 'groupAttendance').length,
        points: scoringHistory.filter(item => item.type === 'groupAttendance').reduce((sum, item) => sum + item.points, 0)
      },
      dreamProgress: {
        count: dreamProgressStats.totalDreams,
        points: dreamProgressStats.averageProgress
      }
    };
  }, [scoringHistory, dreamProgressStats]);

  // Get score level based on total points
  const getScoreLevel = useMemo(() => {
    return (score) => {
      if (score >= 100) return { level: 'Dream Master', icon: Medal, color: 'text-netsurit-warm-orange' };
      if (score >= 75) return { level: 'Dream Achiever', icon: Trophy, color: 'text-netsurit-red' };
      if (score >= 50) return { level: 'Dream Builder', icon: Star, color: 'text-netsurit-coral' };
      if (score >= 25) return { level: 'Dream Explorer', icon: TrendingUp, color: 'text-netsurit-orange' };
      return { level: 'Dream Starter', icon: Target, color: 'text-professional-gray-600' };
    };
  }, []);

  // Current level and progress
  const currentLevel = useMemo(() => getScoreLevel(totalScore), [totalScore, getScoreLevel]);
  const nextLevel = useMemo(() => getScoreLevel(totalScore + 25), [totalScore, getScoreLevel]);
  const progressToNext = useMemo(() => {
    return totalScore >= 100 ? 100 : ((totalScore % 25) / 25) * 100;
  }, [totalScore]);

  // Group history by date
  const groupedHistory = useMemo(() => {
    return scoringHistory.reduce((groups, item) => {
      const date = new Date(item.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {});
  }, [scoringHistory]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedHistory).sort((a, b) => new Date(b) - new Date(a));
  }, [groupedHistory]);

  return {
    totalScore,
    dreamProgressStats,
    categoryStats,
    currentLevel,
    nextLevel,
    progressToNext,
    groupedHistory,
    sortedDates
  };
}

