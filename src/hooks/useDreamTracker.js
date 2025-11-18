// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek, getNextNWeeks } from '../utils/dateUtils';
import currentWeekService from '../services/currentWeekService';

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
    updateWeeklyGoal,
    deleteWeeklyGoal
  } = useApp();
  
  // Get templates for this dream from weeklyGoals + legacy goals from dream.goals
  const dreamGoals = useMemo(() => {
    console.log(`🔍 [useDreamTracker] Loading goals for dream "${dream.title}" (${dream.id})`);
    
    // Source 1: Templates from weeklyGoals (new way)
    // ✅ Match by dreamId (preferred) OR dreamTitle (fallback)
    const templates = weeklyGoals.filter(g => {
      if (g.type !== 'weekly_goal_template') return false;
      
      // Match by dreamId (preferred) OR dreamTitle (fallback)
      const matchesId = g.dreamId === dream.id;
      const matchesTitle = g.dreamTitle === dream.title;
      
      if (matchesId) {
        console.log(`  ✅ Template "${g.title}" matches by dreamId (${g.dreamId})`);
        return true;
      }
      
      if (matchesTitle) {
        // Accept any dreamTitle match, even if dreamId is different or missing
        console.log(`  ✅ Template "${g.title}" matches by dreamTitle (dreamId: ${g.dreamId || 'missing'})`);
        return true;
      }
      
      return false;
    });
    
    // Source 2: Legacy goals from dream.goals array (old way + non-template goals)
    const legacyGoals = (dream.goals || []).filter(g => g && g.id);
    
    // Source 3: Check if any templates are missing from weeklyGoals but exist in dream.goals
    // This handles cases where goal was created but template wasn't properly saved
    
    // Combine all sources, removing duplicates by ID
    const templateIds = new Set(templates.map(t => t.id));
    const uniqueLegacyGoals = legacyGoals.filter(g => !templateIds.has(g.id));
    
    const combined = [...templates, ...uniqueLegacyGoals];
    
    console.log(`  📊 Goal loading summary:`, {
      dreamId: dream.id,
      dreamTitle: dream.title,
      templatesFound: templates.length,
      legacyGoalsFound: legacyGoals.length,
      uniqueLegacyGoals: uniqueLegacyGoals.length,
      totalGoals: combined.length
    });
    
    if (combined.length > 0) {
      console.log(`  📋 Goals list:`, combined.map(g => ({ 
        id: g.id, 
        title: g.title, 
        type: g.type, 
        source: g.type === 'weekly_goal_template' ? 'template' : 'legacy'
      })));
    }
    
    return combined;
  }, [weeklyGoals, dream.id, dream.goals, dream.title]);

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
    const currentWeekIso = getCurrentIsoWeek();
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
    
    // Also add to currentWeek container (so it shows on Dashboard)
    try {
      console.log('📅 Adding goal to currentWeek container');
      
      const currentWeekGoal = {
        id: goal.id,
        templateId: goal.id, // Self-reference for now
        type: goal.type === 'deadline' ? 'deadline' : 'weekly_goal',
        title: goal.title,
        description: goal.description || '',
        dreamId: localDream.id,
        dreamTitle: localDream.title,
        dreamCategory: localDream.category,
        recurrence: goal.type === 'consistency' ? goal.recurrence : undefined,
        targetWeeks: goal.targetWeeks,
        targetMonths: goal.targetMonths,
        targetDate: goal.targetDate,
        frequency: goal.type === 'consistency' && goal.recurrence === 'monthly' ? 2 : null,
        completionCount: 0,
        completionDates: [],
        completed: false,
        completedAt: null,
        skipped: false,
        weeksRemaining: goal.targetWeeks || null,
        monthsRemaining: goal.targetMonths || null,
        weekId: currentWeekIso,
        createdAt: nowIso
      };
      
      // Get existing goals from current week
      const currentWeekResponse = await currentWeekService.getCurrentWeek(currentUser.id);
      const existingGoals = currentWeekResponse.success && currentWeekResponse.data?.goals || [];
      
      // Add new goal to current week
      const updatedGoals = [...existingGoals, currentWeekGoal];
      const result = await currentWeekService.saveCurrentWeek(
        currentUser.id,
        currentWeekIso,
        updatedGoals
      );
      
      if (result.success) {
        console.log('✅ Goal added to currentWeek successfully');
      } else {
        console.error('❌ Failed to add goal to currentWeek:', result.error);
      }
    } catch (error) {
      console.error('❌ Error adding goal to currentWeek:', error);
      // Don't fail the whole operation if this fails
    }
    
    setNewGoalData({ title: '', description: '', type: 'consistency', recurrence: 'weekly', targetWeeks: 12, targetMonths: 6, startDate: '', targetDate: '' });
    setIsAddingGoal(false);
    
    // Create weekly entries using the SAME pattern as Week Ahead (legacy system)
    if (goal.type === 'consistency' || goal.type === 'deadline') {
      try {
        await createWeeklyEntries(goal);
        console.log('✅ Successfully created weekly entries');
      } catch (error) {
        console.error('❌ Failed to create weekly entries:', error);
        alert(`Goal was created but failed to create weekly entries: ${error.message}. Please try editing the goal to regenerate entries.`);
      }
    }
    
    // Trigger dashboard refresh
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('goals-updated'));
    }, 100);
  }, [newGoalData, localDream.id, localDream.title, localDream.category, addGoal, createWeeklyEntries, currentUser.id]);

  const toggleGoal = useCallback(async (goalId) => {
    const goal = dreamGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Check if this is a template or legacy goal
    const isTemplate = goal.type === 'weekly_goal_template';
    
    if (isTemplate) {
      // Templates use 'active' field
      const updatedGoal = { 
        ...goal, 
        active: !goal.active,
        updatedAt: new Date().toISOString()
      };
      updateWeeklyGoal(updatedGoal);
    } else {
      // Legacy goals use 'completed' field
      const updatedGoal = { 
        ...goal, 
        completed: !goal.completed,
        completedAt: !goal.completed ? new Date().toISOString() : null 
      };
      await updateGoal(localDream.id, updatedGoal);
      
      // SYNC WITH CURRENTWEEK CONTAINER (for deadline goals)
      if (goal.type === 'deadline') {
        try {
          console.log('📝 Syncing goal completion to currentWeek:', {
            goalId,
            completed: updatedGoal.completed
          });
          
          const currentWeekIso = getCurrentIsoWeek();
          const currentWeekResponse = await currentWeekService.getCurrentWeek(currentUser.id);
          
          if (currentWeekResponse.success && currentWeekResponse.data?.goals) {
            const existingGoals = currentWeekResponse.data.goals;
            const goalInCurrentWeek = existingGoals.find(g => g.id === goalId);
            
            if (goalInCurrentWeek) {
              // Update the goal in currentWeek
              const updatedGoals = existingGoals.map(g => 
                g.id === goalId 
                  ? { 
                      ...g, 
                      completed: updatedGoal.completed,
                      completedAt: updatedGoal.completedAt
                    }
                  : g
              );
              
              const result = await currentWeekService.saveCurrentWeek(
                currentUser.id,
                currentWeekIso,
                updatedGoals
              );
              
              if (result.success) {
                console.log('✅ Goal synced to currentWeek successfully');
                
                // Trigger dashboard refresh
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('goals-updated'));
                }, 100);
              } else {
                console.error('❌ Failed to sync goal to currentWeek:', result.error);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error syncing goal to currentWeek:', error);
          // Don't fail the whole operation if this fails
        }
      }
    }
  }, [dreamGoals, localDream.id, updateWeeklyGoal, updateGoal, currentUser.id]);

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
    
    // Handle both templates (goalType) and legacy goals (type)
    const goalType = goal.type === 'weekly_goal_template' ? goal.goalType : goal.type;
    
    setGoalEditData({
      title: goal.title,
      description: goal.description || '',
      type: goalType || 'consistency',
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

    const goal = dreamGoals.find(g => g.id === editingGoal);
    if (!goal) return;
    
    const isTemplate = goal.type === 'weekly_goal_template';
    
    const updatedGoal = {
      ...goal,
      title: goalEditData.title.trim(),
      description: goalEditData.description.trim(),
      type: goalEditData.type,
      recurrence: goalEditData.type === 'consistency' ? goalEditData.recurrence : undefined,
      targetWeeks: goalEditData.type === 'consistency' && goalEditData.recurrence === 'weekly' ? parseInt(goalEditData.targetWeeks) : undefined,
      targetMonths: goalEditData.type === 'consistency' && goalEditData.recurrence === 'monthly' ? parseInt(goalEditData.targetMonths) : undefined,
      startDate: goalEditData.startDate,
      targetDate: goalEditData.type === 'deadline' ? goalEditData.targetDate : undefined,
      updatedAt: new Date().toISOString()
    };

    console.log(`💾 Updating ${isTemplate ? 'template' : 'legacy goal'}:`, updatedGoal);

    if (isTemplate) {
      await updateWeeklyGoal(updatedGoal);
    } else {
      await updateGoal(localDream.id, updatedGoal);
    }

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
  }, [goalEditData, editingGoal, dreamGoals, localDream.id, updateWeeklyGoal, updateGoal, createWeeklyEntries, cancelEditingGoal]);

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

  // Calculated values - handle both templates (active) and legacy goals (completed)
  const completedGoals = useMemo(() => {
    return dreamGoals.filter(g => {
      if (g.type === 'weekly_goal_template') {
        return g.active !== false; // Templates use 'active'
      }
      return g.completed; // Legacy goals use 'completed'
    }).length;
  }, [dreamGoals]);
  
  const totalGoals = useMemo(() => dreamGoals.length, [dreamGoals]);

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
    dreamGoals, // Goals filtered from templates
  };
}

