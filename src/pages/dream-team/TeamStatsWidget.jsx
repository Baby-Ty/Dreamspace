import { Trophy, TrendingUp, MapPin, Heart, BookOpen, Target, Award } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Team Stats Widget Component
 * Displays team-level metrics in a card grid
 */
export default function TeamStatsWidget({ teamStats, teamName }) {
  if (!teamStats) return null;

  const statCards = [
    {
      icon: Trophy,
      label: 'Total Score',
      value: teamStats.totalScore || 0,
      color: 'netsurit-red'
    },
    {
      icon: TrendingUp,
      label: 'Engagement Rate',
      value: `${Math.round(teamStats.engagementRate || 0)}%`,
      color: 'netsurit-coral'
    },
    {
      icon: BookOpen,
      label: 'Total Dreams',
      value: teamStats.totalDreams || 0,
      color: 'netsurit-orange'
    },
    {
      icon: Heart,
      label: 'Total Connects',
      value: teamStats.totalConnects || 0,
      color: 'netsurit-red'
    }
  ];

  return (
    <div className="space-y-6" data-testid="team-stats-widget">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center"
              data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center justify-center mb-2">
                <Icon className={`h-6 w-6 text-${stat.color}`} aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-xl font-bold text-professional-gray-900 mt-1">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Additional Stats Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Member Regions */}
        {teamStats.memberRegions && teamStats.memberRegions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200">
            <div className="flex items-center mb-3">
              <MapPin className="h-5 w-5 text-netsurit-red mr-2" aria-hidden="true" />
              <h3 className="text-sm font-bold text-professional-gray-900">
                Member Regions
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {teamStats.memberRegions.map((region, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-professional-gray-100 text-professional-gray-700 text-sm rounded-full"
                  data-testid={`region-${idx}`}
                >
                  {region}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Shared Interests */}
        {teamStats.sharedInterests && teamStats.sharedInterests.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200">
            <div className="flex items-center mb-3">
              <Heart className="h-5 w-5 text-netsurit-coral mr-2" aria-hidden="true" />
              <h3 className="text-sm font-bold text-professional-gray-900">
                Shared Interests
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {teamStats.sharedInterests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-professional-gray-100 text-professional-gray-700 text-sm rounded-full"
                  data-testid={`interest-${idx}`}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recently Completed Dreams */}
      {teamStats.recentlyCompletedDreams && teamStats.recentlyCompletedDreams.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200">
          <div className="flex items-center mb-3">
            <Award className="h-5 w-5 text-netsurit-orange mr-2" aria-hidden="true" />
            <h3 className="text-sm font-bold text-professional-gray-900">
              Recently Completed Dreams
            </h3>
          </div>
          <div className="space-y-2">
            {teamStats.recentlyCompletedDreams.map((dream, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-professional-gray-50 rounded-lg"
                data-testid={`completed-dream-${idx}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-professional-gray-900 truncate">
                    {dream.title}
                  </p>
                  <p className="text-xs text-professional-gray-600">
                    {dream.memberName} · {dream.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals Close to Finish */}
      {teamStats.goalsCloseToFinish && teamStats.goalsCloseToFinish.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200">
          <div className="flex items-center mb-3">
            <Target className="h-5 w-5 text-netsurit-red mr-2" aria-hidden="true" />
            <h3 className="text-sm font-bold text-professional-gray-900">
              Goals Close to Finish
            </h3>
          </div>
          <div className="space-y-2">
            {teamStats.goalsCloseToFinish.map((goal, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-netsurit-red/5 rounded-lg border border-netsurit-red/10"
                data-testid={`goal-close-${idx}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-professional-gray-900 truncate">
                    {goal.goalTitle}
                  </p>
                  <p className="text-xs text-professional-gray-600">
                    {goal.memberName} · {goal.dreamTitle}
                  </p>
                </div>
                <span className="text-xs font-semibold text-netsurit-red ml-2">
                  {goal.weeksRemaining} week{goal.weeksRemaining !== 1 ? 's' : ''} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

TeamStatsWidget.propTypes = {
  teamStats: PropTypes.shape({
    totalScore: PropTypes.number,
    averageScore: PropTypes.number,
    engagementRate: PropTypes.number,
    totalDreams: PropTypes.number,
    totalConnects: PropTypes.number,
    memberRegions: PropTypes.arrayOf(PropTypes.string),
    sharedInterests: PropTypes.arrayOf(PropTypes.string),
    recentlyCompletedDreams: PropTypes.arrayOf(PropTypes.object),
    goalsCloseToFinish: PropTypes.arrayOf(PropTypes.object)
  }),
  teamName: PropTypes.string
};

TeamStatsWidget.defaultProps = {
  teamStats: null,
  teamName: ''
};
