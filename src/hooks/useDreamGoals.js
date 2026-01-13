// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback, useMemo } from 'react';
import { getCurrentIsoWeek } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';
import { toast } from '../utils/toast';
import { buildGoalInstance, buildDreamGoal } from '../utils/goalInstanceBuilder';
import { logger } from '../utils/logger';

/**
 * useDreamGoals - Manages all goal operations for a dream
 * 
 * Extracted from useDreamTracker to reduce complexity
 * Handles: goal CRUD, goal editing, goal state, goal filtering
 * 
 * @param {object} localDream - Current dream state
 * @param {function} setLocalDream - Update dream state
 * @param {function} setHasChanges - Mark dream as changed
 * @param {object} appContext - App context with goal operations
 * @param {boolean} canEdit - Whether editing is allowed
 * @param {array} weeklyGoals - Weekly goals from app context
 * @returns {object} Goal state and handlers
 */
export function useDreamGoals(localDream, setLocalDream, setHasChanges, appContext, canEdit, weeklyGoals) {
  const {
    currentUser,
    addGoal,
    updateGoal,
    deleteGoal,
    updateWeeklyGoal,
    deleteWeeklyGoal
  } = appContext;

  // Goal form state
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [newGoalData, setNewGoalData] = useState({
    title: '',
    consistency: 'weekly',
    targetWeeks: 12,
    targetMonths: 6,
    frequency: 1,
    targetDate: ''
  });

  // Goal editing state
  const [editingGoal, setEditingGoal] = useState(null);
  const [isSavingGoalEdit, setIsSavingGoalEdit] = useState(false);
  const [goalEditData, setGoalEditData] = useState(null);

  // Get goals for this dream from multiple sources
  const dreamGoals = useMemo(() => {
    logger.debug('useDreamGoals', 'Loading goals for dream', {
      dreamTitle: localDream.title,
      dreamId: localDream.id
    });
    
    // Source 1: Templates from weeklyGoals
    const templates = weeklyGoals.filter(g => {
      if (g.type !== 'weekly_goal_template') return false;
      
      const matchesId = g.dreamId === localDream.id;
      const matchesTitle = g.dreamTitle === localDream.title;
      
      return matchesId || matchesTitle;
    });
    
    // Source 2: Legacy goals from localDream.goals array
    const legacyGoals = (localDream.goals || []).filter(g => g && g.id);
    
    // Combine, removing duplicates by ID
    const templateIds = new Set(templates.map(t => t.id));
    const uniqueLegacyGoals = legacyGoals.filter(g => !templateIds.has(g.id));
    
    const combined = [...templates, ...uniqueLegacyGoals];
    
    logger.debug('useDreamGoals', 'Goals loaded', {
      templates: templates.length,
      legacy: uniqueLegacyGoals.length,
      total: combined.length
    });
    
    return combined;
  }, [weeklyGoals, localDream.goals, localDream.id, localDream.title]);

  // Add new goal
  const handleAddGoal = useCallback(async () => {
    if (!canEdit || isSavingGoal) return;

    const { title, consistency, targetWeeks, targetMonths, frequency, targetDate } = newGoalData;

    if (!title.trim()) {
      toast.warning('Please enter a goal title');
      return;
    }

    setIsSavingGoal(true);

    const goalId = `goal_${Date.now()}`;
    const currentWeekIso = getCurrentIsoWeek();
    const previousDreamState = localDream; // Store for rollback

    try {
      // Create dream goal using centralized builder
      const goal = buildDreamGoal({
        goalId,
        title: title.trim(),
        type: consistency === 'deadline' ? 'deadline' : 'consistency',
        recurrence: consistency === 'deadline' ? undefined : consistency,
        targetWeeks,
        targetMonths,
        targetDate,
        frequency,
        consistency,
        currentWeekIso,
      });

      // OPTIMISTIC UPDATE: Add to dream's goals array
      const updatedGoals = [...(localDream.goals || []), goal];
      const updatedDream = { ...localDream, goals: updatedGoals };
      setLocalDream(updatedDream);

      // Save to backend
      await addGoal(localDream.id, goal);

      // Create instance in currentWeek container using centralized builder
      const newGoalInstance = buildGoalInstance({
        goalId,
        templateId: goalId,
        type: goal.type === 'deadline' ? 'deadline' : 'weekly_goal',
        title: goal.title,
        description: '',
        dreamId: localDream.id,
        dreamTitle: localDream.title,
        dreamCategory: localDream.category,
        consistency,
        targetWeeks,
        targetMonths,
        targetDate,
        frequency,
        recurrence: goal.recurrence,
        weekId: currentWeekIso,
        currentWeekIso,
      });

      const currentWeekResponse = await currentWeekService.getCurrentWeek(currentUser.id);
      const existingGoals = currentWeekResponse.success && currentWeekResponse.data?.goals || [];
      const updatedWeekGoals = [...existingGoals, newGoalInstance];
      await currentWeekService.saveCurrentWeek(currentUser.id, currentWeekIso, updatedWeekGoals);

      // Reset form
      setNewGoalData({
        title: '',
        consistency: 'weekly',
        targetWeeks: 12,
        targetMonths: 6,
        frequency: 1,
        targetDate: ''
      });
      setIsAddingGoal(false);
      setHasChanges(false);

      logger.info('useDreamGoals', 'Goal added successfully');
    } catch (error) {
      logger.error('useDreamGoals', 'Failed to add goal, rolling back', error);
      // ROLLBACK: Restore previous dream state
      setLocalDream(previousDreamState);
      toast.error('Failed to add goal. Please try again.');
    } finally {
      setIsSavingGoal(false);
    }
  }, [canEdit, isSavingGoal, newGoalData, localDream, setLocalDream, setHasChanges, addGoal, currentUser]);

  // Toggle goal completion
  const toggleGoal = useCallback(async (goalId) => {
    if (!canEdit) return;

    const goal = dreamGoals.find(g => g.id === goalId);
    if (!goal) return;

    const previousDreamState = localDream; // Store for rollback

    try {
      // OPTIMISTIC UPDATE: Update in localDream
      const updatedGoals = (localDream.goals || []).map(g =>
        g.id === goalId ? { ...g, completed: !g.completed, completedAt: !g.completed ? new Date().toISOString() : null } : g
      );
      const updatedDream = { ...localDream, goals: updatedGoals };
      setLocalDream(updatedDream);

      // Update via context (updates dream in database)
      await updateGoal(localDream.id, goalId, { completed: !goal.completed });
      
      // ALSO UPDATE CURRENTWEEK CONTAINER: Sync the goal completion state
      // This ensures dashboard and dream modal stay in sync
      const currentWeekIso = getCurrentIsoWeek();
      const currentWeekResponse = await currentWeekService.getCurrentWeek(currentUser.id);
      if (currentWeekResponse.success && currentWeekResponse.data) {
        const currentWeekGoals = currentWeekResponse.data.goals || [];
        // Update any goal instances that match this goalId or templateId
        const updatedCurrentWeekGoals = currentWeekGoals.map(cwg => {
          if (cwg.id === goalId || cwg.goalId === goalId || cwg.templateId === goalId) {
            return { ...cwg, completed: !goal.completed, completedAt: !goal.completed ? new Date().toISOString() : null };
          }
          return cwg;
        });
        // Save back to currentWeek container
        await currentWeekService.saveCurrentWeek(currentUser.id, currentWeekIso, updatedCurrentWeekGoals);
        logger.info('useDreamGoals', 'Goal toggled and synced to currentWeek');
      }
      
      setHasChanges(false);
    } catch (error) {
      logger.error('useDreamGoals', 'Failed to toggle goal, rolling back', error);
      // ROLLBACK: Restore previous dream state
      setLocalDream(previousDreamState);
      toast.error('Failed to toggle goal. Please try again.');
    }
  }, [canEdit, dreamGoals, localDream, setLocalDream, setHasChanges, updateGoal, currentUser]);

  // Delete goal
  const handleDeleteGoal = useCallback(async (goalId) => {
    if (!canEdit) return;

    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    const previousDreamState = localDream; // Store for rollback

    try {
      // OPTIMISTIC UPDATE: Remove from localDream
      const updatedGoals = (localDream.goals || []).filter(g => g.id !== goalId);
      const updatedDream = { ...localDream, goals: updatedGoals };
      setLocalDream(updatedDream);

      // Delete from backend
      await deleteGoal(localDream.id, goalId);

      // Remove from currentWeek container
      const currentWeekIso = getCurrentIsoWeek();
      const currentWeekResponse = await currentWeekService.getCurrentWeek(currentUser.id);
      if (currentWeekResponse.success && currentWeekResponse.data) {
        const currentWeekGoals = currentWeekResponse.data.goals || [];
        const remainingGoals = currentWeekGoals.filter(g => g.id !== goalId && g.templateId !== goalId);
        await currentWeekService.saveCurrentWeek(currentUser.id, currentWeekIso, remainingGoals);
      }

      setHasChanges(false);
      logger.info('useDreamGoals', 'Goal deleted successfully');
    } catch (error) {
      logger.error('useDreamGoals', 'Failed to delete goal, rolling back', error);
      // ROLLBACK: Restore previous dream state
      setLocalDream(previousDreamState);
      toast.error('Failed to delete goal. Please try again.');
    }
  }, [canEdit, localDream, setLocalDream, setHasChanges, deleteGoal, currentUser]);

  // Start editing goal
  const startEditingGoal = useCallback((goal) => {
    if (!canEdit) return;
    setEditingGoal(goal.id);
    setGoalEditData({
      title: goal.title,
      consistency: goal.type === 'deadline' ? 'deadline' : goal.recurrence,
      targetWeeks: goal.targetWeeks || 12,
      targetMonths: goal.targetMonths || 6,
      frequency: goal.frequency || 1,
      targetDate: goal.targetDate || ''
    });
  }, [canEdit]);

  // Cancel editing
  const cancelEditingGoal = useCallback(() => {
    setEditingGoal(null);
    setGoalEditData(null);
  }, []);

  // Save edited goal
  const saveEditedGoal = useCallback(async () => {
    if (!editingGoal || !goalEditData || isSavingGoalEdit) return;

    setIsSavingGoalEdit(true);
    const previousDreamState = localDream; // Store for rollback

    try {
      // OPTIMISTIC UPDATE: Update goal title in localDream
      const updatedGoals = (localDream.goals || []).map(g =>
        g.id === editingGoal ? { ...g, title: goalEditData.title.trim() } : g
      );
      const updatedDream = { ...localDream, goals: updatedGoals };
      setLocalDream(updatedDream);

      await updateGoal(localDream.id, editingGoal, { title: goalEditData.title.trim() });

      setEditingGoal(null);
      setGoalEditData(null);
      setHasChanges(false);
      logger.info('useDreamGoals', 'Goal updated successfully');
    } catch (error) {
      logger.error('useDreamGoals', 'Failed to update goal, rolling back', error);
      // ROLLBACK: Restore previous dream state
      setLocalDream(previousDreamState);
      toast.error('Failed to update goal. Please try again.');
    } finally {
      setIsSavingGoalEdit(false);
    }
  }, [editingGoal, goalEditData, isSavingGoalEdit, localDream, setLocalDream, setHasChanges, updateGoal]);

  // Computed values
  const completedGoals = useMemo(() => {
    return dreamGoals.filter(g => {
      if (g.type === 'weekly_goal_template') {
        return g.active !== false;
      }
      return g.completed;
    }).length;
  }, [dreamGoals]);

  const totalGoals = useMemo(() => dreamGoals.length, [dreamGoals]);

  return {
    // State
    dreamGoals,
    isAddingGoal,
    setIsAddingGoal,
    isSavingGoal,
    newGoalData,
    setNewGoalData,
    editingGoal,
    isSavingGoalEdit,
    goalEditData,
    setGoalEditData,

    // Handlers
    handleAddGoal,
    toggleGoal,
    handleDeleteGoal,
    startEditingGoal,
    cancelEditingGoal,
    saveEditedGoal,

    // Computed
    completedGoals,
    totalGoals
  };
}

export default useDreamGoals;
