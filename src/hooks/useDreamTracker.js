// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek, getNextNWeeks } from '../utils/dateUtils';
import weekService from '../services/weekService';

/**
 * Custom hook for Dream Tracker modal state management
 * Handles all CRUD operations for dreams, goals, milestones, and notes
 */
export function useDreamTracker(dream, onUpdate) {
  const { 
    updateDreamProgress, 
    currentUser, 
    addGoal, 
    updateGoal, 
    deleteGoal 
  } = useApp();

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Dream state
  const [localDream, setLocalDream] = useState({
    ...dream,
    goals: dream.goals || [],
    notes: dream.notes || [],
    history: dream.history || []
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Note state
  const [newNote, setNewNote] = useState('');

  // Goal add state
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalData, setNewGoalData] = useState({ title: '', description: '', type: 'consistency', recurrence: 'weekly', targetWeeks: 12, targetMonths: 6, startDate: '', targetDate: '' });

  // Goal edit state
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalEditData, setGoalEditData] = useState({ title: '', description: '', type: 'consistency', recurrence: 'weekly', targetWeeks: 12, targetMonths: 6, startDate: '', targetDate: '' });

  // Update local dream when prop changes
  useEffect(() => {
    setLocalDream({
      ...dream,
      goals: dream.goals || [],
      notes: dream.notes || [],
      history: dream.history || []
    });
  }, [dream]);

  // Progress handlers
  const handleProgressChange = useCallback((newProgress) => {
    const updatedDream = { ...localDream, progress: newProgress };
    setLocalDream(updatedDream);
    setHasChanges(true);
    
    // Add to history
    const historyEntry = {
      id: `history_${Date.now()}`,
      type: 'progress',
      action: `Progress updated to ${newProgress}%`,
      timestamp: new Date().toISOString(),
      oldValue: localDream.progress,
      newValue: newProgress
    };
    
    updatedDream.history = [historyEntry, ...updatedDream.history];
    setLocalDream(updatedDream);
    
    // Update global state
    updateDreamProgress(dream.id, newProgress);
  }, [localDream, dream.id, updateDreamProgress]);

  const toggleComplete = useCallback(() => {
    const isComplete = localDream.progress === 100;
    const newProgress = isComplete ? 90 : 100;
    handleProgressChange(newProgress);
  }, [localDream.progress, handleProgressChange]);

  // Weekly entries population
  const populateWeeklyEntries = useCallback(async (dreamId, goal) => {
    const userId = currentUser?.id;
    if (!userId) return;
    
    const currentWeekIso = getCurrentIsoWeek();
    
    let weeksToPopulate = [];
    
    if (goal.type === 'consistency') {
      if (goal.targetWeeks) {
        weeksToPopulate = getNextNWeeks(currentWeekIso, goal.targetWeeks);
      } else {
        weeksToPopulate = getNextNWeeks(currentWeekIso, 3);
      }
    } else if (goal.type === 'deadline' && goal.targetDate) {
      const targetDate = new Date(goal.targetDate);
      const currentDate = new Date();
      const daysUntilDeadline = Math.ceil((targetDate - currentDate) / (1000 * 60 * 60 * 24));
      const weeksUntilDeadline = Math.ceil(daysUntilDeadline / 7);
      weeksToPopulate = getNextNWeeks(currentWeekIso, Math.max(1, weeksUntilDeadline));
    }
    
    if (weeksToPopulate.length === 0) return;
    
    console.log(`📅 Auto-populating ${weeksToPopulate.length} weeks for goal "${goal.title}"`);
    
    for (const weekId of weeksToPopulate) {
      const weekYear = parseInt(weekId.split('-')[0]);
      const weekEntry = {
        id: `${goal.id}_${weekId}`,
        goalId: goal.id,
        dreamId: dreamId,
        dreamTitle: localDream.title,
        dreamCategory: localDream.category,
        goalTitle: goal.title,
        weekId: weekId,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      try {
        await weekService.saveWeekGoals(userId, weekYear, weekId, [weekEntry]);
      } catch (error) {
        console.error(`Failed to populate week ${weekId}:`, error);
      }
    }
  }, [currentUser, localDream]);

  // Goal handlers
  const handleAddGoal = useCallback(async () => {
    if (!newGoalData.title.trim()) return;
    
    const nowIso = new Date().toISOString();
    const goal = {
      id: `goal_${Date.now()}`,
      title: newGoalData.title.trim(),
      description: newGoalData.description.trim(),
      completed: false,
      type: newGoalData.type,
      recurrence: newGoalData.recurrence,
      targetWeeks: newGoalData.type === 'consistency' ? parseInt(newGoalData.targetWeeks) : null,
      startDate: newGoalData.startDate || nowIso,
      targetDate: newGoalData.type === 'deadline' ? newGoalData.targetDate : null,
      active: true,
      createdAt: nowIso
    };
    
    await addGoal(localDream.id, goal);
    
    setNewGoalData({ title: '', description: '', type: 'consistency', recurrence: 'weekly', targetWeeks: 12, targetMonths: 6, startDate: '', targetDate: '' });
    setIsAddingGoal(false);
    
    if (goal.type === 'consistency' || goal.type === 'deadline') {
      await populateWeeklyEntries(localDream.id, goal);
    }
  }, [newGoalData, localDream.id, addGoal, populateWeeklyEntries]);

  const toggleGoal = useCallback((goalId) => {
    const goal = localDream.goals.find(g => g.id === goalId);
    const updatedGoal = { 
      ...goal, 
      completed: !goal.completed, 
      completedAt: !goal.completed ? new Date().toISOString() : null 
    };
    
    updateGoal(localDream.id, updatedGoal);
  }, [localDream.goals, localDream.id, updateGoal]);

  const cleanupWeeklyEntries = useCallback(async (goalId) => {
    const userId = currentUser?.id;
    if (!userId) return;
    
    const currentYear = new Date().getFullYear();
    console.log(`🧹 Cleaning up weekly entries for goal ${goalId}`);
    
    try {
      const weekDocResult = await weekService.getWeekGoals(userId, currentYear);
      
      if (!weekDocResult.success || !weekDocResult.data) {
        console.log('No week document found, nothing to cleanup');
        return;
      }
      
      const weekDoc = weekDocResult.data;
      
      if (weekDoc.weeks) {
        for (const [weekId, weekData] of Object.entries(weekDoc.weeks)) {
          if (weekData.goals && weekData.goals.length > 0) {
            const filteredGoals = weekData.goals.filter(g => g.goalId !== goalId);
            
            if (filteredGoals.length !== weekData.goals.length) {
              console.log(`🧹 Removing ${weekData.goals.length - filteredGoals.length} entries from ${weekId}`);
              const weekYear = parseInt(weekId.split('-')[0]);
              await weekService.saveWeekGoals(userId, weekYear, weekId, filteredGoals);
            }
          }
        }
      }
      
      console.log(`✅ Cleanup complete for goal ${goalId}`);
    } catch (error) {
      console.error('❌ Failed to cleanup weekly entries:', error);
    }
  }, [currentUser]);

  const handleDeleteGoal = useCallback(async (goalId) => {
    await deleteGoal(localDream.id, goalId);
    await cleanupWeeklyEntries(goalId);
  }, [localDream.id, deleteGoal, cleanupWeeklyEntries]);

  const startEditingGoal = useCallback((goal) => {
    setEditingGoal(goal.id);
    setGoalEditData({
      title: goal.title,
      description: goal.description || '',
      type: goal.type || 'consistency',
      recurrence: goal.recurrence || 'weekly',
      targetWeeks: goal.targetWeeks || 12,
      startDate: goal.startDate || new Date().toISOString(),
      targetDate: goal.targetDate || ''
    });
  }, []);

  const cancelEditingGoal = useCallback(() => {
    setEditingGoal(null);
    setGoalEditData({ title: '', description: '', type: 'consistency', recurrence: 'weekly', targetWeeks: 12, targetMonths: 6, startDate: '', targetDate: '' });
  }, []);

  const saveEditedGoal = useCallback(async () => {
    if (!goalEditData.title.trim()) return;

    const goal = localDream.goals.find(g => g.id === editingGoal);
    const updatedGoal = {
      ...goal,
      title: goalEditData.title.trim(),
      description: goalEditData.description.trim(),
      type: goalEditData.type,
      recurrence: goalEditData.recurrence,
      targetWeeks: goalEditData.targetWeeks,
      startDate: goalEditData.startDate,
      targetDate: goalEditData.targetDate
    };

    await updateGoal(localDream.id, updatedGoal);

    if (updatedGoal.type === 'consistency' || updatedGoal.type === 'deadline') {
      await populateWeeklyEntries(localDream.id, updatedGoal);
    }

    cancelEditingGoal();
  }, [goalEditData, editingGoal, localDream, updateGoal, populateWeeklyEntries, cancelEditingGoal]);

  // Note handlers
  const addNote = useCallback(() => {
    if (newNote.trim()) {
      const note = {
        id: `note_${Date.now()}`,
        text: newNote.trim(),
        timestamp: new Date().toISOString()
      };
      
      const updatedDream = {
        ...localDream,
        notes: [note, ...localDream.notes]
      };
      
      setLocalDream(updatedDream);
      setNewNote('');
      setHasChanges(true);
      
      const historyEntry = {
        id: `history_${Date.now()}`,
        type: 'note',
        action: 'Added new note',
        timestamp: new Date().toISOString()
      };
      
      updatedDream.history = [historyEntry, ...updatedDream.history];
      setLocalDream(updatedDream);
    }
  }, [newNote, localDream]);

  // Save handler
  const handleSave = useCallback(() => {
    onUpdate(localDream);
    setHasChanges(false);
  }, [localDream, onUpdate]);

  // Helper functions
  const getCategoryIcon = useCallback((category) => {
    const icons = { 'Health': '💪', 'Travel': '✈️', 'Career': '💼', 'Learning': '📚', 'Creative': '🎨', 
      'Financial': '💰', 'Relationships': '👥', 'Adventure': '⚡', 'Spiritual': '🙏', 'Community': '🤝' };
    return icons[category] || '🎯';
  }, []);
  const getProgressColor = useCallback((progress) => progress >= 80 ? 'bg-netsurit-red' : progress >= 50 ? 'bg-netsurit-coral' : progress >= 20 ? 'bg-netsurit-orange' : 'bg-professional-gray-400', []);
  const formatDate = useCallback((timestamp) => new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), []);

  // Calculated values
  const completedGoals = useMemo(() => localDream.goals?.filter(g => g.completed).length || 0, [localDream.goals]);
  const totalGoals = useMemo(() => localDream.goals?.length || 0, [localDream.goals]);

  return {
    // State
    activeTab,
    setActiveTab,
    localDream,
    hasChanges,
    newNote,
    setNewNote,
    isAddingGoal,
    setIsAddingGoal,
    newGoalData,
    setNewGoalData,
    editingGoal,
    goalEditData,
    setGoalEditData,
    
    // Progress handlers
    handleProgressChange,
    toggleComplete,
    
    // Goal handlers
    handleAddGoal,
    toggleGoal,
    handleDeleteGoal,
    startEditingGoal,
    cancelEditingGoal,
    saveEditedGoal,
    
    // Note handlers
    addNote,
    
    // Save handler
    handleSave,
    
    // Helpers
    getCategoryIcon,
    getProgressColor,
    formatDate,
    
    // Calculated
    completedGoals,
    totalGoals,
  };
}

