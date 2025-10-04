// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { Trophy, BarChart3, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useScorecardData } from '../../hooks/useScorecardData';
import SummaryView from './SummaryView';
import HistoryView from './HistoryView';

/**
 * Main layout for Scorecard page
 * Orchestrates view state and renders header with score summary
 */
function ScorecardLayout() {
  const { currentUser, scoringRules, scoringHistory } = useApp();
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'

  // Get all calculated data from hook
  const {
    totalScore,
    categoryStats,
    currentLevel,
    nextLevel,
    progressToNext,
    groupedHistory,
    sortedDates
  } = useScorecardData(currentUser, scoringHistory, scoringRules);

  // Early return for loading state
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="text-center py-12">
          <p className="text-professional-gray-500">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" data-testid="scorecard-layout">
      {/* Compact Header with Total Score */}
      <div 
        className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-2xl shadow-xl p-6 mb-6"
        role="banner"
        aria-label="Scorecard header with total score and level"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Title and Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="h-8 w-8" aria-hidden="true" />
              <h1 className="text-2xl font-bold">Scorecard</h1>
            </div>
            <p className="text-white/90 text-sm">
              Track your dream journey progress
            </p>
          </div>

          {/* Total Score */}
          <div className="lg:col-span-1 text-center">
            <div className="inline-flex items-center space-x-4 bg-white/20 rounded-xl p-4">
              <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center" aria-hidden="true">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-bold" data-testid="total-score">{totalScore}</p>
                <p className="text-sm opacity-90">Total Points</p>
              </div>
            </div>
          </div>

          {/* Level and Progress */}
          <div className="lg:col-span-1 text-center lg:text-right">
            <div 
              className="flex items-center justify-center lg:justify-end space-x-2 mb-2"
              data-testid="current-level"
            >
              <currentLevel.icon className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">{currentLevel.level}</span>
            </div>
            {totalScore < 100 && (
              <div>
                <p className="text-xs opacity-90 mb-1">
                  Next: {nextLevel.level}
                </p>
                <div 
                  className="w-24 bg-white/20 rounded-full h-1.5 mx-auto lg:mx-0 lg:ml-auto"
                  role="progressbar"
                  aria-valuenow={progressToNext}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`Progress to ${nextLevel.level}`}
                >
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
      <div 
        className="flex space-x-2 mb-6"
        role="tablist"
        aria-label="Scorecard views"
      >
        <button
          onClick={() => setViewMode('summary')}
          role="tab"
          aria-selected={viewMode === 'summary'}
          aria-controls="scorecard-content"
          data-testid="summary-tab"
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
            viewMode === 'summary'
              ? 'bg-netsurit-red text-white shadow-lg'
              : 'bg-white text-professional-gray-700 hover:bg-professional-gray-50 border border-professional-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" aria-hidden="true" />
          Overview
        </button>
        <button
          onClick={() => setViewMode('detailed')}
          role="tab"
          aria-selected={viewMode === 'detailed'}
          aria-controls="scorecard-content"
          data-testid="history-tab"
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
            viewMode === 'detailed'
              ? 'bg-netsurit-red text-white shadow-lg'
              : 'bg-white text-professional-gray-700 hover:bg-professional-gray-50 border border-professional-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" aria-hidden="true" />
          History
        </button>
      </div>

      {/* Tab Content */}
      <div 
        id="scorecard-content"
        role="tabpanel"
        aria-labelledby={viewMode === 'summary' ? 'summary-tab' : 'history-tab'}
      >
        {viewMode === 'summary' ? (
          <SummaryView 
            categoryStats={categoryStats}
            scoringRules={scoringRules}
            totalScore={totalScore}
          />
        ) : (
          <HistoryView 
            groupedHistory={groupedHistory}
            sortedDates={sortedDates}
            totalActivities={scoringHistory.length}
          />
        )}
      </div>
    </div>
  );
}

export default ScorecardLayout;

