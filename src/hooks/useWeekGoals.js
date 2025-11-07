// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek, getIsoWeek } from '../utils/dateUtils';
import { isTemplateActiveForWeek } from '../utils/templateValidation';
import weekService from '../services/weekService';

/**
 * Custom hook for managing week goals data and operations
 * Handles loading, creating, and managing weekly goals from templates
 */
export function useWeekGoals() {
  const { 
    currentUser, 
    weeklyGoals, 
    setWeeklyGoals,
    addWeeklyGoal,
    updateWeeklyGoal,
    deleteWeeklyGoal,
    toggleWeeklyGoal,
    logWeeklyCompletion,
    addWeeklyGoalsBatch
  } = useApp();

  // Loading state
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const loadedWeeksRef = useRef(new Set());

  // Memoized milestones for validation
  const milestones = useMemo(() => {
    return currentUser?.dreamBook?.flatMap(dream => dream.milestones || []) || [];
  }, [currentUser?.dreamBook]);

  /**
   * Load goals for a specific week from weeks container or create from templates
   */
  const loadWeekGoals = useCallback(async (weekObj) => {
    if (!currentUser?.id || !weekObj || isLoadingWeek) {
      console.log('⏭️ Skipping load:', { 
        hasUser: !!currentUser?.id, 
        hasWeek: !!weekObj, 
        isLoading: isLoadingWeek 
      });
      return;
    }
    
    const weekIso = getIsoWeek(weekObj.start);
    const year = weekObj.start.getFullYear();
    
    console.log(`📅 Loading goals for week ${weekIso}, userId: ${currentUser.id}`);
    setIsLoadingWeek(true);
    setLoadError(null);
    
    try {
      // Get templates from weeklyGoals and filter by validation rules
      const allTemplates = weeklyGoals.filter(goal => 
        goal.type === 'weekly_goal_template'
      );
      
      // Filter templates based on duration and start date
      const templates = allTemplates.filter(template => {
        const milestone = template.milestoneId 
          ? milestones.find(m => m.id === template.milestoneId)
          : null;
        return isTemplateActiveForWeek(template, weekIso, milestone);
      });
      
      console.log(`📋 Found ${templates.length} valid templates for ${weekIso}`);
      
      // Load or create week goals
      const result = await weekService.loadOrCreateWeekGoals(
        currentUser.id,
        year,
        weekIso,
        templates
      );
      
      if (result.success) {
        const weekGoals = result.data || [];
        console.log(`✅ Loaded ${weekGoals.length} goal instances for ${weekIso}`);
        
        // Update state with loaded goals
        // Keep templates and goals from other weeks, replace goals for this week
        const otherWeekGoals = weeklyGoals.filter(g => 
          (g.weekId && g.weekId !== weekIso) || g.type === 'weekly_goal_template'
        );
        
        // Only add the newly loaded week goals if they're not duplicates
        const uniqueWeekGoals = weekGoals.filter(newGoal => 
          !otherWeekGoals.some(existing => existing.id === newGoal.id)
        );
        
        const updatedGoals = [...otherWeekGoals, ...uniqueWeekGoals];
        
        console.log(`📊 State update: ${otherWeekGoals.length} existing + ${uniqueWeekGoals.length} new = ${updatedGoals.length} total`);
        
        setWeeklyGoals(updatedGoals);
        setLoadError(null);
      } else {
        const errorMsg = `Failed to load week goals: ${result.error}`;
        console.error('❌', errorMsg);
        setLoadError(errorMsg);
      }
    } catch (error) {
      const errorMsg = `Error loading week goals: ${error.message}`;
      console.error('❌', errorMsg, error);
      setLoadError(errorMsg);
    } finally {
      setIsLoadingWeek(false);
    }
  }, [currentUser?.id, weeklyGoals, milestones, setWeeklyGoals, isLoadingWeek]);

  /**
   * Load week goals only if not already loaded
   */
  const loadWeekGoalsIfNeeded = useCallback((weekObj) => {
    if (!weekObj) return;
    
    const weekIso = getIsoWeek(weekObj.start);
    if (!loadedWeeksRef.current.has(weekIso)) {
      loadedWeeksRef.current.add(weekIso);
      loadWeekGoals(weekObj);
    }
  }, [loadWeekGoals]);

  /**
   * Calculate progress percentage for a specific week
   */
  const getWeekProgress = useCallback((weekIso) => {
    const weekGoals = weeklyGoals.filter(g => g.weekId === weekIso);
    const completed = weekGoals.filter(g => g.completed).length;
    const total = weekGoals.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [weeklyGoals]);

  /**
   * Get goals for a specific week (non-template goals)
   */
  const getWeekGoals = useCallback((weekIso) => {
    return weeklyGoals.filter(g => 
      g.weekId === weekIso && g.type !== 'weekly_goal_template'
    );
  }, [weeklyGoals]);

  /**
   * Get all templates
   */
  const getTemplates = useCallback(() => {
    return weeklyGoals.filter(g => g.type === 'weekly_goal_template');
  }, [weeklyGoals]);

  /**
   * Calculate KPIs for a specific week
   */
  const getWeekKPIs = useCallback((weekIso) => {
    const weekGoals = getWeekGoals(weekIso);
    const activeGoals = weekGoals.length;
    const completedGoals = weekGoals.filter(g => g.completed).length;
    const percentCompleted = activeGoals > 0 
      ? Math.round((completedGoals / activeGoals) * 100) 
      : 0;
    
    // Calculate total unique weeks that have goals
    const uniqueWeeks = new Set(
      weeklyGoals
        .filter(g => g.type !== 'weekly_goal_template')
        .map(g => g.weekId)
    ).size;
    
    return {
      activeGoals,
      completedGoals,
      percentCompleted,
      totalWeeks: uniqueWeeks
    };
  }, [weeklyGoals, getWeekGoals]);

  /**
   * Get active templates for a specific week
   */
  const getActiveTemplatesForWeek = useCallback((weekIso) => {
    const allTemplates = getTemplates();
    return allTemplates.filter(template => {
      const milestone = template.milestoneId 
        ? milestones.find(m => m.id === template.milestoneId)
        : null;
      return isTemplateActiveForWeek(template, weekIso, milestone);
    });
  }, [getTemplates, milestones]);

  /**
   * Clear loaded weeks cache (useful for refreshing)
   */
  const clearLoadedCache = useCallback(() => {
    loadedWeeksRef.current.clear();
  }, []);

  return {
    // State
    isLoadingWeek,
    loadError,
    
    // Data getters
    weeklyGoals,
    milestones,
    getWeekGoals,
    getTemplates,
    getActiveTemplatesForWeek,
    
    // Actions
    loadWeekGoals,
    loadWeekGoalsIfNeeded,
    addWeeklyGoal,
    updateWeeklyGoal,
    deleteWeeklyGoal,
    toggleWeeklyGoal,
    logWeeklyCompletion,
    addWeeklyGoalsBatch,
    clearLoadedCache,
    
    // Computed values
    getWeekProgress,
    getWeekKPIs,
  };
}



