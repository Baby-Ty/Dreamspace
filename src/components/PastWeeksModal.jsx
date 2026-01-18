
import { memo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X, TrendingUp, Calendar, Award, CheckCircle2, XCircle } from 'lucide-react';
import { formatWeekRange } from '../utils/dateUtils';

/**
 * Past Weeks Modal Component
 * Displays historical week performance for review
 */
function PastWeeksModal({ isOpen, onClose, weeks = [], isLoading }) {
  // Ensure weeks is always an array (must be before any hooks)
  const safeWeeks = Array.isArray(weeks) ? weeks : [];
  const scrollContainerRef = useRef(null);
  
  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('📊 PastWeeksModal opened:', {
        isLoading,
        weeksCount: safeWeeks.length,
        weeks: safeWeeks,
        weeksType: Array.isArray(weeks) ? 'array' : typeof weeks,
        rawWeeks: weeks
      });
    }
  }, [isOpen, isLoading, safeWeeks.length, weeks]);

  /**
   * Get text color class based on score percentage
   * DreamSpace mapping (text only, borders stay neutral):
   * - 80-100%: professional gray (secondary button vibe)
   * - 60-79% : primary red
   * - 40-59% : orange
   * - 0-39%  : dark yellow
   * @param {number} score - Score percentage (0-100)
   * @returns {string} Tailwind color classes
   */
  const getScoreTextColor = (score) => {
    if (score >= 80) return 'text-professional-gray-900';
    if (score >= 60) return 'text-netsurit-red';
    if (score >= 40) return 'text-netsurit-orange';
    return 'text-yellow-700';
  };

  /**
   * Get border color class based on score
   * Kept neutral so color is not overwhelming
   * @param {number} score - Score percentage (0-100)
   * @returns {string} Tailwind border color
   */
  const getBorderColor = (score) => {
    return 'border-professional-gray-200 hover:border-professional-gray-300';
  };

  // Sort weeks so earlier weeks are on the left, most recent on the right
  const sortedWeeks = [...safeWeeks].sort((a, b) => a.weekId.localeCompare(b.weekId));
  const mostRecentWeekId = sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1].weekId : null;

  // When weeks change, scroll the horizontal list so that the most recent week is visible on the right
  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      el.scrollLeft = el.scrollWidth;
    }
  }, [sortedWeeks.length]);

  // Early return for closed modal (after hooks)
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="past-weeks-title"
      data-testid="past-weeks-modal"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-professional-gray-200 bg-gradient-to-r from-professional-gray-50 to-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-netsurit-red/10 rounded-lg">
              <Calendar className="w-6 h-6 text-netsurit-red" aria-hidden="true" />
            </div>
            <div>
              <h2 id="past-weeks-title" className="text-2xl font-bold text-professional-gray-900">
                Past Weeks Tracker
              </h2>
              <p className="text-sm text-professional-gray-600 mt-0.5">
                Review your weekly performance history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-professional-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-netsurit-red"
            aria-label="Close modal"
            data-testid="close-modal-button"
          >
            <X className="w-6 h-6 text-professional-gray-600" aria-hidden="true" />
          </button>
        </div>

        {/* Overall Stats Banner */}
        {sortedWeeks.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-br from-netsurit-red/5 via-netsurit-coral/5 to-transparent border-b border-professional-gray-200 flex-shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Calendar className="w-4 h-4 text-netsurit-red" aria-hidden="true" />
                  <span className="text-xs font-medium text-professional-gray-600">Total Weeks</span>
                </div>
                <p className="text-2xl font-bold text-professional-gray-900">{sortedWeeks.length}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" aria-hidden="true" />
                  <span className="text-xs font-medium text-professional-gray-600">Avg Score</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(sortedWeeks.reduce((sum, w) => sum + w.score, 0) / sortedWeeks.length)}%
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-netsurit-coral" aria-hidden="true" />
                  <span className="text-xs font-medium text-professional-gray-600">Completed</span>
                </div>
                <p className="text-2xl font-bold text-netsurit-coral">
                  {sortedWeeks.reduce((sum, w) => sum + w.completedGoals, 0)}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Award className="w-4 h-4 text-netsurit-orange" aria-hidden="true" />
                  <span className="text-xs font-medium text-professional-gray-600">Best Week</span>
                </div>
                <p className="text-2xl font-bold text-netsurit-orange">
                  {Math.max(...sortedWeeks.map(w => w.score))}%
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netsurit-red mx-auto mb-4"></div>
                <p className="text-professional-gray-600">Loading past weeks...</p>
              </div>
            </div>
          ) : sortedWeeks.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-professional-gray-100 rounded-full w-fit mx-auto mb-4">
                <Calendar className="w-12 h-12 text-professional-gray-400" aria-hidden="true" />
              </div>
              <p className="text-xl font-bold text-professional-gray-800 mb-2">No past weeks yet</p>
              <p className="text-professional-gray-600">
                Complete your first week to see it here!
              </p>
            </div>
          ) : (
            <div
              className="-mx-2 px-2 overflow-x-auto"
              role="region"
              aria-label="Past weeks timeline"
              ref={scrollContainerRef}
            >
              <div className="flex space-x-4 min-w-max" data-testid="weeks-grid">
                {sortedWeeks.map((week) => {
                  const score = week.score || 0;
                  const dateRange = formatWeekRange(week.weekStartDate);
                  const isMostRecent = week.weekId === mostRecentWeekId;

                  return (
                    <div
                      key={week.weekId}
                      className={`relative p-4 rounded-xl border-2 ${getBorderColor(score)} transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white w-40 sm:w-44 ${
                        isMostRecent ? 'ring-2 ring-netsurit-red/40' : ''
                      }`}
                      data-testid={`week-${week.weekId}`}
                    >
                      {isMostRecent && (
                        <div className="absolute top-2 left-3 bg-netsurit-red/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                          Last week
                        </div>
                      )}
                      {/* Week number and date */}
                      <div className="text-center mb-3">
                        <p className="text-lg font-bold text-professional-gray-900 mb-1">
                          W{week.weekId.split('-W')[1]}
                        </p>
                        <p className="text-xs text-professional-gray-600 leading-tight">
                          {dateRange}
                        </p>
                      </div>

                      {/* Score - large and centered */}
                      <div className="text-center mb-3">
                        <p className={`text-5xl font-bold ${getScoreTextColor(score)}`}>
                          {score}%
                        </p>
                      </div>

                      {/* Goals count */}
                      <div className="text-center">
                        <p className="text-sm font-medium text-professional-gray-600">
                          {week.completedGoals}/{week.totalGoals} goals
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-professional-gray-200 bg-professional-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-professional-gray-600">
              <span className="font-medium">
                80-100%: Professional Gray • 60-79%: Red • 40-59%: Orange • 0-39%: Dark Yellow
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 font-semibold shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2"
              data-testid="close-button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

PastWeeksModal.propTypes = {
  /** Whether the modal is open */
  isOpen: PropTypes.bool.isRequired,
  /** Callback to close the modal */
  onClose: PropTypes.func.isRequired,
  /** Array of past week data */
  weeks: PropTypes.arrayOf(PropTypes.shape({
    weekId: PropTypes.string.isRequired,
    weekStartDate: PropTypes.string.isRequired,
    totalGoals: PropTypes.number.isRequired,
    completedGoals: PropTypes.number.isRequired,
    score: PropTypes.number.isRequired,
  })).isRequired,
  /** Loading state */
  isLoading: PropTypes.bool,
};

PastWeeksModal.defaultProps = {
  isLoading: false,
};

export default memo(PastWeeksModal);
