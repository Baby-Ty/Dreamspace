// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { Trophy, BarChart3, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useScorecardData } from '../../hooks/useScorecardData';
import SummaryView from './SummaryView';
import HistoryView from './HistoryView';
import YearBreakdownView from './YearBreakdownView';
import HelpTooltip from '../../components/HelpTooltip';

/**
 * Main layout for Scorecard page
 * Orchestrates view state and renders header with score summary
 */
function ScorecardLayout() {
  const { currentUser, scoringRules, scoringHistory, allYearsScoring } = useApp();
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detailed'

  // Get all calculated data from hook (now with all-time scoring support)
  const {
    totalScore,
    allTimeScore,
    currentYearScore,
    yearlyBreakdown,
    categoryStats,
    currentLevel,
    nextLevel,
    progressToNext,
    groupedHistory,
    sortedDates
  } = useScorecardData(currentUser, scoringHistory, scoringRules, allYearsScoring);

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
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="h-8 w-8 text-netsurit-red" aria-hidden="true" />
              <h1 className="text-2xl lg:text-3xl font-bold text-professional-gray-900">Scorecard</h1>
              <HelpTooltip 
                title="Scorecard Guide"
                content="Earn points for your activities: +10 for completing dreams, +5 for Dream Connects, +3 for group attendance. Track your progress, view detailed history, and unlock achievement levels as you grow!"
              />
            </div>
            <p className="text-base text-professional-gray-600 font-medium">
              Track your dream journey progress
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-5">
            {/* All-Time Score Card */}
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-netsurit-orange" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">All-Time Points</p>
              <p className="text-xl font-bold text-professional-gray-900" data-testid="all-time-score">{allTimeScore}</p>
            </div>
            
            {/* Current Year Score Card */}
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-netsurit-coral" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">{new Date().getFullYear()} Points</p>
              <p className="text-xl font-bold text-professional-gray-900" data-testid="current-year-score">{currentYearScore}</p>
            </div>

            {/* Current Level Card */}
            <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[100px]">
              <div className="flex items-center justify-center mb-2">
                <currentLevel.icon className="h-6 w-6 text-netsurit-red" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Level</p>
              <p className="text-xl font-bold text-professional-gray-900" data-testid="current-level">{currentLevel.level}</p>
            </div>

            {/* Next Level Progress Card */}
            {totalScore < 100 && (
              <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center min-w-[120px]">
                <div className="flex items-center justify-center mb-2">
                  <nextLevel.icon className="h-6 w-6 text-netsurit-coral" aria-hidden="true" />
                </div>
                <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">Next: {nextLevel.level}</p>
                <div 
                  className="w-full bg-professional-gray-200 rounded-full h-2 mt-2"
                  role="progressbar"
                  aria-valuenow={progressToNext}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`Progress to ${nextLevel.level}`}
                >
                  <div
                    className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-2 rounded-full transition-all duration-300"
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
        <button
          onClick={() => setViewMode('breakdown')}
          role="tab"
          aria-selected={viewMode === 'breakdown'}
          aria-controls="scorecard-content"
          data-testid="breakdown-tab"
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
            viewMode === 'breakdown'
              ? 'bg-netsurit-red text-white shadow-lg'
              : 'bg-white text-professional-gray-700 hover:bg-professional-gray-50 border border-professional-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" aria-hidden="true" />
          Years
        </button>
      </div>

      {/* Tab Content */}
      <div 
        id="scorecard-content"
        role="tabpanel"
        aria-labelledby={viewMode === 'summary' ? 'summary-tab' : viewMode === 'breakdown' ? 'breakdown-tab' : 'history-tab'}
      >
        {viewMode === 'summary' ? (
          <SummaryView 
            categoryStats={categoryStats}
            scoringRules={scoringRules}
            totalScore={totalScore}
          />
        ) : viewMode === 'breakdown' ? (
          <YearBreakdownView 
            yearlyBreakdown={yearlyBreakdown}
            allTimeScore={allTimeScore}
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

