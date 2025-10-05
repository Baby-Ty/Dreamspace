import React, { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DreamsWeekAhead = () => {
  const { currentUser, weeklyGoals, addWeeklyGoal, updateWeeklyGoal, deleteWeeklyGoal, toggleWeeklyGoal } = useApp();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedDream, setSelectedDream] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalFormData, setGoalFormData] = useState({
    title: '',
    description: ''
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

  useEffect(() => {
    // Automatically set the current week as active when component loads
    const currentWeek = getCurrentWeek();
    if (currentWeek) {
      setActiveWeek(currentWeek);
    }
  }, []);

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

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (weeklyGoals.length === 0) return 0;
    const completedGoals = weeklyGoals.filter(goal => goal.completed).length;
    return Math.round((completedGoals / weeklyGoals.length) * 100);
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

  const getFourWeeksForMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Divide days roughly equally across 4 weeks
    const baseDaysPerWeek = Math.floor(totalDays / 4);
    const remainderDays = totalDays % 4;
    
    const weeks = [];
    let currentDay = 1;
    
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      let daysInThisWeek = baseDaysPerWeek;
      
      // Distribute remainder days to Week 1 and Week 4
      if (weekNum === 1 && remainderDays >= 2) {
        daysInThisWeek += Math.floor(remainderDays / 2);
      } else if (weekNum === 4) {
        daysInThisWeek += remainderDays - (remainderDays >= 2 ? Math.floor(remainderDays / 2) : 0);
      } else if (weekNum === 2 && remainderDays === 1) {
        daysInThisWeek += 1;
      }
      
      const startDate = new Date(year, month, currentDay);
      const endDate = new Date(year, month, Math.min(currentDay + daysInThisWeek - 1, totalDays));
      
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      };
      
      weeks.push({
        id: `${year}-${month}-week-${weekNum}`,
        weekNumber: weekNum,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        range: `${formatDate(startDate)} – ${formatDate(endDate)}`,
        start: new Date(startDate),
        end: new Date(endDate)
      });
      
      currentDay += daysInThisWeek;
    }
    
    return weeks;
  };

  const getWeekProgress = (week) => {
    // Mock progress for demo - in real app, this would filter goals by week
    const progressOptions = [0, 25, 50, 75, 100];
    return progressOptions[week.weekNumber % progressOptions.length];
  };

  // Find which week contains today's date
  const getCurrentWeek = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDate = today.getDate();
    
    const weeks = getFourWeeksForMonth(currentYear, currentMonth);
    
    for (const week of weeks) {
      if (currentDate >= week.start.getDate() && currentDate <= week.end.getDate()) {
        return week;
      }
    }
    
    return null;
  };

  const handleAddGoal = (dream) => {
    setSelectedDream(dream);
    setShowGoalForm(true);
    setGoalFormData({ title: '', description: '' });
  };

  const handleSaveGoal = () => {
    if (!goalFormData.title.trim()) return;

    const newGoal = {
      id: Date.now(),
      title: goalFormData.title.trim(),
      description: goalFormData.description.trim(),
      dreamId: selectedDream.id,
      dreamTitle: selectedDream.title,
      dreamCategory: selectedDream.category,
      completed: false,
      createdAt: new Date().toISOString()
    };

    if (editingGoal) {
      updateWeeklyGoal({ ...newGoal, id: editingGoal.id });
      setEditingGoal(null);
    } else {
      addWeeklyGoal(newGoal);
    }

    setShowGoalForm(false);
    setSelectedDream(null);
    setGoalFormData({ title: '', description: '' });
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setSelectedDream(currentUser.dreamBook.find(d => d.id === goal.dreamId));
    setGoalFormData({
      title: goal.title,
      description: goal.description
    });
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteWeeklyGoal(goalId);
    }
  };

  const toggleGoalCompletion = (goalId) => {
    toggleWeeklyGoal(goalId);
  };

  const handleCloseForm = () => {
    setShowGoalForm(false);
    setSelectedDream(null);
    setEditingGoal(null);
    setGoalFormData({ title: '', description: '' });
  };

  const progressPercentage = getProgressPercentage();
  const isWeekComplete = progressPercentage === 100 && weeklyGoals.length > 0;

  // Calculate goal KPIs
  const getGoalKPIs = () => {
    const activeGoals = weeklyGoals.length;
    const completedGoals = weeklyGoals.filter(goal => goal.completed).length;
    const percentCompleted = activeGoals > 0 ? Math.round((completedGoals / activeGoals) * 100) : 0;
    
    // Calculate total weeks (mock data - in real app, would track historical weeks)
    // For now, we'll use the current week number of the year
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
    const totalWeeks = Math.ceil(dayOfYear / 7);
    
    return {
      activeGoals,
      percentCompleted,
      completedGoals,
      totalWeeks
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
                  <Clock className="h-6 w-6 text-blue-600" />
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
              {getFourWeeksForMonth(new Date().getFullYear(), activeMonth).map((week) => (
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
            {weeklyGoals.length > 0 && (
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
                  <span>{weeklyGoals.filter((g) => g.completed).length} completed</span>
                  <span>{weeklyGoals.length} total goals</span>
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
            {weeklyGoals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center">
                <Star className="w-10 h-10 text-professional-gray-300 mx-auto mb-3" />
                <p className="text-professional-gray-600 mb-2">No weekly goals yet!</p>
                <p className="text-sm text-professional-gray-500">Add goals from your dreams to get started.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[80vh] lg:max-h-[78vh] overflow-y-auto pr-1">
                {weeklyGoals.map((goal) => (
                  <GoalItem
                    key={goal.id}
                    goal={goal}
                    emoji={getDreamEmoji(goal.dreamCategory)}
                    onToggle={() => toggleGoalCompletion(goal.id)}
                    onEdit={() => handleEditGoal(goal)}
                    onDelete={() => handleDeleteGoal(goal.id)}
                  />
                ))}
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
  return (
    <div className={`rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 p-4 hover:scale-[1.02] ${
      goal.completed 
        ? 'bg-professional-gray-50 border-netsurit-red' 
        : 'bg-white border-professional-gray-200'
    }`}>
      <div className="flex items-start space-x-3">
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-1"
        >
          {goal.completed ? (
            <CheckCircle2 className="w-6 h-6 text-netsurit-red" />
          ) : (
            <Circle className="w-6 h-6 text-professional-gray-400 hover:text-professional-gray-600" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`font-medium ${
                goal.completed 
                  ? 'line-through text-professional-gray-600' 
                  : 'text-professional-gray-900'
              }`}>
                {goal.title}
              </h3>
              {goal.description && (
                <p className={`text-sm mt-1 ${
                  goal.completed 
                    ? 'line-through text-professional-gray-500' 
                    : 'text-professional-gray-600'
                }`}>
                  {goal.description}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-base">{emoji}</span>
                <span className="text-xs bg-professional-gray-100 text-professional-gray-700 px-2 py-1 rounded-full">
                  {goal.dreamTitle}
                </span>
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
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

            <div className="flex space-x-3 pt-3">
              <button
                type="submit"
                disabled={!goalFormData.title.trim()}
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