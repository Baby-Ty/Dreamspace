// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback, useMemo } from 'react';
import { getCurrentIsoWeek, getNextNWeeks, getWeeksUntilDate, monthsToWeeks, dateToWeeks } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';
import { toast } from '../utils/toast';

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
    console.log(`🔍 [useDreamGoals] Loading goals for dream "${localDream.title}" (${localDream.id})`);
    
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
    
    console.log(`  📊 Goals: ${templates.length} templates + ${uniqueLegacyGoals.length} legacy = ${combined.length} total`);
    
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

    try {
      const goalId = `goal_${Date.now()}`;
      const nowIso = new Date().toISOString();
      const currentWeekIso = getCurrentIsoWeek();

      // Calculate targetWeeks and weeksRemaining
      let calculatedTargetWeeks, weeksRemaining;
      if (consistency === 'deadline' && targetDate) {
        calculatedTargetWeeks = dateToWeeks(targetDate, currentWeekIso);
        weeksRemaining = calculatedTargetWeeks;
      } else if (consistency === 'monthly') {
        calculatedTargetWeeks = monthsToWeeks(targetMonths);
        weeksRemaining = calculatedTargetWeeks;
      } else {
        calculatedTargetWeeks = targetWeeks;
        weeksRemaining = targetWeeks;
      }

      // Create goal object
      const goal = {
        id: goalId,
        title: title.trim(),
        type: consistency === 'deadline' ? 'deadline' : 'consistency',
        recurrence: consistency === 'deadline' ? undefined : consistency,
        targetWeeks: calculatedTargetWeeks,
        targetMonths: consistency === 'monthly' ? targetMonths : undefined,
        frequency: consistency === 'monthly' ? (frequency || 2) :
                  (consistency === 'weekly' ? (frequency || 1) : undefined),
        startDate: nowIso,
        targetDate: consistency === 'deadline' ? targetDate : undefined,
        weeksRemaining: weeksRemaining,
        active: true,
        completed: false,
        createdAt: nowIso
      };

      // Add to dream's goals array
      const updatedGoals = [...(localDream.goals || []), goal];
      const updatedDream = { ...localDream, goals: updatedGoals };
      setLocalDream(updatedDream);

      // Save to backend
      await addGoal(localDream.id, goal);

      // Create instance in currentWeek container
      const newGoalInstance = {
        id: goalId,
        templateId: goalId,
        type: goal.type === 'deadline' ? 'deadline' : 'weekly_goal',
        title: goal.title,
        description: '',
        dreamId: localDream.id,
        dreamTitle: localDream.title,
        dreamCategory: localDream.category,
        recurrence: goal.type === 'consistency' ? goal.recurrence : undefined,
        targetWeeks: goal.targetWeeks,
        targetMonths: goal.targetMonths,
        targetDate: goal.targetDate,
        frequency: goal.type === 'consistency' && goal.recurrence === 'monthly' ? (goal.frequency || 2) :
                  (goal.type === 'consistency' && goal.recurrence === 'weekly' ? (goal.frequency || 1) : null),
        completionCount: 0,
        completionDates: [],
        completed: false,
        completedAt: null,
        skipped: false,
        weeksRemaining: goal.type === 'deadline' && goal.targetDate ?
                       getWeeksUntilDate(goal.targetDate, currentWeekIso) :
                       (goal.targetWeeks || null),
        monthsRemaining: goal.targetMonths || null,
        weekId: currentWeekIso,
        createdAt: nowIso
      };

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

      console.log('✅ Goal added successfully');
    } catch (error) {
      console.error('❌ Failed to add goal:', error);
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

    try {
      // Update in localDream
      const updatedGoals = (localDream.goals || []).map(g =>
        g.id === goalId ? { ...g, completed: !g.completed, completedAt: !g.completed ? new Date().toISOString() : null } : g
      );
      const updatedDream = { ...localDream, goals: updatedGoals };
      setLocalDream(updatedDream);

      // Update via context
      await updateGoal(localDream.id, goalId, { completed: !goal.completed });
      setHasChanges(false);
    } catch (error) {
      console.error('❌ Failed to toggle goal:', error);
    }
  }, [canEdit, dreamGoals, localDream, setLocalDream, setHasChanges, updateGoal]);

  // Delete goal
  const handleDeleteGoal = useCallback(async (goalId) => {
    if (!canEdit) return;

    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      // Remove from localDream
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
      console.log('✅ Goal deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete goal:', error);
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

    try {
      const updatedGoals = (localDream.goals || []).map(g =>
        g.id === editingGoal ? { ...g, title: goalEditData.title.trim() } : g
      );
      const updatedDream = { ...localDream, goals: updatedGoals };
      setLocalDream(updatedDream);

      await updateGoal(localDream.id, editingGoal, { title: goalEditData.title.trim() });

      setEditingGoal(null);
      setGoalEditData(null);
      setHasChanges(false);
      console.log('✅ Goal updated successfully');
    } catch (error) {
      console.error('❌ Failed to update goal:', error);
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
