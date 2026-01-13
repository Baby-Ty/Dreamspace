// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React from 'react';
import PropTypes from 'prop-types';
import { 
  Users2, 
  Trophy, 
  TrendingUp, 
  BookOpen, 
  Heart 
} from 'lucide-react';
import HelpTooltip from '../../../components/HelpTooltip';

/**
 * TeamHeader - Header section with title and KPI metrics
 * @component
 */
export function TeamHeader({ teamStats }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
      {/* Title Section */}
      <div className="lg:w-1/3">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-professional-gray-900">
            Dream Team
          </h1>
          <Users2 className="h-8 w-8 text-netsurit-red" />
          <HelpTooltip 
            title="Dream Team Guide"
            content="View your team members, see their public dreams, and track team progress. Coaches can manage team meeting schedules."
          />
        </div>
        <p className="text-professional-gray-600">
          Connect with your team members and share your dream journeys
        </p>
      </div>
      
      {/* KPI Metrics */}
      <div className="lg:w-2/3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="team-kpi-cards">
          <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-6 w-6 text-netsurit-red" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
              Total Score
            </p>
            <p className="text-xl font-bold text-professional-gray-900" data-testid="kpi-total-score">
              {teamStats?.totalScore || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-netsurit-coral" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
              Engagement Rate
            </p>
            <p className="text-xl font-bold text-professional-gray-900" data-testid="kpi-engagement-rate">
              {Math.round(teamStats?.engagementRate || 0)}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-6 w-6 text-netsurit-orange" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
              Total Dreams
            </p>
            <p className="text-xl font-bold text-professional-gray-900" data-testid="kpi-total-dreams">
              {teamStats?.totalDreams || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="h-6 w-6 text-netsurit-red" aria-hidden="true" />
            </div>
            <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
              Total Connects
            </p>
            <p className="text-xl font-bold text-professional-gray-900" data-testid="kpi-total-connects">
              {teamStats?.totalConnects || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

TeamHeader.propTypes = {
  teamStats: PropTypes.shape({
    totalScore: PropTypes.number,
    engagementRate: PropTypes.number,
    totalDreams: PropTypes.number,
    totalConnects: PropTypes.number
  })
};

export default TeamHeader;
