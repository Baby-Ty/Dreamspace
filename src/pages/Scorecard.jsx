import React, { useState } from 'react';
import { Trophy, Target, Users, BookOpen, Calendar, TrendingUp, Medal, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Scorecard = () => {
  const { currentUser, scoringRules, scoringHistory } = useApp();
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'

  const totalScore = scoringHistory.reduce((sum, item) => sum + item.points, 0);

  const categoryStats = {
    dreamsCompleted: {
      count: scoringHistory.filter(item => item.type === 'dreamCompleted').length,
      points: scoringHistory.filter(item => item.type === 'dreamCompleted').reduce((sum, item) => sum + item.points, 0),
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    dreamConnects: {
      count: scoringHistory.filter(item => item.type === 'dreamConnect').length,
      points: scoringHistory.filter(item => item.type === 'dreamConnect').reduce((sum, item) => sum + item.points, 0),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    journalEntries: {
      count: scoringHistory.filter(item => item.type === 'journalEntry').length,
      points: scoringHistory.filter(item => item.type === 'journalEntry').reduce((sum, item) => sum + item.points, 0),
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    groupAttendance: {
      count: scoringHistory.filter(item => item.type === 'groupAttendance').length,
      points: scoringHistory.filter(item => item.type === 'groupAttendance').reduce((sum, item) => sum + item.points, 0),
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  };

  const getScoreLevel = (score) => {
    if (score >= 100) return { level: 'Dream Master', icon: Medal, color: 'text-yellow-600' };
    if (score >= 75) return { level: 'Dream Achiever', icon: Trophy, color: 'text-purple-600' };
    if (score >= 50) return { level: 'Dream Builder', icon: Star, color: 'text-blue-600' };
    if (score >= 25) return { level: 'Dream Explorer', icon: TrendingUp, color: 'text-green-600' };
    return { level: 'Dream Starter', icon: Target, color: 'text-gray-600' };
  };

  const currentLevel = getScoreLevel(totalScore);
  const nextLevel = getScoreLevel(totalScore + 25);
  const progressToNext = totalScore >= 100 ? 100 : ((totalScore % 25) / 25) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-100 via-blue-50 to-pink-100 rounded-2xl p-4 sm:p-6 shadow-sm border border-white/50">
        <div className="text-center space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Scorecard 🏆
          </h1>
          <p className="text-lg text-gray-700 font-medium">
            Track your achievements and see how you're progressing on your dream journey.
          </p>
        </div>
      </div>

      {/* Total Score Card */}
      <div className="bg-gradient-to-r from-dream-blue to-dream-purple text-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Total Score</h2>
            <p className="text-4xl font-bold">{totalScore} Points</p>
            <div className="flex items-center mt-4">
              <currentLevel.icon className={`w-6 h-6 mr-2 ${currentLevel.color.replace('text-', 'text-')}`} />
              <span className="text-lg font-medium">{currentLevel.level}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12" />
            </div>
            {totalScore < 100 && (
              <div>
                <p className="text-sm opacity-90 mb-2">
                  Progress to {nextLevel.level}
                </p>
                <div className="w-32 bg-white bg-opacity-20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressToNext}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setViewMode('summary')}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
            viewMode === 'summary'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Summary View
        </button>
        <button
          onClick={() => setViewMode('detailed')}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
            viewMode === 'detailed'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Detailed History
        </button>
      </div>

      {viewMode === 'summary' ? (
        <SummaryView categoryStats={categoryStats} scoringRules={scoringRules} />
      ) : (
        <DetailedView scoringHistory={scoringHistory} />
      )}
    </div>
  );
};

const SummaryView = ({ categoryStats, scoringRules }) => {
  return (
    <div className="space-y-8">
      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard
          title="Dreams Completed"
          count={categoryStats.dreamsCompleted.count}
          points={categoryStats.dreamsCompleted.points}
          pointsEach={scoringRules.dreamCompleted}
          icon={categoryStats.dreamsCompleted.icon}
          color={categoryStats.dreamsCompleted.color}
          bgColor={categoryStats.dreamsCompleted.bgColor}
        />
        
        <ScoreCard
          title="Dream Connects"
          count={categoryStats.dreamConnects.count}
          points={categoryStats.dreamConnects.points}
          pointsEach={scoringRules.dreamConnect}
          icon={categoryStats.dreamConnects.icon}
          color={categoryStats.dreamConnects.color}
          bgColor={categoryStats.dreamConnects.bgColor}
        />
        
        <ScoreCard
          title="Journal Entries"
          count={categoryStats.journalEntries.count}
          points={categoryStats.journalEntries.points}
          pointsEach={scoringRules.journalEntry}
          icon={categoryStats.journalEntries.icon}
          color={categoryStats.journalEntries.color}
          bgColor={categoryStats.journalEntries.bgColor}
        />
        
        <ScoreCard
          title="Group Attendance"
          count={categoryStats.groupAttendance.count}
          points={categoryStats.groupAttendance.points}
          pointsEach={scoringRules.groupAttendance}
          icon={categoryStats.groupAttendance.icon}
          color={categoryStats.groupAttendance.color}
          bgColor={categoryStats.groupAttendance.bgColor}
        />
      </div>

      {/* Scoring Rules */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          How Points Are Earned
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-sm transition-all duration-200">
            <span className="text-gray-700 font-medium">Dreams Completed</span>
            <span className="font-bold text-green-600">+{scoringRules.dreamCompleted} pts</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-sm transition-all duration-200">
            <span className="text-gray-700 font-medium">Dream Connects</span>
            <span className="font-bold text-blue-600">+{scoringRules.dreamConnect} pts</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-sm transition-all duration-200">
            <span className="text-gray-700 font-medium">Journal Entries</span>
            <span className="font-bold text-purple-600">+{scoringRules.journalEntry} pts</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-sm transition-all duration-200">
            <span className="text-gray-700 font-medium">Group Attendance</span>
            <span className="font-bold text-orange-600">+{scoringRules.groupAttendance} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailedView = ({ scoringHistory }) => {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Points History
      </h3>
      <div className="space-y-4">
        {scoringHistory.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md hover:scale-[1.02] transition-all duration-300">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-600">{item.category}</span>
                <span className="text-sm text-gray-500">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-dream-blue">
                +{item.points} pts
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ScoreCard = ({ title, count, points, pointsEach, icon: Icon, color, bgColor }) => {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${bgColor} rounded-xl`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <span className={`text-2xl font-bold ${color}`}>
          +{points}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <div className="text-sm text-gray-600">
        <p>{count} × {pointsEach} points each</p>
      </div>
    </div>
  );
};

export default Scorecard;