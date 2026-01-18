import React from 'react';
import PropTypes from 'prop-types';
import { Search } from 'lucide-react';
import CoachList from '../CoachList';

export function CoachesPanel({ coaches, searchTerm, onSearchChange, onViewCoach, onUnassignUser, onReplaceCoach, onRefresh }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-professional-gray-200 p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-professional-gray-900">Coaches & Teams</h2>
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 text-professional-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" aria-hidden="true" />
              <input type="text" placeholder="Search coaches or teams..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm" aria-label="Search coaches or teams" />
            </div>
          </div>
        </div>
      </div>
      <CoachList coaches={coaches} onSelect={onViewCoach} onUnassignUser={onUnassignUser} onReplaceCoach={onReplaceCoach} onRefresh={onRefresh} />
    </div>
  );
}

CoachesPanel.propTypes = {
  coaches: PropTypes.array.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onViewCoach: PropTypes.func.isRequired,
  onUnassignUser: PropTypes.func.isRequired,
  onReplaceCoach: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default CoachesPanel;