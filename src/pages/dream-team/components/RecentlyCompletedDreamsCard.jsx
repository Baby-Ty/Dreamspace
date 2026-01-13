// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';
import { Award } from 'lucide-react';

/**
 * RecentlyCompletedDreamsCard - Display recently completed dreams from team
 * @component
 */
export function RecentlyCompletedDreamsCard({ recentlyCompletedDreams }) {
  if (!recentlyCompletedDreams || recentlyCompletedDreams.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-5 border border-professional-gray-200" data-testid="recently-completed-dreams-card">
      <div className="flex items-center mb-3">
        <Award className="h-5 w-5 text-netsurit-orange mr-2" aria-hidden="true" />
        <h3 className="text-sm font-bold text-professional-gray-900 uppercase tracking-wide">
          Recently Completed Dreams
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentlyCompletedDreams.map((dream, idx) => (
          <div
            key={idx}
            className="p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200"
            data-testid={`completed-dream-${idx}`}
          >
            <p className="text-sm font-semibold text-professional-gray-900 mb-1">
              {dream.title}
            </p>
            <p className="text-xs text-professional-gray-600">
              {dream.memberName}
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 bg-netsurit-orange/10 text-netsurit-orange text-xs rounded-full">
              {dream.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

RecentlyCompletedDreamsCard.propTypes = {
  recentlyCompletedDreams: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      memberName: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired
    })
  )
};

export default RecentlyCompletedDreamsCard;
