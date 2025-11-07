// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek, getNextNWeeks } from '../utils/dateUtils';

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
    deleteGoal,
    addWeeklyGoal,
    addWeeklyGoalsBatch,
    weeklyGoals,
    deleteWeeklyGoal
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

  // Weekly entries creation - SAME pattern as Week Ahead
  const createWeeklyEntries = useCallback(async (goal) => {
    const currentWeekIso = getCurrentIsoWeek();
    
    console.log(`📅 Creating weekly entries using Week Ahead pattern for goal "${goal.title}"`);
    
    try {
      if (goal.type === 'consistency' && goal.recurrence === 'weekly') {
        // Create template for weekly recurring goals (SAME as Week Ahead)
        const template = {
          id: goal.id,
          type: 'weekly_goal_template',
          goalType: 'consistency',
          title: goal.title,
          description: goal.description || '',
          dreamId: localDream.id,
          dreamTitle: localDream.title,
          dreamCategory: localDream.category,
          recurrence: 'weekly',
          targetWeeks: goal.targetWeeks,
          active: true,
          startDate: goal.startDate || new Date().toISOString(),
          createdAt: goal.createdAt || new Date().toISOString()
        };
        
        console.log('✨ Creating weekly recurring template:', template.id);
        await addWeeklyGoal(template);
        console.log('✅ Weekly template created');
        
      } else if (goal.type === 'consistency' && goal.recurrence === 'monthly') {
        // Create instances for monthly goals (SAME as Week Ahead)
        const months = goal.targetMonths || 6;
        const totalWeeks = months * 4;
        const weekIsoStrings = getNextNWeeks(currentWeekIso, totalWeeks);
        
        const instances = weekIsoStrings.map(weekIso => ({
          id: `${goal.id}_${weekIso}`,
          type: 'weekly_goal',
          goalType: 'consistency',
          goalId: goal.id,
          title: goal.title,
          description: goal.description || '',
          dreamId: localDream.id,
          dreamTitle: localDream.title,
          dreamCategory: localDream.category,
          recurrence: 'monthly',
          targetMonths: months,
          weekId: weekIso,
          completed: false,
          createdAt: new Date().toISOString()
        }));
        
        console.log(`📅 Creating ${instances.length} monthly goal instances`);
        await addWeeklyGoalsBatch(instances);
        console.log('✅ Monthly instances created');
        
      } else if (goal.type === 'deadline' && goal.targetDate) {
        // Create instances for deadline goals (SAME as Week Ahead)
        const targetDate = new Date(goal.targetDate);
        const currentDate = new Date();
        const daysUntilDeadline = Math.ceil((targetDate - currentDate) / (1000 * 60 * 60 * 24));
        const weeksUntilDeadline = Math.ceil(daysUntilDeadline / 7);
        const weekIsoStrings = getNextNWeeks(currentWeekIso, Math.max(1, weeksUntilDeadline));
        
        const instances = weekIsoStrings.map(weekIso => ({
          id: `${goal.id}_${weekIso}`,
          type: 'deadline',
          goalType: 'deadline',
          goalId: goal.id,
          title: goal.title,
          description: goal.description || '',
          dreamId: localDream.id,
          dreamTitle: localDream.title,
          dreamCategory: localDream.category,
          targetDate: goal.targetDate,
          weekId: weekIso,
          completed: false,
          createdAt: new Date().toISOString()
        }));
        
        console.log(`📅 Creating ${instances.length} deadline goal instances`);
        await addWeeklyGoalsBatch(instances);
        console.log('✅ Deadline instances created');
      }
    } catch (error) {
      console.error('❌ Failed to create weekly entries:', error);
      throw error;
    }
  }, [currentUser, localDream, addWeeklyGoal, addWeeklyGoalsBatch]);

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
      recurrence: newGoalData.type === 'consistency' ? newGoalData.recurrence : undefined,
      targetWeeks: newGoalData.type === 'consistency' && newGoalData.recurrence === 'weekly' ? parseInt(newGoalData.targetWeeks) : undefined,
      targetMonths: newGoalData.type === 'consistency' && newGoalData.recurrence === 'monthly' ? parseInt(newGoalData.targetMonths) : undefined,
      startDate: newGoalData.startDate || nowIso,
      targetDate: newGoalData.type === 'deadline' ? newGoalData.targetDate : undefined,
      active: true,
      createdAt: nowIso
    };
    
    console.log('📝 Adding goal to dream:', goal);
    
    await addGoal(localDream.id, goal);
    
    setNewGoalData({ title: '', description: '', type: 'consistency', recurrence: 'weekly', targetWeeks: 12, targetMonths: 6, startDate: '', targetDate: '' });
    setIsAddingGoal(false);
    
    // Create weekly entries using the SAME pattern as Week Ahead
    if (goal.type === 'consistency' || goal.type === 'deadline') {
      try {
        await createWeeklyEntries(goal);
        console.log('✅ Successfully created weekly entries');
      } catch (error) {
        console.error('❌ Failed to create weekly entries:', error);
        alert(`Goal was created but failed to create weekly entries: ${error.message}. Please try editing the goal to regenerate entries.`);
      }
    }
  }, [newGoalData, localDream.id, addGoal, createWeeklyEntries]);

  const toggleGoal = useCallback((goalId) => {
    const goal = localDream.goals.find(g => g.id === goalId);
    const updatedGoal = { 
      ...goal, 
      completed: !goal.completed, 
      completedAt: !goal.completed ? new Date().toISOString() : null 
    };
    
    updateGoal(localDream.id, updatedGoal);
  }, [localDream.goals, localDream.id, updateGoal]);

  const handleDeleteGoal = useCallback(async (goalId) => {
    console.log(`🗑️ Deleting goal ${goalId} from dream and all weekly goals`);
    
    try {
      // Find all weekly goals (templates and instances) associated with this goal
      const relatedWeeklyGoals = weeklyGoals.filter(wg => 
        wg.goalId === goalId || wg.id === goalId
      );
      
      console.log(`🗑️ Found ${relatedWeeklyGoals.length} weekly goals to delete`);
      
      // Delete each weekly goal (deleteWeeklyGoal handles templates vs instances)
      for (const weeklyGoal of relatedWeeklyGoals) {
        await deleteWeeklyGoal(weeklyGoal.id);
      }
      
      // Delete the goal from the dream
      await deleteGoal(localDream.id, goalId);
      
      console.log(`✅ Successfully deleted goal ${goalId} and all associated weekly goals`);
      
      // Trigger parent refresh to update dashboard/week ahead views
      if (onUpdate) {
        onUpdate();
      }
      
      // Small delay to allow state to propagate
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('goals-updated'));
      }, 100);
    } catch (error) {
      console.error('❌ Error deleting goal:', error);
      alert(`Failed to delete goal: ${error.message}`);
    }
  }, [localDream.id, deleteGoal, weeklyGoals, deleteWeeklyGoal, onUpdate]);

  const startEditingGoal = useCallback((goal) => {
    setEditingGoal(goal.id);
    setGoalEditData({
      title: goal.title,
      description: goal.description || '',
      type: goal.type || 'consistency',
      recurrence: goal.recurrence || 'weekly',
      targetWeeks: goal.targetWeeks || 12,
      targetMonths: goal.targetMonths || 6,
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
      recurrence: goalEditData.type === 'consistency' ? goalEditData.recurrence : undefined,
      targetWeeks: goalEditData.type === 'consistency' && goalEditData.recurrence === 'weekly' ? parseInt(goalEditData.targetWeeks) : undefined,
      targetMonths: goalEditData.type === 'consistency' && goalEditData.recurrence === 'monthly' ? parseInt(goalEditData.targetMonths) : undefined,
      startDate: goalEditData.startDate,
      targetDate: goalEditData.type === 'deadline' ? goalEditData.targetDate : undefined
    };

    console.log('💾 Updating goal in dream:', updatedGoal);

    await updateGoal(localDream.id, updatedGoal);

    // Re-create weekly entries if needed
    if (updatedGoal.type === 'consistency' || updatedGoal.type === 'deadline') {
      console.log('📅 Re-creating weekly entries after goal update');
      try {
        await createWeeklyEntries(updatedGoal);
      } catch (error) {
        console.error('❌ Failed to recreate weekly entries:', error);
      }
    }

    cancelEditingGoal();
  }, [goalEditData, editingGoal, localDream, updateGoal, createWeeklyEntries, cancelEditingGoal]);

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

