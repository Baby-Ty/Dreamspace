// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';

/**
 * Custom hook for Dashboard data management
 * Handles loading current week goals, stats calculation, and goal actions
 */
export function useDashboardData() {
  const { currentUser, updateDream } = useApp();
  
  // Note: No longer using weeklyGoals, addWeeklyGoal, etc. from AppContext
  // All week operations now go through currentWeekService directly
  
  // State
  const [currentWeekGoals, setCurrentWeekGoals] = useState([]);
  const [isLoadingWeekGoals, setIsLoadingWeekGoals] = useState(true);
  const [dreamsUpdateTrigger, setDreamsUpdateTrigger] = useState(0); // Force re-render when dreams update
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    dreamId: '',
    consistency: 'weekly',
    targetWeeks: 12,
    targetMonths: 6
  });

  /**
   * Get current week date range formatted
   */
  const getCurrentWeekRange = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    return `${formatDate(startOfWeek)} – ${formatDate(endOfWeek)}`;
  }, []);

  /**
   * Calculate user stats
   */
  const stats = useMemo(() => {
    if (!currentUser) {
      return {
        dreamsCreated: 0,
        connectsCompleted: 0,
        scorecardPoints: 0
      };
    }
    
    return {
      dreamsCreated: currentUser.dreamBook?.length || 0,
      connectsCompleted: currentUser.connects?.length || 0,
      scorecardPoints: currentUser.score || 0
    };
  }, [currentUser]);

  /**
   * Calculate weekly progress for current week
   */
  const weeklyProgress = useMemo(() => {
    if (currentWeekGoals.length === 0) return 0;
    const completed = currentWeekGoals.filter(goal => goal.completed).length;
    return Math.round((completed / currentWeekGoals.length) * 100);
  }, [currentWeekGoals]);

  /**
   * Load current week's goals from currentWeek container
   */
  const loadCurrentWeekGoals = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setIsLoadingWeekGoals(true);
    const currentWeekIso = getCurrentIsoWeek();
    
    try {
      console.log('📅 Dashboard: Loading current week goals for', currentWeekIso);
      const result = await currentWeekService.getCurrentWeek(currentUser.id);
      
      if (result.success && result.data) {
        const goals = result.data.goals || [];
        console.log('✅ Dashboard: Loaded', goals.length, 'goals for current week');
        setCurrentWeekGoals(goals.filter(g => !g.skipped)); // Filter out skipped goals
      } else {
        console.log('ℹ️ Dashboard: No goals found for current week');
        setCurrentWeekGoals([]);
      }
    } catch (error) {
      console.error('❌ Dashboard: Error loading week goals:', error);
      setCurrentWeekGoals([]);
    } finally {
      setIsLoadingWeekGoals(false);
    }
  }, [currentUser?.id]);

  /**
   * Toggle goal completion with optimistic updates
   */
  const handleToggleGoal = useCallback(async (goalId) => {
    const goal = currentWeekGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Handle monthly goals differently (increment counter)
    if (goal.recurrence === 'monthly') {
      const currentWeekIso = getCurrentIsoWeek();
      
      // Optimistic update
      const optimisticGoals = currentWeekGoals.map(g => {
        if (g.id === goalId) {
          const newCount = Math.min((g.completionCount || 0) + 1, g.frequency || 1);
          return {
            ...g,
            completionCount: newCount,
            completed: newCount >= g.frequency,
            completionDates: [...(g.completionDates || []), new Date().toISOString()]
          };
        }
        return g;
      });
      setCurrentWeekGoals(optimisticGoals);
      
      // Persist to server
      try {
        const result = await currentWeekService.incrementMonthlyGoal(
          currentUser.id,
          currentWeekIso,
          goalId,
          currentWeekGoals
        );
        
        if (!result.success) {
          throw new Error(result.error);
        }
        console.log('✅ Monthly goal incremented:', goalId);
      } catch (error) {
        console.error('❌ Failed to increment monthly goal, reverting:', error);
        setCurrentWeekGoals(currentWeekGoals);
        alert('Failed to save goal. Please try again.');
      }
      return;
    }
    
    // Handle regular weekly goals
    const currentWeekIso = getCurrentIsoWeek();
    
    // 1. OPTIMISTIC UPDATE: Update UI immediately for instant feedback
    const optimisticGoals = currentWeekGoals.map(g => 
      g.id === goalId 
        ? { 
            ...g, 
            completed: !g.completed, 
            completedAt: !g.completed ? new Date().toISOString() : null 
          }
        : g
    );
    setCurrentWeekGoals(optimisticGoals);
    
    // 2. PERSIST TO SERVER
    try {
      const result = await currentWeekService.toggleGoalCompletion(
        currentUser.id,
        currentWeekIso,
        goalId,
        currentWeekGoals
      );
      
      if (result.success) {
        console.log('✅ Goal toggled:', goalId);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to toggle goal, reverting:', error);
      // 3. REVERT ON ERROR
      setCurrentWeekGoals(currentWeekGoals);
      alert('Failed to save goal. Please try again.');
    }
  }, [currentWeekGoals, currentUser?.id]);

  /**
   * Add new goal directly to currentWeek container (NEW SIMPLIFIED SYSTEM)
   */
  const handleAddGoal = useCallback(async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    
    const dreamId = newGoal.dreamId || null;
    const selectedDream = currentUser?.dreamBook?.find(dream => dream.id === dreamId);
    const currentWeekIso = getCurrentIsoWeek();
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📝 Adding goal to currentWeek container:', {
      consistency: newGoal.consistency,
      dreamId: dreamId,
      selectedDream: selectedDream?.title,
      hasDream: !!selectedDream
    });
    
    try {
      // Create new goal instance for current week
      const newGoalInstance = {
        id: goalId,
        templateId: goalId, // Self-reference for now (will be proper template ID later)
        type: 'weekly_goal',
        title: newGoal.title,
        description: newGoal.description || '',
        dreamId: dreamId,
        dreamTitle: selectedDream?.title || '',
        dreamCategory: selectedDream?.category || '',
        recurrence: newGoal.consistency, // 'weekly' or 'monthly'
        targetWeeks: newGoal.consistency === 'weekly' ? newGoal.targetWeeks : null,
        targetMonths: newGoal.consistency === 'monthly' ? newGoal.targetMonths : null,
        frequency: newGoal.consistency === 'monthly' ? 2 : null, // Default 2x per month
        completionCount: 0,
        completionDates: [],
        completed: false,
        completedAt: null,
        skipped: false,
        weeksRemaining: newGoal.consistency === 'weekly' ? newGoal.targetWeeks : null,
        monthsRemaining: newGoal.consistency === 'monthly' ? newGoal.targetMonths : null,
        weekId: currentWeekIso,
        createdAt: new Date().toISOString()
      };
      
      // Get existing goals from current week (if any)
      const existingGoals = currentWeekGoals || [];
      const updatedGoals = [...existingGoals, newGoalInstance];
      
      console.log(`✨ Adding goal to currentWeek (total: ${updatedGoals.length})`);
      
      // Save directly to currentWeek container
      const result = await currentWeekService.saveCurrentWeek(
        currentUser.id,
        currentWeekIso,
        updatedGoals
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save goal');
      }
      
      console.log('✅ Goal added to currentWeek successfully');
      
      // Also add goal to dream's goals array (so it shows in Dream view)
      if (dreamId && selectedDream) {
        const dreamGoal = {
          id: goalId,
          title: newGoal.title,
          type: 'consistency',
          recurrence: newGoal.consistency,
          targetWeeks: newGoal.consistency === 'weekly' ? newGoal.targetWeeks : undefined,
          targetMonths: newGoal.consistency === 'monthly' ? newGoal.targetMonths : undefined,
          startDate: new Date().toISOString(),
          active: true,
          completed: false,
          createdAt: new Date().toISOString()
        };
        
        const updatedDream = {
          ...selectedDream,
          goals: [...(selectedDream.goals || []), dreamGoal]
        };
        
        console.log('📚 Updating dream with new goal:', dreamId);
        await updateDream(updatedDream);
        console.log('✅ Dream updated with goal');
      }
      
      // Reload goals to refresh UI
      await loadCurrentWeekGoals();
      
      // Reset form
      setNewGoal({
        title: '',
        description: '',
        dreamId: '',
        consistency: 'weekly',
        targetWeeks: 12,
        targetMonths: 6
      });
      setShowAddGoal(false);
    } catch (error) {
      console.error('❌ Failed to add goal:', error);
      alert(`Failed to add goal: ${error.message}`);
    }
  }, [newGoal, currentUser?.dreamBook, currentUser?.id, currentWeekGoals, loadCurrentWeekGoals, updateDream]);

  /**
   * Listen for goals-updated events to refresh dashboard
   */
  useEffect(() => {
    const handleGoalsUpdated = () => {
      console.log('📢 Goals updated event received, reloading dashboard goals');
      loadCurrentWeekGoals();
    };

    const handleDreamsUpdated = () => {
      console.log('📢 Dreams updated event received, forcing dashboard re-render');
      // Force a re-render by updating the trigger state
      setDreamsUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('goals-updated', handleGoalsUpdated);
    window.addEventListener('dreams-updated', handleDreamsUpdated);

    return () => {
      window.removeEventListener('goals-updated', handleGoalsUpdated);
      window.removeEventListener('dreams-updated', handleDreamsUpdated);
    };
  }, [loadCurrentWeekGoals]);

  /**
   * Auto-create current week instances from templates on mount
   * TEMPORARILY DISABLED - Using new currentWeek container system
   * TODO: Re-implement after AppContext is updated for new system
   */
  // useEffect(() => {
  //   if (!currentUser?.id) return;
  //   
  //   const currentWeekIso = getCurrentIsoWeek();
  //   const allTemplates = safeWeeklyGoals.filter(g => 
  //     g.type === 'weekly_goal_template'
  //   );
  //   
  //   // Get milestones for validation
  //   const milestones = currentUser?.dreamBook
  //     ?.flatMap(dream => dream.milestones || []) || [];
  //   
  //   // Filter valid templates for current week
  //   const validTemplates = allTemplates.filter(template => {
  //     const milestone = template.milestoneId 
  //       ? milestones.find(m => m.id === template.milestoneId)
  //       : null;
  //     return isTemplateActiveForWeek(template, currentWeekIso, milestone);
  //   });
  //   
  //   // Check each valid template and create instance if it doesn't exist
  //   validTemplates.forEach(template => {
  //     const instanceExists = safeWeeklyGoals.some(g => 
  //       g.templateId === template.id && g.weekId === currentWeekIso
  //     );
  //     
  //     if (!instanceExists) {
  //       // Create instance for current week
  //       const instance = {
  //         id: `${template.id}_${currentWeekIso}`,
  //         type: 'weekly_goal',
  //         templateId: template.id,
  //         goalType: template.goalType || 'consistency',
  //         title: template.title,
  //         description: template.description,
  //         dreamId: template.dreamId,
  //         dreamTitle: template.dreamTitle,
  //         dreamCategory: template.dreamCategory,
  //         milestoneId: template.milestoneId,
  //         recurrence: template.recurrence || 'weekly',
  //         targetWeeks: template.targetWeeks,
  //         targetMonths: template.targetMonths,
  //         weekId: currentWeekIso,
  //         completed: false,
  //         createdAt: new Date().toISOString()
  //       };
  //       addWeeklyGoal(instance);
  //     }
  //   });
  // }, [currentUser?.id, safeWeeklyGoals.length, addWeeklyGoal, currentUser?.dreamBook]);

  /**
   * Skip a goal for the current week
   */
  const handleSkipGoal = useCallback(async (goalId) => {
    const goal = currentWeekGoals.find(g => g.id === goalId);
    if (!goal || !goal.templateId) return;
    
    const confirmed = confirm(
      `Skip "${goal.title}" this week?\n\n` +
      `This goal will reappear next week. Your progress won't be affected.`
    );
    
    if (!confirmed) return;
    
    const currentWeekIso = getCurrentIsoWeek();
    
    try {
      const result = await currentWeekService.skipGoal(
        currentUser.id,
        currentWeekIso,
        goalId,
        currentWeekGoals
      );
      
      if (result.success) {
        // Remove skipped goal from display
        setCurrentWeekGoals(currentWeekGoals.filter(g => g.id !== goalId));
        console.log('✅ Goal skipped for this week:', goalId);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Failed to skip goal:', error);
      alert('Failed to skip goal. Please try again.');
    }
  }, [currentWeekGoals, currentUser?.id]);

  // Load current week goals on mount
  useEffect(() => {
    loadCurrentWeekGoals();
  }, [loadCurrentWeekGoals]);

  return {
    // Loading state
    isLoadingWeekGoals,

    // Data
    currentWeekGoals,
    stats,
    weeklyProgress,

    // Form state
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,

    // Actions
    handleToggleGoal,
    handleAddGoal,
    handleSkipGoal,
    loadCurrentWeekGoals,

    // Helpers
    getCurrentWeekRange,

    // Force re-render trigger (not used directly by components)
    dreamsUpdateTrigger,
  };
}

