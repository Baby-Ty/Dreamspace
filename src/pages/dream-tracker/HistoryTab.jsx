// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';
import { 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Edit3 
} from 'lucide-react';

/**
 * History Tab - Display dream activity history
 * @component
 */
export function HistoryTab({ history, formatDate }) {
  const getHistoryIcon = (type) => {
    switch (type) {
      case 'progress':
        return <TrendingUp className="w-3 h-3" />;
      case 'goal':
      case 'milestone':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'note':
        return <Edit3 className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getHistoryColor = (type) => {
    switch (type) {
      case 'progress':
        return 'text-netsurit-red bg-netsurit-light-coral/20';
      case 'goal':
      case 'milestone':
        return 'text-netsurit-coral bg-netsurit-coral/20';
      case 'note':
        return 'text-netsurit-orange bg-netsurit-orange/20';
      default:
        return 'text-professional-gray-600 bg-professional-gray-100';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-professional-gray-900">History</h3>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-10 h-10 mx-auto mb-3 text-professional-gray-300" />
          <p className="text-professional-gray-500 text-sm">No history yet. Your progress updates will appear here!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex items-start space-x-3 relative">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getHistoryColor(entry.type)}`}>
                {getHistoryIcon(entry.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white border border-professional-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="p-3">
                    <p className="text-professional-gray-900 font-medium text-sm">{entry.action}</p>
                    <p className="text-xs text-professional-gray-600 mt-1">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              </div>
              {index < history.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-2 bg-professional-gray-200"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

HistoryTab.propTypes = {
  history: PropTypes.array.isRequired,
  formatDate: PropTypes.func.isRequired
};

export default React.memo(HistoryTab);




