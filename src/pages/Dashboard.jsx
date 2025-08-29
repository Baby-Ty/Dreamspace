import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Trophy, Calendar, CheckCircle2, Circle, Clock, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DreamTrackerModal from '../components/DreamTrackerModal';

const Dashboard = () => {
  const { currentUser, weeklyGoals, toggleWeeklyGoal, addWeeklyGoal, updateDream } = useApp();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    dreamId: ''
  });
  const [selectedDream, setSelectedDream] = useState(null);
  
  const stats = {
    dreamsCreated: currentUser.dreamBook.length,
    connectsCompleted: currentUser.connects.length,
    scorecardPoints: currentUser.score
  };

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

  // Calculate weekly progress
  const weeklyProgress = weeklyGoals.length > 0 
    ? Math.round((weeklyGoals.filter(goal => goal.completed).length / weeklyGoals.length) * 100)
    : 0;

  // Handle adding new goal
  const handleAddGoal = (e) => {
    e.preventDefault();
    if (newGoal.title.trim()) {
      const selectedDream = currentUser.dreamBook.find(dream => dream.id === newGoal.dreamId);
      addWeeklyGoal({
        title: newGoal.title,
        description: newGoal.description,
        dreamId: newGoal.dreamId,
        dreamTitle: selectedDream ? selectedDream.title : 'General Goal'
      });
      setNewGoal({ title: '', description: '', dreamId: '' });
      setShowAddGoal(false);
    }
  };

  const handleCancelAddGoal = () => {
    setNewGoal({ title: '', description: '', dreamId: '' });
    setShowAddGoal(false);
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-r from-purple-100 via-blue-50 to-pink-100 rounded-xl px-3 py-2 shadow-sm border border-white/50 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-1">
              Welcome back, {currentUser.name.split(' ')[0]}! ✨
            </h1>
            <p className="text-xs text-gray-500">Ready to make progress on your dreams today?</p>
          </div>
          
          {/* Enhanced Stats Cards */}
           <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/60 min-w-[100px]">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.dreamsCreated}</span>
                <p className="text-sm font-medium text-gray-600">Dreams</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/60 min-w-[100px]">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.connectsCompleted}</span>
                <p className="text-sm font-medium text-gray-600">Connects</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/60 min-w-[100px]">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-pink-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{stats.scorecardPoints}</span>
                <p className="text-sm font-medium text-gray-600">Points</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Enhanced responsive layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column - Current Week Goals */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">This Week's Goals</h2>
            <Link 
              to="/dreams-week-ahead"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              Manage Goals
            </Link>
          </div>
          
          {/* Week Progress Header */}
           <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 flex-shrink-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-medium text-gray-900">{getCurrentWeekRange()}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{weeklyProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${weeklyProgress}%` }}
                ></div>
              </div>
              <div className="text-gray-700 font-medium">
                {weeklyGoals.filter(g => g.completed).length} of {weeklyGoals.length} goals completed
                {weeklyProgress === 100 && <span className="ml-2">🎉</span>}
              </div>
            </div>
          </div>

          {/* Weekly Goals List */}
           <div className="flex-1 p-4 sm:p-6 overflow-hidden">
            {weeklyGoals.length === 0 && !showAddGoal ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                    <Clock className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-xl font-semibold text-gray-700 mb-2">No weekly goals yet!</p>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">Start planning your week to make progress on your dreams.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setShowAddGoal(true)}
                      className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Goal Here
                    </button>
                    <Link 
                      to="/dreams-week-ahead"
                      className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                    >
                      Manage Goals →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
               <div className="h-full flex flex-col space-y-4 overflow-hidden">
                {/* Add Goal Form */}
                {showAddGoal && (
                  <form onSubmit={handleAddGoal} className="p-4 rounded-xl border border-blue-200 bg-blue-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Add New Goal</h4>
                      <button
                        type="button"
                        onClick={handleCancelAddGoal}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      placeholder="Goal title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <textarea
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      placeholder="Description (optional)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="2"
                    />
                    <select
                      value={newGoal.dreamId}
                      onChange={(e) => setNewGoal({ ...newGoal, dreamId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a dream (optional)</option>
                      {currentUser.dreamBook.map((dream) => (
                        <option key={dream.id} value={dream.id}>
                          {dream.title}
                        </option>
                      ))}
                    </select>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Goal
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelAddGoal}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Goals List */}
                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                  {weeklyGoals.map((goal) => (
                    <div key={goal.id} className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                      goal.completed ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}>
                      <div className="flex items-start space-x-4">
                        <button
                          onClick={() => toggleWeeklyGoal(goal.id)}
                          className="flex-shrink-0 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
                          aria-label={goal.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {goal.completed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium ${
                            goal.completed ? 'line-through text-green-800' : 'text-gray-900'
                          }`}>
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className={`text-sm mt-1 ${
                              goal.completed ? 'line-through text-green-600' : 'text-gray-600'
                            }`}>
                              {goal.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">{goal.dreamTitle}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Goal Button (when goals exist) */}
                  {weeklyGoals.length > 0 && !showAddGoal && (
                    <button
                      onClick={() => setShowAddGoal(true)}
                      className="w-full p-5 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 text-center group hover:shadow-md"
                      aria-label="Add new weekly goal"
                    >
                      <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
                      <p className="text-gray-600 group-hover:text-blue-600 font-medium transition-colors">Add New Goal</p>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Your Dreams */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Dreams</h2>
            <Link 
              to="/dream-book"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              Manage Dream Book
            </Link>
          </div>
          
          {/* Dreams List */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0 scrollbar-clean">
            <div className="space-y-4 pb-8">
              {currentUser.dreamBook.map((dream) => (
                <div
                  key={dream.id}
                  onClick={() => setSelectedDream(dream)}
                  className="p-5 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 hover:border-gray-300 cursor-pointer"
                >
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={dream.image}
                        alt={dream.title}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">
                          {dream.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">{dream.category}</p>
                        <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                          <span>Progress</span>
                          <span>{dream.progress}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                        style={{ width: `${dream.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Dream Button */}
              <Link
                to="/dream-book"
                className="block p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 text-center group"
                aria-label="Add new dream to your dream book"
              >
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600 group-hover:text-blue-600 font-medium">Add New Dream</p>
                <p className="text-sm text-gray-500 group-hover:text-blue-500">Start pursuing a new goal</p>
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
    </div>
  );
};

export default Dashboard;