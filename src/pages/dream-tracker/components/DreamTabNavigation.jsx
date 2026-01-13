// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';

/**
 * DreamTabNavigation - Tab navigation for dream tracker modal
 * Handles switching between Overview, Goals, Coach Notes, and History tabs
 * @component
 */
export function DreamTabNavigation({ 
  activeTab, 
  onTabChange, 
  totalGoals, 
  coachNotesCount, 
  historyCount 
}) {
  const tabs = [
    { id: 'overview', label: 'Overview', shortLabel: 'Overview' },
    { id: 'goals', label: 'Goals', shortLabel: 'Goals', count: totalGoals },
    { id: 'coach-notes', label: 'Coach Notes', shortLabel: 'Coach', count: coachNotesCount },
    { id: 'history', label: 'History', shortLabel: 'History', count: historyCount }
  ];

  return (
    <div className="border-b border-professional-gray-200 bg-professional-gray-50 flex-shrink-0">
      <nav className="flex space-x-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-netsurit-red text-netsurit-red bg-white'
                : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
            }`}
            aria-label={`Switch to ${tab.label} tab`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {tab.count !== undefined && (
              <span className="ml-1">({tab.count})</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

DreamTabNavigation.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  totalGoals: PropTypes.number.isRequired,
  coachNotesCount: PropTypes.number.isRequired,
  historyCount: PropTypes.number.isRequired
};

export default DreamTabNavigation;
