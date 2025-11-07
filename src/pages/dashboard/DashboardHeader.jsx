// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { memo } from 'react';
import PropTypes from 'prop-types';
import { HelpCircle, BookOpen, Users, Trophy, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Dashboard Header Component
 * Displays welcome message, stats cards, and Vision Builder CTA
 */
function DashboardHeader({ userName, stats, onShowGuide }) {
  const navigate = useNavigate();

  return (
    <div className="mb-4" data-testid="dashboard-header">
      {/* Header with Stats */}
      <div className="mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-3 mb-1.5">
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-professional-gray-900 to-professional-gray-700 bg-clip-text text-transparent">
                Welcome back, {userName}! ✨
              </h1>
              <button
                onClick={onShowGuide}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-netsurit-red hover:text-white bg-white hover:bg-netsurit-red border-2 border-netsurit-red rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="View DreamSpace guide"
                data-testid="guide-button"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Guide</span>
              </button>
            </div>
            <p className="text-sm text-professional-gray-600 font-medium">
              Ready to make progress on your dreams today?
            </p>
          </div>
          
          {/* Stats Cards - Compact */}
          <div className="flex flex-wrap gap-3">
            <div 
              className="bg-gradient-to-br from-white to-professional-gray-50 rounded-lg shadow-md p-3 border-2 border-professional-gray-200 hover:shadow-lg hover:border-netsurit-red/30 transition-all text-center min-w-[90px]"
              data-testid="stats-dreams"
            >
              <div className="flex items-center justify-center mb-1.5">
                <div className="p-1.5 bg-netsurit-red/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-netsurit-red" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-professional-gray-600 uppercase tracking-wider">
                Dreams
              </p>
              <p className="text-2xl font-bold text-professional-gray-900">{stats.dreamsCreated}</p>
            </div>
            <div 
              className="bg-gradient-to-br from-white to-professional-gray-50 rounded-lg shadow-md p-3 border-2 border-professional-gray-200 hover:shadow-lg hover:border-netsurit-coral/30 transition-all text-center min-w-[90px]"
              data-testid="stats-connects"
            >
              <div className="flex items-center justify-center mb-1.5">
                <div className="p-1.5 bg-netsurit-coral/10 rounded-lg">
                  <Users className="h-5 w-5 text-netsurit-coral" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-professional-gray-600 uppercase tracking-wider">
                Connects
              </p>
              <p className="text-2xl font-bold text-professional-gray-900">{stats.connectsCompleted}</p>
            </div>
            <div 
              className="bg-gradient-to-br from-white to-professional-gray-50 rounded-lg shadow-md p-3 border-2 border-professional-gray-200 hover:shadow-lg hover:border-netsurit-orange/30 transition-all text-center min-w-[90px]"
              data-testid="stats-points"
            >
              <div className="flex items-center justify-center mb-1.5">
                <div className="p-1.5 bg-netsurit-orange/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-netsurit-orange" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-professional-gray-600 uppercase tracking-wider">
                Points
              </p>
              <p className="text-2xl font-bold text-professional-gray-900">{stats.scorecardPoints}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vision Builder Demo CTA - Compact */}
      <div className="bg-gradient-to-r from-netsurit-red via-netsurit-coral to-netsurit-orange rounded-xl p-4 shadow-lg mb-4 border border-netsurit-red/20">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
          <div className="text-white">
            <div className="flex items-center space-x-2 mb-1">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-lg font-bold">Build Your Best Year</h3>
            </div>
            <p className="text-sm text-white/90">
              Try our AI-guided chat to create Dreams, Milestones, and Weekly Goals in minutes
            </p>
          </div>
          <button
            onClick={() => navigate('/vision-builder-demo')}
            className="bg-white text-netsurit-red px-5 py-2.5 rounded-lg font-bold hover:bg-professional-gray-50 transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center space-x-2 whitespace-nowrap"
            aria-label="Try Vision Builder Demo"
            data-testid="vision-builder-cta"
          >
            <span>Try Demo</span>
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

DashboardHeader.propTypes = {
  /** User's first name */
  userName: PropTypes.string.isRequired,
  /** Stats object with counts */
  stats: PropTypes.shape({
    dreamsCreated: PropTypes.number.isRequired,
    connectsCompleted: PropTypes.number.isRequired,
    scorecardPoints: PropTypes.number.isRequired,
  }).isRequired,
  /** Callback to show guide modal */
  onShowGuide: PropTypes.func.isRequired,
};

export default memo(DashboardHeader);

