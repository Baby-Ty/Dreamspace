// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useMemo } from 'react';
import { Trophy, Target, TrendingUp, Star, Medal } from 'lucide-react';

/**
 * Custom hook for scorecard calculations and data transformations
 * Centralizes all business logic for the scorecard page
 * Now supports all-time scoring across multiple years
 */
export function useScorecardData(currentUser, scoringHistory, scoringRules, allYearsScoring = []) {
  // Calculate all-time total score (sum across all years)
  const allTimeScore = useMemo(() => {
    if (allYearsScoring && allYearsScoring.length > 0) {
      return allYearsScoring.reduce((sum, yearDoc) => sum + (yearDoc.totalScore || 0), 0);
    }
    // Fallback to scoringHistory if allYearsScoring not available
    return scoringHistory.reduce((sum, item) => sum + item.points, 0);
  }, [allYearsScoring, scoringHistory]);
  
  // Keep totalScore for backward compatibility (alias for allTimeScore)
  const totalScore = allTimeScore;
  
  // Calculate current year score
  const currentYearScore = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentYearDoc = allYearsScoring.find(doc => doc.year === currentYear);
    return currentYearDoc?.totalScore || 0;
  }, [allYearsScoring]);
  
  // Create year-by-year breakdown
  const yearlyBreakdown = useMemo(() => {
    if (!allYearsScoring || allYearsScoring.length === 0) {
      return [];
    }
    return allYearsScoring.map(doc => ({
      year: doc.year,
      totalScore: doc.totalScore || 0,
      entries: (doc.entries || []).length
    }));
  }, [allYearsScoring]);

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
    totalScore, // For backward compatibility
    allTimeScore, // All-time total across all years
    currentYearScore, // Current year only
    yearlyBreakdown, // Array of { year, totalScore, entries }
    dreamProgressStats,
    categoryStats,
    currentLevel,
    nextLevel,
    progressToNext,
    groupedHistory,
    sortedDates
  };
}

