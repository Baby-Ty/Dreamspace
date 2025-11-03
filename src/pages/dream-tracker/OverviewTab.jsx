// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingUp, 
  Clock, 
  Target 
} from 'lucide-react';

/**
 * Overview Tab - Displays dream overview with What/Why/How and progress stats
 * @component
 */
export function OverviewTab({ localDream, completedGoals, totalGoals, getCategoryIcon, formatDate }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
      {/* Dream Overview - What, Why, How */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
          <div className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-netsurit-red rounded-full"></div>
              <h4 className="font-bold text-professional-gray-900 text-sm">What</h4>
            </div>
            <p className="text-professional-gray-700 leading-relaxed text-sm">
              {localDream.description || "This dream represents a personal goal or aspiration that you're working towards achieving."}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
          <div className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-netsurit-coral rounded-full"></div>
              <h4 className="font-bold text-professional-gray-900 text-sm">Why</h4>
            </div>
            <p className="text-professional-gray-700 leading-relaxed text-sm">
              {localDream.motivation || `This ${localDream.category.toLowerCase()} goal is important for your personal growth and development, contributing to overall life satisfaction and achievement.`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
          <div className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-netsurit-orange rounded-full"></div>
              <h4 className="font-bold text-professional-gray-900 text-sm">How</h4>
            </div>
            <p className="text-professional-gray-700 leading-relaxed text-sm">
              {localDream.approach || `Through structured goals and consistent progress tracking, you're pursuing this dream with ${totalGoals} defined steps towards completion.`}
            </p>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
          <div className="p-2 px-3 border-b border-professional-gray-200 bg-professional-gray-50">
            <h4 className="font-bold text-professional-gray-900 flex items-center space-x-2 text-sm">
              <TrendingUp className="h-4 w-4 text-netsurit-red" />
              <span>Progress Statistics</span>
            </h4>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-professional-gray-600">Overall Progress</span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 bg-professional-gray-200 rounded-full h-2 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${localDream.progress}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-netsurit-red text-xs">{localDream.progress}%</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-medium text-professional-gray-600">Goals Completed</span>
                <span className="font-bold text-professional-gray-900 text-xs">{completedGoals}/{totalGoals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-medium text-professional-gray-600">Personal Notes</span>
                <span className="font-bold text-professional-gray-900 text-xs">{localDream.notes?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-medium text-professional-gray-600">Activity History</span>
                <span className="font-bold text-professional-gray-900 text-xs">{localDream.history?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
          <div className="p-2 px-3 border-b border-professional-gray-200 bg-professional-gray-50">
            <h4 className="font-bold text-professional-gray-900 flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-netsurit-red" />
              <span>Recent Activity</span>
            </h4>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              {localDream.history?.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-netsurit-coral rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-xs text-professional-gray-700 font-medium">{entry.action}</p>
                    <p className="text-xs text-professional-gray-500">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) || <p className="text-xs text-professional-gray-500 italic">No recent activity</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

OverviewTab.propTypes = {
  localDream: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    motivation: PropTypes.string,
    approach: PropTypes.string,
    category: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    notes: PropTypes.array,
    history: PropTypes.array
  }).isRequired,
  completedGoals: PropTypes.number.isRequired,
  totalGoals: PropTypes.number.isRequired,
  getCategoryIcon: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired
};

export default React.memo(OverviewTab);

