import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Trophy, Calendar, CheckCircle2, Circle, Clock, Plus, X, HelpCircle, Sparkles, Repeat } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DreamTrackerModal from '../components/DreamTrackerModal';
import { getCurrentIsoWeek } from '../utils/dateUtils';
import weekService from '../services/weekService';
import GuideModal from '../components/GuideModal';
import { isTemplateActiveForWeek } from '../utils/templateValidation';

const Dashboard = () => {
  const { currentUser, weeklyGoals, toggleWeeklyGoal, addWeeklyGoal, updateDream } = useApp();
  const navigate = useNavigate();
  
  // Ensure weeklyGoals is always an array to prevent filter errors
  const safeWeeklyGoals = Array.isArray(weeklyGoals) ? weeklyGoals : [];
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    dreamId: '',
    recurrence: 'weekly',
    targetWeeks: 12,
    targetMonths: 6
  });
  const [selectedDream, setSelectedDream] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [currentWeekGoals, setCurrentWeekGoals] = useState([]);
  const [isLoadingWeekGoals, setIsLoadingWeekGoals] = useState(true);

  // Load current week's goals from weeks container
  useEffect(() => {
    const loadCurrentWeekGoals = async () => {
      if (!currentUser?.id) return;
      
      setIsLoadingWeekGoals(true);
      const currentWeekIso = getCurrentIsoWeek();
      const currentYear = new Date().getFullYear();
      
      try {
        console.log('📅 Dashboard: Loading current week goals for', currentWeekIso);
        const weekDocResult = await weekService.getWeekGoals(currentUser.id, currentYear);
        
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
    };
    
    loadCurrentWeekGoals();
  }, [currentUser?.id]);

  // Refresh goals when a goal is toggled
  const handleToggleGoal = async (goalId) => {
    const goal = currentWeekGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    // Update locally first for instant feedback
    const updatedGoals = currentWeekGoals.map(g => 
      g.id === goalId 
        ? { ...g, completed: !g.completed, completedAt: !g.completed ? new Date().toISOString() : null }
        : g
    );
    setCurrentWeekGoals(updatedGoals);
    
    // Save to backend
    const currentWeekIso = getCurrentIsoWeek();
    const currentYear = new Date().getFullYear();
    
    try {
      await weekService.saveWeekGoals(currentUser.id, currentYear, currentWeekIso, updatedGoals);
      console.log('✅ Goal toggled:', goalId);
    } catch (error) {
      console.error('❌ Failed to toggle goal:', error);
      // Revert on error
      setCurrentWeekGoals(currentWeekGoals);
    }
  };
  
  const stats = {
    dreamsCreated: currentUser.dreamBook.length,
    connectsCompleted: currentUser.connects.length,
    scorecardPoints: currentUser.score
  };

  // Auto-create current week instances from templates on mount
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
          title: template.title,
          description: template.description,
          dreamId: template.dreamId,
          dreamTitle: template.dreamTitle,
          dreamCategory: template.dreamCategory,
          milestoneId: template.milestoneId,
          weekId: currentWeekIso,
          completed: false,
          createdAt: new Date().toISOString()
        };
        addWeeklyGoal(instance);
      }
    });
  }, [currentUser?.id, safeWeeklyGoals.length]);

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

  // Calculate weekly progress for current week only
  const weeklyProgress = currentWeekGoals.length > 0 
    ? Math.round((currentWeekGoals.filter(goal => goal.completed).length / currentWeekGoals.length) * 100)
    : 0;

  // Handle adding new goal
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (newGoal.title.trim()) {
      // Convert dreamId to number for comparison (select returns string)
      const dreamId = newGoal.dreamId ? parseInt(newGoal.dreamId, 10) : null;
      const selectedDream = currentUser.dreamBook.find(dream => dream.id === dreamId);
      
      const currentWeekIso = getCurrentIsoWeek();
      const templateId = `template_${Date.now()}`;
      
      // Create template for recurring goals (weekly/monthly)
      const template = {
        id: templateId,
        type: 'weekly_goal_template',
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        dreamId: dreamId,
        dreamTitle: selectedDream?.title || '',
        dreamCategory: selectedDream?.category || '',
        recurrence: newGoal.recurrence,
        active: true,
        durationType: 'unlimited',
        targetWeeks: newGoal.recurrence === 'weekly' ? newGoal.targetWeeks : undefined,
        targetMonths: newGoal.recurrence === 'monthly' ? newGoal.targetMonths : undefined,
        startDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      // Save template
      addWeeklyGoal(template);
      
      // Create instance for current week
      const instance = {
        id: `${templateId}_${currentWeekIso}`,
        type: 'weekly_goal',
        templateId: templateId,
        title: template.title,
        description: template.description,
        dreamId: template.dreamId,
        dreamTitle: template.dreamTitle,
        dreamCategory: template.dreamCategory,
        recurrence: template.recurrence,
        weekId: currentWeekIso,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      addWeeklyGoal(instance);
      
      // Reset form
      setNewGoal({ 
        title: '', 
        description: '', 
        dreamId: '',
        recurrence: 'weekly',
        targetWeeks: 12,
        targetMonths: 6
      });
      setShowAddGoal(false);
      
      // Reload current week goals to show the new goal
      window.location.reload();
    }
  };

  const handleCancelAddGoal = () => {
    setNewGoal({ 
      title: '', 
      description: '', 
      dreamId: '',
      recurrence: 'weekly',
      targetWeeks: 12,
      targetMonths: 6
    });
    setShowAddGoal(false);
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4 sm:space-y-5">
      {/* Enhanced Header with Stats */}
      <div className="mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Welcome back, {currentUser.name.split(' ')[0]}! ✨
              </h1>
              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold text-netsurit-red hover:text-white bg-white hover:bg-netsurit-red border-2 border-netsurit-red rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                aria-label="View DreamSpace guide"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Guide</span>
              </button>
            </div>
            <p className="text-base text-gray-700 font-medium">Ready to make progress on your dreams today?</p>
          </div>
          
          {/* Stats Cards */}
           <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-5">
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-netsurit-red" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Dreams</p>
              <p className="text-xl font-bold text-professional-gray-900">{stats.dreamsCreated}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-netsurit-coral" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Connects</p>
              <p className="text-xl font-bold text-professional-gray-900">{stats.connectsCompleted}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-netsurit-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Points</p>
              <p className="text-xl font-bold text-professional-gray-900">{stats.scorecardPoints}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vision Builder Demo CTA - NEW */}
      <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral rounded-2xl p-6 shadow-xl mb-5">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-white">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-6 w-6" />
              <h3 className="text-xl font-bold">Build Your Best Year</h3>
            </div>
            <p className="text-white/90">Try our AI-guided chat to create Dreams, Milestones, and Weekly Goals in minutes</p>
          </div>
          <button
            onClick={() => navigate('/vision-builder-demo')}
            className="bg-white text-netsurit-red px-6 py-3 rounded-xl font-bold hover:bg-professional-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
          >
            <span>Try Demo</span>
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content Grid - Enhanced responsive layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
        {/* Left Column - Current Week Goals */}
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-professional-gray-200 flex-shrink-0 bg-professional-gray-50">
            <h2 className="text-xl sm:text-2xl font-bold text-professional-gray-900">This Week's Goals</h2>
            <Link 
              to="/dreams-week-ahead"
              className="text-sm bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange font-semibold focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Manage Goals
            </Link>
          </div>
          
          {/* Week Progress Header */}
           <div className="p-4 sm:p-5 bg-professional-gray-50 border-b border-professional-gray-200 flex-shrink-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg shadow-md">
                    <Calendar className="w-5 h-5 text-netsurit-red" />
                  </div>
                  <span className="text-lg font-bold text-professional-gray-800">{getCurrentWeekRange()}</span>
                </div>
                <div className="bg-white px-3 py-2 rounded-lg shadow-md">
                  <span className="text-2xl font-bold text-netsurit-red">{weeklyProgress}%</span>
                </div>
              </div>
              <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                <div
                  className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
                  style={{ width: `${weeklyProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <span className="text-base font-bold text-professional-gray-800">
                  {currentWeekGoals.filter(g => g.completed).length} of {currentWeekGoals.length} goals completed
                  {weeklyProgress === 100 && <span className="ml-2 text-xl">🎉</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Goals List */}
           <div className="flex-1 p-4 sm:p-5 overflow-hidden">
            {currentWeekGoals.length === 0 && !showAddGoal ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="p-4 bg-professional-gray-100 rounded-full w-fit mx-auto mb-4 shadow-lg">
                    <Clock className="w-12 h-12 text-professional-gray-500" />
                  </div>
                  <p className="text-xl font-bold text-professional-gray-800 mb-2">No weekly goals yet!</p>
                  <p className="text-professional-gray-600 mb-6 max-w-sm mx-auto text-base">Start planning your week to make progress on your dreams.</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setShowAddGoal(true)}
                      className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-2xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-xl hover:shadow-2xl font-bold text-lg transform hover:scale-105"
                    >
                      <Plus className="w-6 h-6 mr-2" />
                      Add Goal Here
                    </button>
                    <Link 
                      to="/dreams-week-ahead"
                      className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white rounded-2xl hover:from-professional-gray-700 hover:to-professional-gray-800 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-xl hover:shadow-2xl font-bold text-lg transform hover:scale-105"
                    >
                      Manage Goals →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
               <div className="h-full flex flex-col space-y-6 overflow-hidden">
                {/* Add Goal Form */}
                {showAddGoal && (
                  <form onSubmit={handleAddGoal} className="p-6 rounded-2xl border-2 border-professional-gray-200 bg-professional-gray-50 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold text-professional-gray-800">Add New Goal</h4>
                      <button
                        type="button"
                        onClick={handleCancelAddGoal}
                        className="text-professional-gray-400 hover:text-professional-gray-600 p-2 rounded-full hover:bg-white/50 transition-all"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      placeholder="Goal title..."
                      className="w-full px-4 py-3 border border-professional-gray-300 rounded-xl focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-lg font-medium"
                      required
                    />
                    <textarea
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      placeholder="Description (optional)..."
                      className="w-full px-4 py-3 border border-professional-gray-300 rounded-xl focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red resize-none bg-white shadow-sm"
                      rows="3"
                    />
                    <select
                      value={newGoal.dreamId}
                      onChange={(e) => setNewGoal({ ...newGoal, dreamId: e.target.value })}
                      className="w-full px-4 py-3 border border-professional-gray-300 rounded-xl focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm font-medium"
                    >
                      <option value="">Select a dream (optional)</option>
                      {currentUser.dreamBook.map((dream) => (
                        <option key={dream.id} value={dream.id}>
                          {dream.title}
                        </option>
                      ))}
                    </select>
                    
                    {/* Consistency Picker */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-professional-gray-700">How often?</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewGoal({ ...newGoal, recurrence: 'weekly' })}
                          className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            newGoal.recurrence === 'weekly'
                              ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                              : 'bg-white text-professional-gray-700 hover:bg-professional-gray-50 hover:shadow-sm border-2 border-professional-gray-300'
                          }`}
                        >
                          <Repeat className="w-4 h-4 mr-1.5" />
                          <span>Weekly</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewGoal({ ...newGoal, recurrence: 'monthly' })}
                          className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            newGoal.recurrence === 'monthly'
                              ? 'bg-gradient-to-br from-netsurit-red to-netsurit-coral text-white shadow-md ring-2 ring-netsurit-red ring-offset-1'
                              : 'bg-white text-professional-gray-700 hover:bg-professional-gray-50 hover:shadow-sm border-2 border-professional-gray-300'
                          }`}
                        >
                          <Calendar className="w-4 h-4 mr-1.5" />
                          <span>Monthly</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Duration Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-professional-gray-700">
                        {newGoal.recurrence === 'monthly' ? 'Track for how many months?' : 'Track for how many weeks?'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={newGoal.recurrence === 'monthly' ? 24 : 52}
                        value={newGoal.recurrence === 'monthly' ? newGoal.targetMonths : newGoal.targetWeeks}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || (newGoal.recurrence === 'monthly' ? 6 : 12);
                          setNewGoal({ 
                            ...newGoal, 
                            ...(newGoal.recurrence === 'monthly' 
                              ? { targetMonths: value }
                              : { targetWeeks: value })
                          });
                        }}
                        className="w-32 px-4 py-3 border border-professional-gray-300 rounded-xl focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white shadow-sm text-lg font-semibold"
                      />
                      <p className="text-xs text-professional-gray-500">
                        {newGoal.recurrence === 'monthly' ? 'Default: 6 months' : 'Default: 12 weeks'}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Add Goal
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelAddGoal}
                        className="px-6 py-3 bg-professional-gray-200 text-professional-gray-700 rounded-xl hover:bg-professional-gray-300 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Goals List */}
                <div className="flex-1 space-y-5 overflow-y-auto pr-2">
                  {currentWeekGoals.map((goal) => (
                    <div key={goal.id} className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
                      goal.completed 
                        ? 'bg-professional-gray-50 border-professional-gray-300 shadow-md' 
                        : 'bg-white border-professional-gray-200 hover:border-professional-gray-300 shadow-md'
                    }`}>
                      <div className="flex items-start space-x-5">
                        <button
                          onClick={() => handleToggleGoal(goal.id)}
                          className="flex-shrink-0 mt-1 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 rounded-full p-2 transition-all duration-200 hover:scale-110"
                          aria-label={goal.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {goal.completed ? (
                            <CheckCircle2 className="w-8 h-8 text-professional-gray-600 drop-shadow-sm" />
                          ) : (
                            <Circle className="w-8 h-8 text-professional-gray-400 hover:text-netsurit-red" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-lg font-bold mb-2 ${
                            goal.completed ? 'line-through text-professional-gray-600' : 'text-professional-gray-800'
                          }`}>
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className={`text-base mt-2 leading-relaxed ${
                              goal.completed ? 'line-through text-professional-gray-500' : 'text-professional-gray-600'
                            }`}>
                              {goal.description}
                            </p>
                          )}
                          {goal.dreamTitle && (
                            <div className={`mt-3 px-3 py-1 rounded-full text-sm font-semibold w-fit ${
                              goal.completed 
                                ? 'bg-professional-gray-200 text-professional-gray-700' 
                                : 'bg-professional-gray-100 text-professional-gray-700'
                            }`}>
                              {goal.dreamTitle}
                            </div>
                          )}
                          {goal.goalTitle && !goal.dreamTitle && (
                            <div className={`mt-3 px-3 py-1 rounded-full text-sm font-semibold w-fit ${
                              goal.completed 
                                ? 'bg-netsurit-light-coral/20 text-netsurit-red/70' 
                                : 'bg-netsurit-light-coral/30 text-netsurit-red'
                            }`}>
                              📌 {goal.goalTitle}
                            </div>
                          )}
                          {!goal.dreamTitle && !goal.goalTitle && (
                            <div className={`mt-3 px-3 py-1 rounded-full text-sm font-semibold w-fit ${
                              goal.completed 
                                ? 'bg-netsurit-light-coral/20 text-netsurit-red/70' 
                                : 'bg-netsurit-light-coral/30 text-netsurit-red'
                            }`}>
                              ⭐ General Goal
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Goal Button (when goals exist) */}
                  {currentWeekGoals.length > 0 && !showAddGoal && (
                    <button
                      onClick={() => setShowAddGoal(true)}
                      className="w-full p-8 rounded-2xl border-3 border-dashed border-professional-gray-300 hover:border-netsurit-red hover:bg-professional-gray-50 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-300 text-center group hover:shadow-lg transform hover:scale-[1.02]"
                      aria-label="Add new weekly goal"
                    >
                      <Plus className="w-10 h-10 text-professional-gray-400 group-hover:text-netsurit-red mx-auto mb-3 transition-all duration-200 transform group-hover:scale-110" />
                      <p className="text-professional-gray-600 group-hover:text-netsurit-red font-bold text-lg transition-colors">Add New Goal</p>
                      <p className="text-professional-gray-500 group-hover:text-netsurit-coral text-sm mt-1 transition-colors">Keep building momentum</p>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Your Dreams */}
        <div className="bg-white rounded-3xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-professional-gray-200 flex-shrink-0 bg-professional-gray-50">
            <h2 className="text-2xl sm:text-3xl font-bold text-professional-gray-900">Your Dreams</h2>
            <Link 
              to="/dream-book"
              className="text-sm bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange font-semibold focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Manage Dream Book
            </Link>
          </div>
          
          {/* Dreams List */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto min-h-0 scrollbar-clean">
            <div className="space-y-6 pb-8">
              {currentUser.dreamBook.map((dream) => (
                <div
                  key={dream.id}
                  onClick={() => setSelectedDream(dream)}
                  className="p-6 rounded-2xl border-2 border-professional-gray-200 bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:border-professional-gray-300 cursor-pointer shadow-md"
                >
                  <div className="space-y-5">
                    <div className="flex items-start space-x-5">
                      <img
                        src={dream.image}
                        alt={dream.title}
                        className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-lg border-2 border-professional-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-professional-gray-800 mb-2">
                          {dream.title}
                        </h3>
                        <div className="bg-professional-gray-100 text-professional-gray-700 px-3 py-1 rounded-full text-sm font-semibold w-fit mb-3">
                          {dream.category}
                        </div>
                        <div className="flex items-center justify-between text-base font-bold text-professional-gray-700 mb-3">
                          <span>Progress</span>
                          <span className="text-lg text-netsurit-red">{dream.progress}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-professional-gray-200 rounded-full h-4 shadow-inner border border-professional-gray-300">
                      <div
                        className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-4 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
                        style={{ width: `${dream.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Dream Button */}
              <Link
                to="/dream-book"
                className="block p-8 rounded-2xl border-3 border-dashed border-professional-gray-300 hover:border-netsurit-red hover:bg-professional-gray-50 focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-300 text-center group shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                aria-label="Add new dream to your dream book"
              >
                <Plus className="w-12 h-12 text-professional-gray-400 group-hover:text-netsurit-red mx-auto mb-3 transition-all duration-200 transform group-hover:scale-110" />
                <p className="text-professional-gray-600 group-hover:text-netsurit-red font-bold text-lg mb-1">Add New Dream</p>
                <p className="text-professional-gray-500 group-hover:text-netsurit-coral text-sm transition-colors">Start pursuing a new goal</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {selectedDream && (
        <DreamTrackerModal
          dream={selectedDream}
          onClose={() => setSelectedDream(null)}
          onUpdate={(updatedDream) => {
            updateDream(updatedDream);
            setSelectedDream(updatedDream);
          }}
        />
      )}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
};

export default Dashboard;