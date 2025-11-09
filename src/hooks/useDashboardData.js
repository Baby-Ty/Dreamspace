// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek, parseIsoWeek } from '../utils/dateUtils';
import { isTemplateActiveForWeek } from '../utils/templateValidation';
import weekService from '../services/weekService';

/**
 * Custom hook for Dashboard data management
 * Handles loading current week goals, stats calculation, and goal actions
 */
export function useDashboardData() {
  const { currentUser, weeklyGoals, addWeeklyGoal, addWeeklyGoalsBatch, toggleWeeklyGoal } = useApp();
  
  // Ensure weeklyGoals is always an array
  const safeWeeklyGoals = Array.isArray(weeklyGoals) ? weeklyGoals : [];
  
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
   * Load current week's goals from weeks container
   */
  const loadCurrentWeekGoals = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setIsLoadingWeekGoals(true);
    const currentWeekIso = getCurrentIsoWeek();
    const { year: isoYear } = parseIsoWeek(currentWeekIso); // Use ISO week year, not calendar year
    
    try {
      console.log('📅 Dashboard: Loading current week goals for', currentWeekIso, '(ISO year:', isoYear, ')');
      const weekDocResult = await weekService.getWeekGoals(currentUser.id, isoYear);
      
      if (weekDocResult.success && weekDocResult.data?.weeks?.[currentWeekIso]) {
        const goals = weekDocResult.data.weeks[currentWeekIso].goals || [];
        console.log('✅ Dashboard: Loaded', goals.length, 'goals for current week');
        setCurrentWeekGoals(goals);
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
    const currentWeekIso = getCurrentIsoWeek();
    const { year: isoYear } = parseIsoWeek(currentWeekIso); // Use ISO week year
    
    try {
      const result = await weekService.saveWeekGoals(
        currentUser.id, 
        isoYear, 
        currentWeekIso, 
        optimisticGoals
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
   * Add new goal using Week Ahead pattern
   */
  const handleAddGoal = useCallback(async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    
    // Dream IDs are strings like "dream_1234567890", don't parseInt!
    const dreamId = newGoal.dreamId || null;
    const selectedDream = currentUser?.dreamBook?.find(dream => dream.id === dreamId);
    
    const currentWeekIso = getCurrentIsoWeek();
    const { getNextNWeeks } = await import('../utils/dateUtils');
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📝 Adding goal from dashboard:', {
      consistency: newGoal.consistency,
      dreamId: dreamId,
      selectedDream: selectedDream?.title,
      hasDream: !!selectedDream
    });
    
    try {
      if (newGoal.consistency === 'weekly') {
        // Create template for weekly recurring goals (SAME as Week Ahead)
        const template = {
          id: goalId,
          type: 'weekly_goal_template',
          goalType: 'consistency',
          title: newGoal.title,
          description: newGoal.description || '',
          dreamId: dreamId,
          dreamTitle: selectedDream?.title || '',
          dreamCategory: selectedDream?.category || '',
          recurrence: 'weekly',
          targetWeeks: newGoal.targetWeeks,
          active: true,
          startDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        console.log('✨ Creating weekly recurring template:', template.id);
        await addWeeklyGoal(template);
        console.log('✅ Weekly template created');
        
      } else if (newGoal.consistency === 'monthly') {
        // Create instances for monthly goals (SAME as Week Ahead)
        const months = newGoal.targetMonths;
        const totalWeeks = months * 4;
        const weekIsoStrings = getNextNWeeks(currentWeekIso, totalWeeks);
        
        const instances = weekIsoStrings.map(weekIso => ({
          id: `${goalId}_${weekIso}`,
          type: 'weekly_goal',
          goalType: 'consistency',
          title: newGoal.title,
          description: newGoal.description || '',
          dreamId: dreamId,
          dreamTitle: selectedDream?.title || '',
          dreamCategory: selectedDream?.category || '',
          recurrence: 'monthly',
          targetMonths: months,
          weekId: weekIso,
          completed: false,
          createdAt: new Date().toISOString()
        }));
        
        console.log(`📅 Creating ${instances.length} monthly goal instances`);
        await addWeeklyGoalsBatch(instances);
        console.log('✅ Monthly instances created');
      }
      
      // FORCE RELOAD: Ensure we see the new goal immediately
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
      console.error('❌ Failed to add goal from dashboard:', error);
      alert(`Failed to add goal: ${error.message}`);
    }
  }, [newGoal, currentUser?.dreamBook, addWeeklyGoal, addWeeklyGoalsBatch, loadCurrentWeekGoals]);

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
   */
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const currentWeekIso = getCurrentIsoWeek();
    const allTemplates = safeWeeklyGoals.filter(g => 
      g.type === 'weekly_goal_template'
    );
    
    // Get milestones for validation
    const milestones = currentUser?.dreamBook
      ?.flatMap(dream => dream.milestones || []) || [];
    
    // Filter valid templates for current week
    const validTemplates = allTemplates.filter(template => {
      const milestone = template.milestoneId 
        ? milestones.find(m => m.id === template.milestoneId)
        : null;
      return isTemplateActiveForWeek(template, currentWeekIso, milestone);
    });
    
    // Check each valid template and create instance if it doesn't exist
    validTemplates.forEach(template => {
      const instanceExists = safeWeeklyGoals.some(g => 
        g.templateId === template.id && g.weekId === currentWeekIso
      );
      
      if (!instanceExists) {
        // Create instance for current week
        const instance = {
          id: `${template.id}_${currentWeekIso}`,
          type: 'weekly_goal',
          templateId: template.id,
          goalType: template.goalType || 'consistency',
          title: template.title,
          description: template.description,
          dreamId: template.dreamId,
          dreamTitle: template.dreamTitle,
          dreamCategory: template.dreamCategory,
          milestoneId: template.milestoneId,
          recurrence: template.recurrence || 'weekly', // ✅ FIX: Copy recurrence from template
          targetWeeks: template.targetWeeks,
          targetMonths: template.targetMonths,
          weekId: currentWeekIso,
          completed: false,
          createdAt: new Date().toISOString()
        };
        addWeeklyGoal(instance);
      }
    });
  }, [currentUser?.id, safeWeeklyGoals.length, addWeeklyGoal, currentUser?.dreamBook]);

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
    loadCurrentWeekGoals,

    // Helpers
    getCurrentWeekRange,

    // Force re-render trigger (not used directly by components)
    dreamsUpdateTrigger,
  };
}

