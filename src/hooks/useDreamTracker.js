// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentIsoWeek, getNextNWeeks, getWeeksUntilDate, monthsToWeeks, dateToWeeks } from '../utils/dateUtils';
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
    weeklyGoals,
    updateWeeklyGoal,
    deleteWeeklyGoal
  } = useApp();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Dream state - MUST be initialized before dreamGoals useMemo
  const [localDream, setLocalDream] = useState({
    ...dream,
    goals: dream.goals || [],
    notes: dream.notes || [],
    history: dream.history || []
  });
  
  // Get templates for this dream from weeklyGoals + legacy goals from localDream.goals
  // Use localDream.goals instead of dream.goals to reflect immediate UI updates
  // NOTE: This must be AFTER localDream is initialized
  const dreamGoals = useMemo(() => {
    console.log(`🔍 [useDreamTracker] Loading goals for dream "${localDream.title}" (${localDream.id})`);
    
    // Source 1: Templates from weeklyGoals (new way)
    // ✅ Match by dreamId (preferred) OR dreamTitle (fallback)
    const templates = weeklyGoals.filter(g => {
      if (g.type !== 'weekly_goal_template') return false;
      
      // Match by dreamId (preferred) OR dreamTitle (fallback)
      const matchesId = g.dreamId === localDream.id;
      const matchesTitle = g.dreamTitle === localDream.title;
      
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
    
    // Source 2: Legacy goals from localDream.goals array (old way + non-template goals)
    // Use localDream.goals to reflect immediate state changes
    const legacyGoals = (localDream.goals || []).filter(g => g && g.id);
    
    // Source 3: Check if any templates are missing from weeklyGoals but exist in localDream.goals
    // This handles cases where goal was created but template wasn't properly saved
    
    // Combine all sources, removing duplicates by ID
    const templateIds = new Set(templates.map(t => t.id));
    const uniqueLegacyGoals = legacyGoals.filter(g => !templateIds.has(g.id));
    
    const combined = [...templates, ...uniqueLegacyGoals];
    
    console.log(`  📊 Goal loading summary:`, {
      dreamId: localDream.id,
      dreamTitle: localDream.title,
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
  }, [weeklyGoals, localDream.id, localDream.goals, localDream.title]);
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

  // NOTE: createWeeklyEntries() removed - no longer needed.
  // Dashboard auto-instantiation reads from dream.goals[] and handles instances automatically.

  // Goal handlers
  const handleAddGoal = useCallback(async () => {
    if (!newGoalData.title.trim()) return;
    
    const nowIso = new Date().toISOString();
    const currentWeekIso = getCurrentIsoWeek();
    
    // Calculate targetWeeks and weeksRemaining for goals
    // For deadline goals: convert targetDate to targetWeeks
    let targetWeeks, weeksRemaining;
    if (newGoalData.type === 'deadline' && newGoalData.targetDate) {
      targetWeeks = dateToWeeks(newGoalData.targetDate, currentWeekIso);
      weeksRemaining = targetWeeks; // Initialize with targetWeeks
    } else if (newGoalData.type === 'consistency' && newGoalData.recurrence === 'weekly') {
      targetWeeks = parseInt(newGoalData.targetWeeks);
      weeksRemaining = targetWeeks;
    } else if (newGoalData.type === 'consistency' && newGoalData.recurrence === 'monthly') {
      targetWeeks = monthsToWeeks(parseInt(newGoalData.targetMonths));
      weeksRemaining = targetWeeks;
    } else {
      targetWeeks = undefined;
      weeksRemaining = undefined;
    }
    
    const goal = {
      id: `goal_${Date.now()}`,
      title: newGoalData.title.trim(),
      description: newGoalData.description.trim(),
      completed: false,
      type: newGoalData.type,
      recurrence: newGoalData.type === 'consistency' ? newGoalData.recurrence : undefined,
      targetWeeks: targetWeeks, // All goal types now use targetWeeks
      targetMonths: newGoalData.type === 'consistency' && newGoalData.recurrence === 'monthly' ? parseInt(newGoalData.targetMonths) : undefined,
      startDate: newGoalData.startDate || nowIso,
      // targetDate is kept for backward compatibility but targetWeeks is the source of truth
      targetDate: newGoalData.type === 'deadline' ? newGoalData.targetDate : undefined,
      weeksRemaining: weeksRemaining,
      active: true,
      createdAt: nowIso
    };
    
    console.log('📝 Adding goal to dream:', goal);
    
    // Add goal to dream.goals[] array - this is the single source of truth
    // Dashboard auto-instantiation will read from dream.goals[] to create weekly instances
    await addGoal(localDream.id, goal);
    
    setNewGoalData({ title: '', description: '', type: 'consistency', recurrence: 'weekly', targetWeeks: 12, targetMonths: 6, startDate: '', targetDate: '' });
    setIsAddingGoal(false);
    
    // NOTE: No need to manually create weekly entries or add to currentWeek.
    // Dashboard auto-instantiation (useDashboardData.js) reads from dream.goals[]
    // and automatically creates instances for the current week.
    
    // Trigger dashboard refresh
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('goals-updated'));
    }, 100);
  }, [newGoalData, localDream.id, localDream.title, localDream.category, addGoal, currentUser.id]);

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
      const isCompleting = !goal.completed;
      const updatedGoal = { 
        ...goal, 
        completed: isCompleting,
        completedAt: isCompleting ? new Date().toISOString() : null,
        // For deadline goals: when unchecking (marking incomplete), reactivate it
        // This ensures it will appear in future week rollovers
        active: goal.type === 'deadline' 
          ? (isCompleting ? false : true)  // Set inactive when completing, active when uncompleting
          : goal.active  // Keep existing active state for consistency goals
      };
      
      // If unchecking a deadline goal, recalculate weeksRemaining if it was -1
      if (goal.type === 'deadline' && !isCompleting && goal.weeksRemaining === -1) {
        const currentWeekIso = getCurrentIsoWeek();
        if (goal.targetDate) {
          // Recalculate weeksRemaining from targetDate
          updatedGoal.weeksRemaining = getWeeksUntilDate(goal.targetDate, currentWeekIso);
        } else if (goal.targetWeeks !== undefined) {
          // Use targetWeeks as fallback
          updatedGoal.weeksRemaining = goal.targetWeeks;
        }
        console.log(`🔄 Reactivating deadline goal "${goal.title}" - recalculated weeksRemaining: ${updatedGoal.weeksRemaining}`);
      }
      
      // OPTIMISTIC UPDATE: Update local state immediately for instant UI feedback
      const updatedLocalDream = {
        ...localDream,
        goals: (localDream.goals || []).map(g => 
          g.id === goalId ? updatedGoal : g
        )
      };
      setLocalDream(updatedLocalDream);
      
      await updateGoal(localDream.id, updatedGoal);
      
      // SYNC WITH CURRENTWEEK CONTAINER (for all goal types)
      // Goals in currentWeek can be matched by:
      // 1. Exact ID match (for deadline goals: goalId)
      // 2. TemplateId match (for consistency goals: goalId is the templateId)
      // 3. ID pattern match (goalId_weekId format)
      try {
        console.log('📝 Syncing goal completion to currentWeek:', {
          goalId,
          goalType: goal.type,
          completed: updatedGoal.completed
        });
        
        const currentWeekIso = getCurrentIsoWeek();
        const currentWeekResponse = await currentWeekService.getCurrentWeek(currentUser.id);
        
        if (currentWeekResponse.success && currentWeekResponse.data?.goals) {
          const existingGoals = currentWeekResponse.data.goals;
          
          // Try multiple matching strategies
          let goalInCurrentWeek = existingGoals.find(g => 
            g.id === goalId || // Exact match (deadline goals)
            g.templateId === goalId || // TemplateId match (consistency goals)
            g.id === `${goalId}_${currentWeekIso}` // Pattern match (goalId_weekId)
          );
          
          if (goalInCurrentWeek) {
            console.log('✅ Found goal in currentWeek:', {
              foundId: goalInCurrentWeek.id,
              templateId: goalInCurrentWeek.templateId,
              currentCompleted: goalInCurrentWeek.completed,
              newCompleted: updatedGoal.completed
            });
            
            // Update the goal in currentWeek
            const updatedGoals = existingGoals.map(g => {
              const isMatch = g.id === goalId || 
                            g.templateId === goalId || 
                            g.id === `${goalId}_${currentWeekIso}`;
              
              if (isMatch) {
                return { 
                  ...g, 
                  completed: updatedGoal.completed,
                  completedAt: updatedGoal.completedAt
                };
              }
              return g;
            });
            
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
          } else {
            // Goal not found in currentWeek - might be a deadline goal that was completed
            // If unchecking a deadline goal, we should create it in currentWeek for immediate visibility
            if (goal.type === 'deadline' && !isCompleting) {
              console.log('📝 Deadline goal not in currentWeek - creating instance for immediate visibility');
              
              const currentWeekIso = getCurrentIsoWeek();
              const currentWeekGoal = {
                id: `${goalId}_${currentWeekIso}`,
                templateId: goalId,
                type: 'deadline',
                title: goal.title,
                description: goal.description || '',
                dreamId: localDream.id,
                dreamTitle: localDream.title,
                dreamCategory: localDream.category,
                targetWeeks: updatedGoal.targetWeeks,
                targetDate: updatedGoal.targetDate,
                weeksRemaining: updatedGoal.weeksRemaining,
                completed: false,
                completedAt: null,
                skipped: false,
                weekId: currentWeekIso,
                createdAt: new Date().toISOString()
              };
              
              const currentWeekResponse = await currentWeekService.getCurrentWeek(currentUser.id);
              const existingGoals = currentWeekResponse.success && currentWeekResponse.data?.goals || [];
              const updatedGoals = [...existingGoals, currentWeekGoal];
              
              const result = await currentWeekService.saveCurrentWeek(
                currentUser.id,
                currentWeekIso,
                updatedGoals
              );
              
              if (result.success) {
                console.log('✅ Created deadline goal instance in currentWeek');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('goals-updated'));
                }, 100);
              }
            } else {
              console.log('⚠️ Goal not found in currentWeek, may need to be instantiated:', {
                goalId,
                goalType: goal.type,
                currentWeekGoals: existingGoals.map(g => ({ id: g.id, templateId: g.templateId }))
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Error syncing goal to currentWeek:', error);
        // Don't fail the whole operation if this fails
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
    
    const currentWeekIso = getCurrentIsoWeek();
    
    // Recalculate targetWeeks and weeksRemaining for goals
    // For deadline goals: convert targetDate to targetWeeks
    let targetWeeks, weeksRemaining;
    if (goalEditData.type === 'deadline' && goalEditData.targetDate) {
      targetWeeks = dateToWeeks(goalEditData.targetDate, currentWeekIso);
      weeksRemaining = targetWeeks; // Use targetWeeks as weeksRemaining
    } else if (goalEditData.type === 'consistency' && goalEditData.recurrence === 'weekly') {
      targetWeeks = parseInt(goalEditData.targetWeeks);
      weeksRemaining = targetWeeks;
    } else if (goalEditData.type === 'consistency' && goalEditData.recurrence === 'monthly') {
      targetWeeks = monthsToWeeks(parseInt(goalEditData.targetMonths));
      weeksRemaining = targetWeeks;
    } else {
      // Keep existing values if type didn't change
      targetWeeks = goal.targetWeeks;
      weeksRemaining = goal.weeksRemaining;
    }
    
    const updatedGoal = {
      ...goal,
      title: goalEditData.title.trim(),
      description: goalEditData.description.trim(),
      type: goalEditData.type,
      recurrence: goalEditData.type === 'consistency' ? goalEditData.recurrence : undefined,
      targetWeeks: targetWeeks, // All goal types now use targetWeeks
      targetMonths: goalEditData.type === 'consistency' && goalEditData.recurrence === 'monthly' ? parseInt(goalEditData.targetMonths) : undefined,
      startDate: goalEditData.startDate,
      // targetDate is kept for backward compatibility but targetWeeks is the source of truth
      targetDate: goalEditData.type === 'deadline' ? goalEditData.targetDate : undefined,
      weeksRemaining: weeksRemaining,
      updatedAt: new Date().toISOString()
    };

    console.log(`💾 Updating ${isTemplate ? 'template' : 'legacy goal'}:`, updatedGoal);

    if (isTemplate) {
      await updateWeeklyGoal(updatedGoal);
    } else {
      await updateGoal(localDream.id, updatedGoal);
    }

    // Re-create weekly entries if needed
    // NOTE: No need to recreate weekly entries manually.
    // Dashboard auto-instantiation reads from dream.goals[] and handles instances automatically.

    cancelEditingGoal();
  }, [goalEditData, editingGoal, dreamGoals, localDream.id, updateWeeklyGoal, updateGoal, cancelEditingGoal]);

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

  // Privacy handler
  const handlePrivacyChange = useCallback((isPublic) => {
    const updatedDream = {
      ...localDream,
      isPublic: isPublic
    };
    setLocalDream(updatedDream);
    setHasChanges(true);
  }, [localDream]);

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
    
    // Privacy handler
    handlePrivacyChange,
    
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

