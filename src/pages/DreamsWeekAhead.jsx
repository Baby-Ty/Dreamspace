import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Edit3, 
  Trash2, 
  Calendar,
  Target,
  Star,
  Sparkles,
  X,
  Save,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  Repeat
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import HelpTooltip from '../components/HelpTooltip';
import { getCurrentIsoWeek, getIsoWeek, parseIsoWeek, calculateWeekInstancesForDuration, getWeekRange } from '../utils/dateUtils';
import { getMonthIdFromWeek } from '../utils/monthUtils';
import {
  expandRecurringGoals,
  getVisibleGoalsForWeek,
  computeWeekProgress,
  isWeekEditable
} from '../services/weekGoalService';
import weekService from '../services/weekService';
import { isTemplateActiveForWeek } from '../utils/templateValidation';

const DreamsWeekAhead = () => {
  const { currentUser, weeklyGoals, addWeeklyGoal, addWeeklyGoalsBatch, updateWeeklyGoal, deleteWeeklyGoal, toggleWeeklyGoal, logWeeklyCompletion, setWeeklyGoals } = useApp();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedDream, setSelectedDream] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalFormData, setGoalFormData] = useState({
    title: '',
    description: '',
    type: 'consistency', // 'consistency' or 'deadline'
    recurrence: 'weekly', // 'weekly' or 'monthly'
    targetWeeks: 12,
    targetMonths: 6,
    targetDate: ''
  });

  // Month and week selector state
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [activeWeek, setActiveWeek] = useState(null);

  // Motivational quotes
  const motivationalQuotes = [
    "A dream is a wish your heart makes. 💫",
    "The future belongs to those who believe in their dreams. ✨",
    "Dreams don't work unless you do. 💪",
    "Every small step counts towards your biggest dreams. 🚀",
    "This week is your canvas - paint it beautiful! 🎨",
    "Progress, not perfection. You've got this! 🌟",
    "Dreams become reality one goal at a time. 🎯"
  ];

  const [dailyQuote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  // Track if we're currently loading to prevent duplicate calls
  const [isLoadingWeek, setIsLoadingWeek] = React.useState(false);
  const [loadError, setLoadError] = React.useState(null);
  
  // Load goals for a specific week from weeks container or create from templates
  const loadWeekGoals = async (weekObj) => {
    if (!currentUser?.id || !weekObj || isLoadingWeek) {
      console.log('⏭️ Skipping load:', { hasUser: !!currentUser?.id, hasWeek: !!weekObj, isLoading: isLoadingWeek });
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
      
      // Get milestones for validation
      const milestones = currentUser?.dreamBook
        ?.flatMap(dream => dream.milestones || []) || [];
      
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
        
        // Update state using proper action
        setWeeklyGoals(updatedGoals);
        setLoadError(null);
        
        // Mark week as loaded only after successful load
        loadedWeeksRef.current.add(weekIso);
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
  };

  // Track which weeks we've loaded to prevent re-loading
  const loadedWeeksRef = React.useRef(new Set());
  
  useEffect(() => {
    // Automatically set the current week as active when component loads
    const currentWeek = getCurrentWeek();
    if (currentWeek) {
      setActiveWeek(currentWeek);
    }
  }, []);

  // Listen for goals-updated events to refresh week ahead
  useEffect(() => {
    const handleGoalsUpdated = () => {
      console.log('📢 Goals updated event received, reloading week ahead');
      if (activeWeek) {
        const weekIso = getIsoWeek(activeWeek.start);
        // Clear the loaded flag to force reload
        loadedWeeksRef.current.delete(weekIso);
        // Reload the active week
        loadWeekGoals(activeWeek);
      }
    };
    
    window.addEventListener('goals-updated', handleGoalsUpdated);
    
    return () => {
      window.removeEventListener('goals-updated', handleGoalsUpdated);
    };
  }, [activeWeek, loadWeekGoals]);

  // Load goals when active week changes or when weeklyGoals (templates) are loaded
  useEffect(() => {
    if (activeWeek && currentUser?.id) {
      const weekIso = getIsoWeek(activeWeek.start);
      
      // Clear loaded state when weeklyGoals changes (templates loaded from AppContext)
      // This ensures we reload when templates become available
      if (weeklyGoals.length > 0 && loadedWeeksRef.current.has(weekIso)) {
        const currentWeekGoals = weeklyGoals.filter(g => g.weekId === weekIso);
        // If we have templates but no instances for this week, clear the loaded flag
        if (currentWeekGoals.length === 0) {
          loadedWeeksRef.current.delete(weekIso);
        }
      }
      
      // Only load if we haven't loaded this week yet
      if (!loadedWeeksRef.current.has(weekIso)) {
        // Don't add to loaded set until load completes
        loadWeekGoals(activeWeek);
      }
    }
  }, [activeWeek?.id, currentUser?.id, weeklyGoals.length]);

  // Early return if data is not loaded yet
  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netsurit-red mx-auto mb-4"></div>
          <p className="text-professional-gray-600">Loading Dreams Week Ahead...</p>
        </div>
      </div>
    );
  }

  // Get current week range
  const getCurrentWeekRange = () => {
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
  };

  // Calculate progress percentage using active week's goals
  const getProgressPercentage = () => {
    const weekIso = activeWeek ? getIsoWeek(activeWeek.start) : getCurrentIsoWeek();
    const weekGoals = weeklyGoals.filter(g => g.weekId === weekIso);
    const completed = weekGoals.filter(g => g.completed).length;
    const total = weekGoals.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Get dream emoji/icon
  const getDreamEmoji = (category) => {
    const emojiMap = {
      'Travel': '✈️',
      'Learning': '📚',
      'Health': '💪',
      'Career': '💼',
      'Creative': '🎨',
      'Financial': '💰',
      'Relationships': '❤️',
      'Adventure': '🏔️',
      'Spiritual': '🧘',
      'Community': '🤝'
    };
    return emojiMap[category] || '⭐';
  };

  // Month utilities
  const getMonthNames = () => [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Helper function to format dates consistently
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get ISO weeks that overlap with a given month
  const getIsoWeeksForMonth = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Find the Monday of the week containing the first day of the month
    let current = new Date(firstDay);
    // Go back to Monday (day 1 in ISO 8601, Sunday is 0 in JS)
    const dayOfWeek = current.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
    current.setDate(current.getDate() - daysToMonday);
    
    // Collect all ISO weeks that touch this month
    const seenWeeks = new Set();
    while (current <= lastDay || (weeks.length === 0)) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekIso = getIsoWeek(weekStart);
      
      // Only include if week overlaps with month and we haven't seen it yet
      if (weekEnd >= firstDay && !seenWeeks.has(weekIso)) {
        seenWeeks.add(weekIso);
        const { week: weekNumber } = parseIsoWeek(weekIso);
        
        weeks.push({
          id: weekIso,
          weekNumber: weekNumber,
          startDate: formatDate(weekStart),
          endDate: formatDate(weekEnd),
          range: `${formatDate(weekStart)} – ${formatDate(weekEnd)}`,
          start: new Date(weekStart),
          end: new Date(weekEnd)
        });
      }
      
      // Break if we've gone past the last day and have at least one week
      if (weekStart > lastDay && weeks.length > 0) {
        break;
      }
      
      current.setDate(current.getDate() + 7);
    }
    
    return weeks;
  };

  // Determine per-week progress by filtering goals for that week
  const getWeekProgress = (weekObj) => {
    const weekIso = getIsoWeek(weekObj.start);
    const weekGoals = weeklyGoals.filter(g => g.weekId === weekIso);
    const completed = weekGoals.filter(g => g.completed).length;
    const total = weekGoals.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Find which week contains today's date
  const getCurrentWeek = () => {
    const today = new Date();
    const currentIsoWeek = getCurrentIsoWeek(); // e.g., "2025-W44"
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Check current month first
    const weeks = getIsoWeeksForMonth(currentYear, currentMonth);
    for (const week of weeks) {
      if (week.id === currentIsoWeek) {
        return week;
      }
    }
    
    // If not found (ISO week spans months), check previous month
    if (currentMonth > 0) {
      const prevWeeks = getIsoWeeksForMonth(currentYear, currentMonth - 1);
      for (const week of prevWeeks) {
        if (week.id === currentIsoWeek) {
          return week;
        }
      }
    } else {
      // Check December of previous year if we're in January
      const prevWeeks = getIsoWeeksForMonth(currentYear - 1, 11);
      for (const week of prevWeeks) {
        if (week.id === currentIsoWeek) {
          return week;
        }
      }
    }
    
    // If still not found, check next month (edge case)
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextWeeks = getIsoWeeksForMonth(nextYear, nextMonth);
    for (const week of nextWeeks) {
      if (week.id === currentIsoWeek) {
        return week;
      }
    }
    
    // Fallback: create a week object for the current ISO week
    const { start, end } = getWeekRange(currentIsoWeek);
    return {
      id: currentIsoWeek,
      weekNumber: parseIsoWeek(currentIsoWeek).week,
      startDate: formatDate(start),
      endDate: formatDate(end),
      range: `${formatDate(start)} – ${formatDate(end)}`,
      start: start,
      end: end
    };
  };

  const handleAddGoal = (dream) => {
    setSelectedDream(dream);
    setShowGoalForm(true);
    setGoalFormData({ 
      title: '', 
      description: '',
      type: 'consistency',
      recurrence: 'weekly',
      targetWeeks: 12,
      targetMonths: 6,
      targetDate: ''
    });
  };

  const handleSaveGoal = async () => {
    if (!goalFormData.title.trim()) return;
    
    // Validation for deadline goals
    if (goalFormData.type === 'deadline' && !goalFormData.targetDate) {
      console.error('Deadline goal requires a target date');
      return;
    }

    // Get the active week's ISO week string
    const activeIsoWeek = activeWeek ? getIsoWeek(activeWeek.start) : getCurrentIsoWeek();
    const currentWeekIso = getCurrentIsoWeek();
    
    const goalId = editingGoal?.id || `goal_${Date.now()}`;
    
    if (editingGoal) {
      // Update existing goal
      const updatedGoal = {
        ...editingGoal,
        title: goalFormData.title.trim(),
        description: goalFormData.description.trim(),
        type: goalFormData.type,
        recurrence: goalFormData.type === 'consistency' ? goalFormData.recurrence : undefined,
        targetWeeks: goalFormData.type === 'consistency' && goalFormData.recurrence === 'weekly' ? goalFormData.targetWeeks : undefined,
        targetMonths: goalFormData.type === 'consistency' && goalFormData.recurrence === 'monthly' ? goalFormData.targetMonths : undefined,
        targetDate: goalFormData.type === 'deadline' ? goalFormData.targetDate : undefined,
      };
      
      updateWeeklyGoal(updatedGoal);
    } else {
      // Create new goal
      // For weekly consistency goals, create a template that auto-generates instances
      // For monthly consistency goals and deadline goals, create instances directly
      
      if (goalFormData.type === 'consistency' && goalFormData.recurrence === 'weekly') {
        // Create a template for weekly recurring goals
        const template = {
          id: goalId,
          type: 'weekly_goal_template',
          goalType: 'consistency',
          title: goalFormData.title.trim(),
          description: goalFormData.description.trim(),
          dreamId: selectedDream.id,
          dreamTitle: selectedDream.title,
          dreamCategory: selectedDream.category,
          recurrence: 'weekly',
          targetWeeks: goalFormData.targetWeeks,
          active: true,
          startDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        console.log('✨ Creating weekly recurring template:', template.id);
        await addWeeklyGoal(template);
        console.log('✅ Weekly template created - instances will be auto-generated per week');
        
      } else {
        // For monthly consistency goals and deadline goals, create instances directly
        let weekIsoStrings = [];
        
        if (goalFormData.type === 'consistency' && goalFormData.recurrence === 'monthly') {
          // For monthly goals, create 4 weeks per month
          const months = goalFormData.targetMonths || 6;
          const totalWeeks = months * 4;
          weekIsoStrings = getNextNWeeks(currentWeekIso, totalWeeks);
        } else if (goalFormData.type === 'deadline') {
          // For deadline goals, calculate weeks until target date
          const targetDate = new Date(goalFormData.targetDate);
          const currentDate = new Date();
          const daysUntilDeadline = Math.ceil((targetDate - currentDate) / (1000 * 60 * 60 * 24));
          const weeksUntilDeadline = Math.ceil(daysUntilDeadline / 7);
          weekIsoStrings = getNextNWeeks(currentWeekIso, Math.max(1, weeksUntilDeadline));
        }
        
        console.log(`📅 Creating ${weekIsoStrings.length} week instances for ${goalFormData.type} goal: ${goalId}`, weekIsoStrings);
        
        // Build all instances
        const instances = weekIsoStrings.map(weekIso => ({
          id: `${goalId}_${weekIso}`,
          type: goalFormData.type === 'deadline' ? 'deadline' : 'weekly_goal',
          goalType: goalFormData.type,
          title: goalFormData.title.trim(),
          description: goalFormData.description.trim(),
          dreamId: selectedDream.id,
          dreamTitle: selectedDream.title,
          dreamCategory: selectedDream.category,
          recurrence: goalFormData.type === 'consistency' ? goalFormData.recurrence : undefined,
          targetDate: goalFormData.type === 'deadline' ? goalFormData.targetDate : undefined,
          targetMonths: goalFormData.type === 'consistency' ? goalFormData.targetMonths : undefined,
          weekId: weekIso,
          completed: false,
          createdAt: new Date().toISOString()
        }));
        
        // Batch save all instances efficiently
        await addWeeklyGoalsBatch(instances);
        
        console.log(`✅ Created ${weekIsoStrings.length} instances for ${goalFormData.type} goal`);
      }
    }

    setShowGoalForm(false);
    setSelectedDream(null);
    setGoalFormData({ 
      title: '', 
      description: '',
      type: 'consistency',
      recurrence: 'weekly',
      targetWeeks: 12,
      targetMonths: 6,
      targetDate: ''
    });
    
    // FORCE RELOAD: Clear cache and reload current week to show new goal
    loadedWeeksRef.current.delete(activeIsoWeek);
    await loadWeekGoals(activeWeek);
  };
  
  // Helper to get next N weeks from a starting week
  const getNextNWeeks = (startWeek, n) => {
    const weeks = [startWeek];
    let currentDate = parseIsoWeek(startWeek);
    
    for (let i = 1; i < n; i++) {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 7); // Add 7 days
      weeks.push(getIsoWeek(currentDate));
    }
    
    return weeks;
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    const dream = currentUser.dreamBook.find(d => d.id === goal.dreamId);
    setSelectedDream(dream);
    setGoalFormData({
      title: goal.title,
      description: goal.description || '',
      type: goal.type || 'consistency',
      recurrence: goal.recurrence || 'weekly',
      targetWeeks: goal.targetWeeks || 12,
      targetMonths: goal.targetMonths || 6,
      targetDate: goal.targetDate || ''
    });
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteWeeklyGoal(goalId);
    }
  };

  const toggleGoalCompletion = async (goalId) => {
    if (!currentUser?.id || !activeWeek) return;
    
    const activeIsoWeek = getIsoWeek(activeWeek.start);
    const year = activeWeek.start.getFullYear();
    
    // Find the goal and update it
    const goalIndex = weeklyGoals.findIndex(g => g.id === goalId && g.weekId === activeIsoWeek);
    if (goalIndex === -1) return;
    
    const goal = weeklyGoals[goalIndex];
    const isMonthlyGoal = goal.recurrence === 'monthly';
    const isDeadlineGoal = goal.type === 'deadline';
    const newCompletedStatus = !goal.completed;
    const completedAtValue = newCompletedStatus ? new Date().toISOString() : null;
    
    // For monthly goals, we need to update ALL weeks in the same month
    // For deadline goals, we need to remove future weeks if completed
    let updatedWeeklyGoals = [...weeklyGoals];
    const weeksToSave = new Set();
    const weeksToDelete = new Set();
    
    if (isMonthlyGoal && goal.templateId) {
      // Get the month ID for the current week
      const currentMonthId = getMonthIdFromWeek(activeIsoWeek);
      console.log(`🗓️ Monthly goal toggle - marking all weeks in ${currentMonthId}`);
      
      // Find all instances of this template in the same month
      updatedWeeklyGoals = updatedWeeklyGoals.map(g => {
        if (g.templateId === goal.templateId && g.weekId) {
          const goalMonthId = getMonthIdFromWeek(g.weekId);
          if (goalMonthId === currentMonthId) {
            // This goal instance is in the same month - update it
            const [weekYear] = g.weekId.split('-W');
            weeksToSave.add(`${weekYear}:${g.weekId}`);
            return {
              ...g,
              completed: newCompletedStatus,
              completedAt: completedAtValue
            };
          }
        }
        return g;
      });
    } else if (isDeadlineGoal && newCompletedStatus && goal.templateId) {
      // Deadline goal completed - mark current week complete and remove future weeks
      console.log(`📅 Deadline goal completed - removing future weeks`);
      
      updatedWeeklyGoals[goalIndex] = {
        ...goal,
        completed: true,
        completedAt: completedAtValue
      };
      weeksToSave.add(`${year}:${activeIsoWeek}`);
      
      // Filter out future instances of this deadline goal
      updatedWeeklyGoals = updatedWeeklyGoals.filter(g => {
        if (g.templateId === goal.templateId && g.weekId && g.weekId !== activeIsoWeek) {
          // This is a future instance - mark week for deletion
          if (g.weekId > activeIsoWeek) {
            const [weekYear] = g.weekId.split('-W');
            weeksToDelete.add(`${weekYear}:${g.weekId}`);
            console.log(`  🗑️ Removing future instance: ${g.weekId}`);
            return false; // Remove from array
          }
        }
        return true; // Keep in array
      });
    } else {
      // Weekly goal or one-time goal - just update this specific instance
      updatedWeeklyGoals[goalIndex] = {
        ...goal,
        completed: newCompletedStatus,
        completedAt: completedAtValue
      };
      weeksToSave.add(`${year}:${activeIsoWeek}`);
    }
    
    // Update local state optimistically for instant feedback
    setWeeklyGoals(updatedWeeklyGoals);
    
    console.log(`🔄 Toggling goal ${goalId}:`, {
      isMonthlyGoal,
      isDeadlineGoal,
      weeksToSave: Array.from(weeksToSave),
      weeksToDelete: Array.from(weeksToDelete),
      newStatus: newCompletedStatus
    });
    
    try {
      // Save each affected week (with updated goals)
      for (const weekKey of weeksToSave) {
        const [weekYear, weekId] = weekKey.split(':');
        const weekGoals = updatedWeeklyGoals.filter(g => 
          g.weekId === weekId && g.type !== 'weekly_goal_template'
        );
        
        const result = await weekService.saveWeekGoals(
          currentUser.id, 
          parseInt(weekYear), 
          weekId, 
          weekGoals
        );
        
        if (!result.success) {
          console.error(`❌ Failed to save week ${weekId}:`, result.error);
          // Revert on error
          setWeeklyGoals(weeklyGoals);
          return;
        }
      }
      
      // Delete future weeks for deadline goals (with goal removed)
      for (const weekKey of weeksToDelete) {
        const [weekYear, weekId] = weekKey.split(':');
        const weekGoals = updatedWeeklyGoals.filter(g => 
          g.weekId === weekId && g.type !== 'weekly_goal_template'
        );
        
        // Save the week without the deadline goal
        const result = await weekService.saveWeekGoals(
          currentUser.id, 
          parseInt(weekYear), 
          weekId, 
          weekGoals
        );
        
        if (!result.success) {
          console.error(`❌ Failed to delete from week ${weekId}:`, result.error);
        }
        
        // Clear loaded weeks cache for deleted weeks
        loadedWeeksRef.current.delete(weekId);
      }
      
      console.log(`✅ Goal ${goalId} toggled successfully`);
      
      // Reload the active week to ensure consistency
      loadedWeeksRef.current.delete(activeIsoWeek);
      await loadWeekGoals(activeWeek);
      
    } catch (error) {
      console.error(`❌ Error toggling goal:`, error);
      // Revert on error
      setWeeklyGoals(weeklyGoals);
    }
  };

  const handleCloseForm = () => {
    setShowGoalForm(false);
    setSelectedDream(null);
    setEditingGoal(null);
    setGoalFormData({ 
      title: '', 
      description: '',
      type: 'consistency',
      recurrence: 'weekly',
      targetWeeks: 12,
      targetMonths: 6,
      targetDate: ''
    });
  };

  const activeIsoWeek = activeWeek ? getIsoWeek(activeWeek.start) : getCurrentIsoWeek();
  const currentWeekIso = getCurrentIsoWeek();
  
  // For current week, show templates + instances; for other weeks, show only instances
  const visibleGoals = (() => {
    if (activeIsoWeek === currentWeekIso) {
      // Current week: show valid active templates + current week instances
      const allTemplates = weeklyGoals.filter(g => 
        g.type === 'weekly_goal_template'
      );
      
      const milestones = currentUser?.dreamBook
        ?.flatMap(dream => dream.milestones || []) || [];
      
      const validTemplates = allTemplates.filter(template => {
        const milestone = template.milestoneId 
          ? milestones.find(m => m.id === template.milestoneId)
          : null;
        return isTemplateActiveForWeek(template, currentWeekIso, milestone);
      });
      
      const currentWeekInstances = weeklyGoals.filter(g => 
        g.weekId === currentWeekIso && g.type !== 'weekly_goal_template'
      );
      
      // For monthly goals, we MUST show instances (not templates) because each week needs
      // independent completion status. When completed in one week, all weeks in that month update.
      const weeklyTemplates = validTemplates.filter(t => t.recurrence !== 'monthly');
      const monthlyTemplateIds = new Set(
        validTemplates.filter(t => t.recurrence === 'monthly').map(t => t.id)
      );
      
      // Create a set of weekly template IDs that are being shown
      const visibleTemplateIds = new Set(weeklyTemplates.map(t => t.id));
      
      // Filter out instances that are duplicates of visible weekly templates
      // But KEEP monthly instances even if template is active
      const uniqueInstances = currentWeekInstances.filter(instance => {
        // If this is a monthly goal instance, always show it
        if (instance.recurrence === 'monthly' || monthlyTemplateIds.has(instance.templateId)) {
          return true;
        }
        // For weekly goals, filter out if template is visible
        return !instance.templateId || !visibleTemplateIds.has(instance.templateId);
      });
      
      return [...weeklyTemplates, ...uniqueInstances];
    } else {
      // Other weeks: show only instances for that week
      return weeklyGoals.filter(goal => 
        goal.weekId === activeIsoWeek && goal.type !== 'weekly_goal_template'
      );
    }
  })();
  
  const progressPercentage = getProgressPercentage();
  const isWeekComplete = isWeekEditable(activeIsoWeek) && progressPercentage === 100 && visibleGoals.length > 0;

  // Calculate goal KPIs for the active week
  const getGoalKPIs = () => {
    const weekIso = activeWeek ? getIsoWeek(activeWeek.start) : getCurrentIsoWeek();
    const weekGoals = weeklyGoals.filter(g => g.weekId === weekIso && g.type !== 'weekly_goal_template');
    const activeGoals = weekGoals.length;
    const completedGoals = weekGoals.filter(g => g.completed).length;
    const percentCompleted = activeGoals > 0 ? Math.round((completedGoals / activeGoals) * 100) : 0;
    
    // Calculate total unique weeks that have goals
    const uniqueWeeks = new Set(weeklyGoals.map(g => g.weekId)).size;
    
    return {
      activeGoals,
      percentCompleted,
      completedGoals,
      totalWeeks: uniqueWeeks
    };
  };

  const goalKPIs = getGoalKPIs();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 space-y-3 sm:space-y-4">
      {/* Enhanced Header (collapses when a week is selected) */}
      <div className={`mb-8 transition-all duration-500`}>
        {!activeWeek ? (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Calendar className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-3xl font-bold text-professional-gray-900">
                Dreams Week Ahead
              </h1>
              <HelpTooltip 
                title="Week Ahead Guide"
                content="Plan your weekly goals and track progress. Link goals to specific dreams from your Dream Book or create general goals. Check off completed goals to see your weekly progress percentage. Use the calendar to plan future weeks."
              />
            </div>
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
              <p className="text-base text-professional-gray-700 font-medium mb-1">{dailyQuote}</p>
              <p className="text-professional-gray-600">Plan your weekly goals by selecting a month and week</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Title Section */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="h-8 w-8 text-netsurit-red" />
                <h1 className="text-3xl font-bold text-professional-gray-900">Dreams Week Ahead</h1>
                <HelpTooltip 
                  title="Week Ahead Guide"
                  content="Plan your weekly goals and track progress. Link goals to specific dreams from your Dream Book or create general goals. Check off completed goals to see your weekly progress percentage. Use the calendar to plan future weeks."
                />
              </div>
              <p className="text-base text-professional-gray-700">Plan and track your weekly goals to make progress on your dreams</p>
            </div>
            
            {/* Goal KPIs - Inline */}
            <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-5">
              <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-netsurit-red" />
                </div>
                <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Active Goals</p>
                <p className="text-xl font-bold text-professional-gray-900">{goalKPIs.activeGoals}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-netsurit-coral" />
                </div>
                <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">% Completed</p>
                <p className="text-xl font-bold text-professional-gray-900">{goalKPIs.percentCompleted}%</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-6 w-6 text-netsurit-orange" />
                </div>
                <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Total Completed</p>
                <p className="text-xl font-bold text-professional-gray-900">{goalKPIs.completedGoals}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-6 w-6 text-netsurit-orange" />
                </div>
                <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Total Weeks</p>
                <p className="text-xl font-bold text-professional-gray-900">{goalKPIs.totalWeeks}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Month and Week Selector - Collapsed when week is selected */}
      <div className={`space-y-4 transition-all duration-500 ${activeWeek ? 'opacity-75 scale-95' : ''}`}>
        {/* Selected Week Summary (shown when collapsed) */}
        {activeWeek && (
          <div className="bg-professional-gray-50 rounded-2xl p-4 border border-professional-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-netsurit-red" />
                <div>
                  <span className="text-sm text-professional-gray-600">Planning for: </span>
                  <span className="font-semibold text-professional-gray-900">
                    Week {activeWeek.weekNumber} ({activeWeek.range}) - {getMonthNames()[activeMonth]} {new Date().getFullYear()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveWeek(null)}
                className="text-sm text-netsurit-red hover:text-netsurit-coral font-medium transition-colors"
              >
                Change Week
              </button>
            </div>
          </div>
        )}

        {/* Month Selector - Hidden when week is selected */}
        {!activeWeek && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-professional-gray-900 text-center">Select Month</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
              {getMonthNames().map((month, index) => (
                <MonthCard
                  key={index}
                  month={month}
                  index={index}
                  isActive={activeMonth === index}
                  isCurrent={new Date().getMonth() === index}
                  onClick={() => {
                    setActiveMonth(index);
                    setActiveWeek(null); // Reset week selection when month changes
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Week Selector - Hidden when week is selected */}
        {activeMonth !== null && !activeWeek && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-professional-gray-900 text-center">
              Select Week - {getMonthNames()[activeMonth]} {new Date().getFullYear()}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {getIsoWeeksForMonth(new Date().getFullYear(), activeMonth).map((week) => (
                <WeekCard
                  key={week.id}
                  week={week}
                  isActive={activeWeek?.id === week.id}
                  progress={getWeekProgress(week)}
                  onClick={() => setActiveWeek(week)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Content - Only show when a week is selected */}
      {activeWeek && (
        <div className="mt-6 grid grid-cols-12 gap-6 min-h-0">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-5">
            {/* Progress Tracker */}
            {visibleGoals.length > 0 && (
              <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-professional-gray-900">Weekly Progress</h3>
                  <div className="flex items-center space-x-2">
                    {isWeekComplete && (
                      <div className="animate-bounce">
                        <Sparkles className="w-6 h-6 text-netsurit-orange" />
                      </div>
                    )}
                    <span className="text-2xl font-bold text-professional-gray-900">{progressPercentage}%</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden ${
                        isWeekComplete
                          ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral animate-pulse'
                          : 'bg-gradient-to-r from-netsurit-red to-netsurit-coral'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  {isWeekComplete && (
                    <div className="absolute -top-1 right-0 text-xl animate-bounce">🎉</div>
                  )}
                </div>
                <div className="flex justify-between text-sm text-professional-gray-600 mt-2">
                  <span>{visibleGoals.filter(g => g.completed).length} completed</span>
                  <span>{visibleGoals.length} total goals</span>
                </div>
              </div>
            )}

            {/* Dreams Grid */}
            <div className="mt-4">
              {currentUser?.dreamBook?.length === 0 ? (
                <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center">
                  <Target className="w-10 h-10 text-professional-gray-300 mx-auto mb-3" />
                  <p className="text-professional-gray-600 mb-3">No dreams in your Dream Book yet!</p>
                  <p className="text-sm text-professional-gray-500">Create some dreams first to start planning weekly goals.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {currentUser?.dreamBook?.slice(0, 4).map((dream) => (
                      <DreamCard
                        key={dream.id}
                        dream={dream}
                        emoji={getDreamEmoji(dream.category)}
                        onAddGoal={() => handleAddGoal(dream)}
                      />
                    ))}
                  </div>
                  {currentUser?.dreamBook?.length > 4 && (
                    <div className="mt-3 text-right">
                      <Link to="/dream-book" className="text-netsurit-red hover:text-netsurit-coral text-sm font-medium">View All</Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-7 min-h-0">
            <h2 className="text-xl font-bold text-professional-gray-900 mb-3">This Week's Goals</h2>
            {visibleGoals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center">
                <Star className="w-10 h-10 text-professional-gray-300 mx-auto mb-3" />
                <p className="text-professional-gray-600 mb-2">No weekly goals yet!</p>
                <p className="text-sm text-professional-gray-500">Add goals from your dreams to get started.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[80vh] lg:max-h-[78vh] overflow-y-auto pr-1">
                {visibleGoals.map((goal) => {
                  const editable = isWeekEditable(activeIsoWeek);
                  return (
                    <GoalItem
                      key={goal.id}
                      goal={goal}
                      emoji={getDreamEmoji(goal.dreamCategory)}
                      onToggle={editable ? () => toggleGoalCompletion(goal.id) : undefined}
                      onEdit={editable ? () => handleEditGoal(goal) : undefined}
                      onDelete={editable ? () => handleDeleteGoal(goal.id) : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goal Form Modal */}
      {showGoalForm && (
        <GoalFormModal
          selectedDream={selectedDream}
          goalFormData={goalFormData}
          setGoalFormData={setGoalFormData}
          onSave={handleSaveGoal}
          onClose={handleCloseForm}
          isEditing={!!editingGoal}
          emoji={getDreamEmoji(selectedDream?.category)}
        />
      )}
    </div>
  );
};

// Dream Card Component
const DreamCard = ({ dream, emoji, onAddGoal }) => {
  return (
    <div className="flex-shrink-0 w-60 bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-4 hover:scale-105">
      <div className="text-center space-y-3">
        <div className="text-3xl">{emoji}</div>
        <div>
          <h3 className="font-semibold text-professional-gray-900 mb-1">{dream.title}</h3>
          <p className="text-sm text-professional-gray-600 mb-1">{dream.category}</p>
          <div className="w-full bg-professional-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-2 rounded-full transition-all duration-300"
              style={{ width: `${dream.progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-professional-gray-500">{dream.progress}% complete</p>
        </div>
        <button
          onClick={onAddGoal}
          className="w-full inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Weekly Goal</span>
        </button>
      </div>
    </div>
  );
};

// Goal Item Component
const GoalItem = ({ goal, emoji, onToggle, onEdit, onDelete }) => {
  // With week-specific instances, completed status is directly on the goal
  const isCompleted = goal.completed;
  const buttonRef = useRef(null);

  /**
   * Triggers subtle confetti animation at button position
   * @param {HTMLElement} button - The button element to position confetti
   */
  const triggerConfetti = (button) => {
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    // Subtle confetti burst
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { x, y },
      colors: ['#E5002B', '#FF6B6B', '#FFA07A', '#FFD700'],
      ticks: 100,
      gravity: 1.2,
      scalar: 0.7,
      drift: 0,
      startVelocity: 20,
    });
  };

  /**
   * Handle goal toggle with celebration animation
   */
  const handleToggleWithCelebration = () => {
    // Only celebrate when marking as complete (not when unchecking)
    if (!isCompleted) {
      triggerConfetti(buttonRef.current);
    }
    
    // Call the original toggle function
    if (onToggle) {
      onToggle();
    }
  };
  
  return (
    <div className={`rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 p-4 hover:scale-[1.02] ${
      isCompleted 
        ? 'bg-professional-gray-50 border-netsurit-red' 
        : 'bg-white border-professional-gray-200'
    }`}>
      <div className="flex items-start space-x-3">
        <button
          ref={buttonRef}
          onClick={handleToggleWithCelebration}
          className="flex-shrink-0 mt-1"
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-netsurit-red" aria-hidden="true" />
          ) : (
            <Circle className="w-6 h-6 text-professional-gray-400 hover:text-professional-gray-600" aria-hidden="true" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`font-medium ${
                isCompleted 
                  ? 'line-through text-professional-gray-600' 
                  : 'text-professional-gray-900'
              }`}>
                {goal.title}
              </h3>
              {goal.description && (
                <p className={`text-sm mt-1 ${
                  isCompleted 
                    ? 'line-through text-professional-gray-500' 
                    : 'text-professional-gray-600'
                }`}>
                  {goal.description}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                <span className="text-base">{emoji}</span>
                <span className="text-xs bg-professional-gray-100 text-professional-gray-700 px-2 py-1 rounded-full">
                  {goal.dreamTitle}
                </span>
                {goal.recurrence === 'weekly' && (
                  <span className="text-xs bg-netsurit-warm-orange/20 text-netsurit-orange px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                    <Repeat className="w-3 h-3" />
                    <span>Recurring Weekly</span>
                  </span>
                )}
                {goal.milestoneId && (
                  <span className="text-xs bg-netsurit-light-coral text-netsurit-red px-2 py-1 rounded-full font-medium">
                    ⭐ Linked to Milestone
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 ml-3">
              <button
                onClick={onEdit}
                className="p-1 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-netsurit-red hover:text-netsurit-coral hover:bg-netsurit-light-coral rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Month Card Component
const MonthCard = ({ month, index, isActive, isCurrent, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md
        ${isActive 
          ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-lg transform scale-105' 
          : 'bg-white text-professional-gray-700 hover:bg-professional-gray-50 border-2 border-professional-gray-200'
        }
        ${isCurrent && !isActive ? 'border-netsurit-red' : ''}
      `}
    >
      <div className="text-center">
        <div className="font-semibold text-sm">{month}</div>
        {isCurrent && (
          <div className={`text-xs mt-1 ${isActive ? 'text-netsurit-light-coral' : 'text-netsurit-red'}`}>
            Current
          </div>
        )}
      </div>
      {isActive && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <ChevronDown className="w-4 h-4 text-netsurit-red" />
        </div>
      )}
    </button>
  );
};

// Week Card Component
const WeekCard = ({ week, isActive, progress, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md text-left w-full
        ${isActive 
          ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-lg transform scale-105' 
          : 'bg-white text-professional-gray-700 hover:bg-professional-gray-50 border-2 border-professional-gray-200'
        }
      `}
    >
      <div className="space-y-2">
        <div>
          <div className={`text-xs font-medium uppercase tracking-wide ${isActive ? 'text-netsurit-light-coral' : 'text-professional-gray-500'}`}>
            Week {week.weekNumber}
          </div>
          <div className="font-semibold text-sm mt-1">{week.range}</div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className={isActive ? 'text-netsurit-light-coral' : 'text-professional-gray-500'}>Progress</span>
            <span className={`font-medium ${isActive ? 'text-white' : 'text-professional-gray-700'}`}>
              {progress}%
            </span>
          </div>
          <div className={`w-full rounded-full h-1.5 ${isActive ? 'bg-netsurit-coral/50' : 'bg-professional-gray-200'}`}>
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-white' 
                  : progress === 100 
                    ? 'bg-netsurit-red' 
                    : 'bg-gradient-to-r from-netsurit-red to-netsurit-coral'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {isActive && (
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
          <ChevronRight className="w-4 h-4 text-netsurit-red" />
        </div>
      )}
    </button>
  );
};

// Goal Form Modal Component
const GoalFormModal = ({ 
  selectedDream, 
  goalFormData, 
  setGoalFormData, 
  onSave, 
  onClose, 
  isEditing,
  emoji 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50 rounded-t-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{emoji}</div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-professional-gray-900">
                  {isEditing ? 'Edit Weekly Goal' : 'Add Weekly Goal'}
                </h3>
                <p className="text-sm text-professional-gray-600">{selectedDream?.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>
        <div className="p-4 sm:p-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                Goal Title *
              </label>
              <input
                type="text"
                value={goalFormData.title}
                onChange={(e) => setGoalFormData({ ...goalFormData, title: e.target.value })}
                placeholder="What do you want to accomplish this week?"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={goalFormData.description}
                onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
                placeholder="Add more details about your weekly goal..."
                className="input-field h-20 resize-none"
              />
            </div>

            {/* Goal Type */}
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                Goal Type <span className="text-netsurit-red">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGoalFormData({ ...goalFormData, type: 'consistency' })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    goalFormData.type === 'consistency'
                      ? 'bg-netsurit-red text-white shadow-md'
                      : 'bg-white border border-professional-gray-300 text-professional-gray-700 hover:border-netsurit-red'
                  }`}
                >
                  <Repeat className="w-4 h-4 mx-auto mb-1" />
                  Consistency
                </button>
                <button
                  type="button"
                  onClick={() => setGoalFormData({ ...goalFormData, type: 'deadline' })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    goalFormData.type === 'deadline'
                      ? 'bg-netsurit-red text-white shadow-md'
                      : 'bg-white border border-professional-gray-300 text-professional-gray-700 hover:border-netsurit-red'
                  }`}
                >
                  <Calendar className="w-4 h-4 mx-auto mb-1" />
                  Deadline
                </button>
              </div>
              <p className="text-xs text-professional-gray-500 mt-1">
                {goalFormData.type === 'consistency' && 'Track this goal weekly or monthly over time'}
                {goalFormData.type === 'deadline' && 'Complete this goal by a specific date'}
              </p>
            </div>

            {/* Consistency Options */}
            {goalFormData.type === 'consistency' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-professional-gray-700 mb-1">
                      How often?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGoalFormData({ ...goalFormData, recurrence: 'weekly' })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          goalFormData.recurrence === 'weekly'
                            ? 'bg-professional-gray-700 text-white shadow-md'
                            : 'bg-white border border-professional-gray-300 text-professional-gray-700 hover:border-professional-gray-500'
                        }`}
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalFormData({ ...goalFormData, recurrence: 'monthly' })}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          goalFormData.recurrence === 'monthly'
                            ? 'bg-professional-gray-700 text-white shadow-md'
                            : 'bg-white border border-professional-gray-300 text-professional-gray-700 hover:border-professional-gray-500'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-professional-gray-700 mb-1">
                      {goalFormData.recurrence === 'monthly' ? 'Duration (months)' : 'Track for how many weeks?'}
                    </label>
                    <input
                      type="number"
                      value={goalFormData.recurrence === 'monthly' ? goalFormData.targetMonths : goalFormData.targetWeeks}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setGoalFormData({
                          ...goalFormData,
                          ...(goalFormData.recurrence === 'monthly' 
                            ? { targetMonths: value }
                            : { targetWeeks: value }
                          )
                        });
                      }}
                      min="1"
                      max={goalFormData.recurrence === 'monthly' ? 24 : 52}
                      className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-professional-gray-500">
                  {goalFormData.recurrence === 'weekly' && 'Goal will show up every week for the duration'}
                  {goalFormData.recurrence === 'monthly' && 'Goal will show every week; completing it marks the entire month'}
                </p>
              </div>
            )}

            {/* Deadline Options */}
            {goalFormData.type === 'deadline' && (
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                  Target Date <span className="text-netsurit-red">*</span>
                </label>
                <input
                  type="date"
                  value={goalFormData.targetDate}
                  onChange={(e) => setGoalFormData({ ...goalFormData, targetDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
                  required={goalFormData.type === 'deadline'}
                />
                <p className="text-xs text-professional-gray-500 mt-1">
                  Goal will appear each week until this date
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-3">
              <button
                type="submit"
                disabled={!goalFormData.title.trim() || (goalFormData.type === 'deadline' && !goalFormData.targetDate)}
                className="flex-1 inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Update Goal' : 'Add Goal'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-professional-gray-200 text-professional-gray-700 border border-professional-gray-300 rounded-lg hover:bg-professional-gray-300 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DreamsWeekAhead;