import React, { useState } from 'react';
import { Trophy, Target, Users, BookOpen, Calendar, TrendingUp, Medal, Star, BarChart3, PieChart, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Scorecard = () => {
  const { currentUser, scoringRules, scoringHistory } = useApp();
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'

  const totalScore = scoringHistory.reduce((sum, item) => sum + item.points, 0);
  
  // Calculate dream progress statistics
  const dreamProgressStats = {
    totalDreams: currentUser.dreamBook.length,
    averageProgress: currentUser.dreamBook.length > 0 
      ? Math.round(currentUser.dreamBook.reduce((sum, dream) => sum + dream.progress, 0) / currentUser.dreamBook.length)
      : 0,
    completedDreams: currentUser.dreamBook.filter(dream => dream.progress === 100).length,
    activeDreams: currentUser.dreamBook.filter(dream => dream.progress > 0 && dream.progress < 100).length
  };

  const categoryStats = {
    dreamsCompleted: {
      count: scoringHistory.filter(item => item.type === 'dreamCompleted').length,
      points: scoringHistory.filter(item => item.type === 'dreamCompleted').reduce((sum, item) => sum + item.points, 0),
      icon: Target,
      color: 'text-netsurit-red',
      bgColor: 'bg-netsurit-light-coral/20'
    },
    dreamConnects: {
      count: scoringHistory.filter(item => item.type === 'dreamConnect').length,
      points: scoringHistory.filter(item => item.type === 'dreamConnect').reduce((sum, item) => sum + item.points, 0),
      icon: Users,
      color: 'text-netsurit-coral',
      bgColor: 'bg-netsurit-coral/20'
    },
    groupAttendance: {
      count: scoringHistory.filter(item => item.type === 'groupAttendance').length,
      points: scoringHistory.filter(item => item.type === 'groupAttendance').reduce((sum, item) => sum + item.points, 0),
      icon: Calendar,
      color: 'text-netsurit-orange',
      bgColor: 'bg-netsurit-warm-orange/20'
    },
    dreamProgress: {
      count: dreamProgressStats.totalDreams,
      points: dreamProgressStats.averageProgress,
      icon: Activity,
      color: 'text-netsurit-coral',
      bgColor: 'bg-netsurit-coral/20'
    }
  };

  const getScoreLevel = (score) => {
    if (score >= 100) return { level: 'Dream Master', icon: Medal, color: 'text-netsurit-warm-orange' };
    if (score >= 75) return { level: 'Dream Achiever', icon: Trophy, color: 'text-netsurit-red' };
    if (score >= 50) return { level: 'Dream Builder', icon: Star, color: 'text-netsurit-coral' };
    if (score >= 25) return { level: 'Dream Explorer', icon: TrendingUp, color: 'text-netsurit-orange' };
    return { level: 'Dream Starter', icon: Target, color: 'text-professional-gray-600' };
  };

  const currentLevel = getScoreLevel(totalScore);
  const nextLevel = getScoreLevel(totalScore + 25);
  const progressToNext = totalScore >= 100 ? 100 : ((totalScore % 25) / 25) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Compact Header with Total Score */}
      <div className="bg-gradient-to-r from-netsurit-red to-netsurit-orange text-white rounded-2xl shadow-xl p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Title and Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Scorecard</h1>
            </div>
            <p className="text-white/90 text-sm">
              Track your dream journey progress
            </p>
          </div>

          {/* Total Score */}
          <div className="lg:col-span-1 text-center">
            <div className="inline-flex items-center space-x-4 bg-white/20 rounded-xl p-4">
              <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6" />
        </div>
              <div>
                <p className="text-3xl font-bold">{totalScore}</p>
                <p className="text-sm opacity-90">Total Points</p>
      </div>
            </div>
          </div>

          {/* Level and Progress */}
          <div className="lg:col-span-1 text-center lg:text-right">
            <div className="flex items-center justify-center lg:justify-end space-x-2 mb-2">
              <currentLevel.icon className="w-5 h-5" />
              <span className="font-medium">{currentLevel.level}</span>
            </div>
            {totalScore < 100 && (
              <div>
                <p className="text-xs opacity-90 mb-1">
                  Next: {nextLevel.level}
                </p>
                <div className="w-24 bg-white/20 rounded-full h-1.5 mx-auto lg:mx-0 lg:ml-auto">
                  <div
                    className="bg-white h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressToNext}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setViewMode('summary')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
            viewMode === 'summary'
              ? 'bg-netsurit-red text-white shadow-lg'
              : 'bg-white text-professional-gray-700 hover:bg-professional-gray-50 border border-professional-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setViewMode('detailed')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
            viewMode === 'detailed'
              ? 'bg-netsurit-red text-white shadow-lg'
              : 'bg-white text-professional-gray-700 hover:bg-professional-gray-50 border border-professional-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          History
        </button>
      </div>

      {viewMode === 'summary' ? (
        <SummaryView categoryStats={categoryStats} scoringRules={scoringRules} totalScore={totalScore} />
      ) : (
        <DetailedView scoringHistory={scoringHistory} />
      )}
    </div>
  );
};

const SummaryView = ({ categoryStats, scoringRules, totalScore }) => {
  const categories = [
    { key: 'dreamsCompleted', label: 'Dreams Completed', stats: categoryStats.dreamsCompleted },
    { key: 'dreamConnects', label: 'Dream Connects', stats: categoryStats.dreamConnects },
    { key: 'groupAttendance', label: 'Group Attendance', stats: categoryStats.groupAttendance },
    { key: 'dreamProgress', label: 'Dream Progress', stats: categoryStats.dreamProgress }
  ];

  const totalActivities = categories.reduce((sum, cat) => sum + cat.stats.count, 0);

  return (
    <div className="space-y-6">
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown - Compact Cards */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-professional-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-professional-gray-900">Activity Breakdown</h3>
              <PieChart className="w-5 h-5 text-professional-gray-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => {
                if (category.key === 'dreamProgress') {
                  return (
                    <DreamProgressCard
                      key={category.key}
                      title={category.label}
                      totalDreams={category.stats.count}
                      averageProgress={category.stats.points}
                      icon={category.stats.icon}
                      color={category.stats.color}
                      bgColor={category.stats.bgColor}
                    />
                  );
                }
                return (
                  <CompactScoreCard
                    key={category.key}
                    title={category.label}
                    count={category.stats.count}
                    points={category.stats.points}
                    pointsEach={scoringRules[category.key === 'dreamsCompleted' ? 'dreamCompleted' : category.key]}
                    icon={category.stats.icon}
                    color={category.stats.color}
                    bgColor={category.stats.bgColor}
                  />
                );
              })}
      </div>
          </div>
        </div>

        {/* Stats and Progress */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-professional-gray-200 p-6">
            <h3 className="text-lg font-semibold text-professional-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-professional-gray-600">Total Activities</span>
                <span className="font-bold text-professional-gray-900">{totalActivities}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-professional-gray-600">Average per Activity</span>
                <span className="font-bold text-professional-gray-900">
                  {totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0} pts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-professional-gray-600">Most Active</span>
                <span className="font-bold text-professional-gray-900">
                  {categories.reduce((max, cat) => 
                    cat.stats.count > max.stats.count ? cat : max
                  ).label.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

const DetailedView = ({ scoringHistory }) => {
  const groupedHistory = scoringHistory.reduce((groups, item) => {
    const date = new Date(item.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-professional-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-professional-gray-900">Points History</h3>
          <div className="text-sm text-professional-gray-500">
            {scoringHistory.length} total activities
          </div>
        </div>
        
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dayItems = groupedHistory[date];
            const dayTotal = dayItems.reduce((sum, item) => sum + item.points, 0);
            
            return (
              <div key={date} className="border-l-4 border-netsurit-red pl-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-professional-gray-900">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <span className="text-sm font-bold text-netsurit-red">
                    +{dayTotal} pts
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dayItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-professional-gray-50 rounded-lg hover:bg-professional-gray-100 transition-colors duration-200">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-professional-gray-900 text-sm truncate">{item.title}</h5>
                        <p className="text-xs text-professional-gray-600 mt-1">{item.category}</p>
                      </div>
                      <div className="text-right ml-3">
                        <span className="text-sm font-bold text-netsurit-red">
                          +{item.points}
                        </span>
                      </div>
                    </div>
        ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {scoringHistory.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-professional-gray-300 mx-auto mb-4" />
            <p className="text-professional-gray-500">No activities yet. Start your dream journey!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DreamProgressCard = ({ title, totalDreams, averageProgress, icon: Icon, color, bgColor }) => {
  return (
    <div className="p-4 rounded-xl border border-professional-gray-200 hover:shadow-sm transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-professional-gray-900 text-sm truncate">{title}</h4>
          <p className="text-xs text-professional-gray-500">{totalDreams} dreams</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-professional-gray-600">
          Average progress
        </span>
        <span className={`text-lg font-bold ${color}`}>
          {averageProgress}%
        </span>
      </div>
    </div>
  );
};

const CompactScoreCard = ({ title, count, points, pointsEach, icon: Icon, color, bgColor }) => {
  return (
    <div className="p-4 rounded-xl border border-professional-gray-200 hover:shadow-sm transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-professional-gray-900 text-sm truncate">{title}</h4>
          <p className="text-xs text-professional-gray-500">{count} activities</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-professional-gray-600">
          {pointsEach} pts each
        </span>
        <span className={`text-lg font-bold ${color}`}>
          {points}
        </span>
      </div>
    </div>
  );
};

export default Scorecard;