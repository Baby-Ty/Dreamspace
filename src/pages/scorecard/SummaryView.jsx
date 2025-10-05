// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { Users, Target, Calendar, Activity, PieChart } from 'lucide-react';
import ActivityCard from './ActivityCard';
import ProgressCard from './ProgressCard';

/**
 * Summary/Overview view for the scorecard
 * Shows activity breakdown and quick stats
 */
function SummaryView({ categoryStats, scoringRules, totalScore }) {
  const categories = [
    {
      key: 'dreamsCompleted',
      label: 'Dreams Completed',
      stats: categoryStats.dreamsCompleted,
      icon: Target,
      color: 'text-netsurit-red',
      bgColor: 'bg-netsurit-light-coral/20'
    },
    {
      key: 'dreamConnects',
      label: 'Dream Connects',
      stats: categoryStats.dreamConnects,
      icon: Users,
      color: 'text-netsurit-coral',
      bgColor: 'bg-netsurit-coral/20'
    },
    {
      key: 'groupAttendance',
      label: 'Group Attendance',
      stats: categoryStats.groupAttendance,
      icon: Calendar,
      color: 'text-netsurit-orange',
      bgColor: 'bg-netsurit-warm-orange/20'
    },
    {
      key: 'dreamProgress',
      label: 'Dream Progress',
      stats: categoryStats.dreamProgress,
      icon: Activity,
      color: 'text-netsurit-coral',
      bgColor: 'bg-netsurit-coral/20',
      isProgress: true
    }
  ];

  const totalActivities = categories.reduce((sum, cat) => sum + cat.stats.count, 0);
  const mostActiveCategory = categories.reduce((max, cat) => 
    cat.stats.count > max.stats.count ? cat : max
  );

  return (
    <div className="space-y-6" data-testid="summary-view">
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Breakdown - Compact Cards */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-professional-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-professional-gray-900">
                Activity Breakdown
              </h3>
              <PieChart className="w-5 h-5 text-professional-gray-500" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-2 gap-4" role="list" aria-label="Activity categories">
              {categories.map((category) => {
                if (category.isProgress) {
                  return (
                    <ProgressCard
                      key={category.key}
                      title={category.label}
                      totalDreams={category.stats.count}
                      averageProgress={category.stats.points}
                      icon={category.icon}
                      color={category.color}
                      bgColor={category.bgColor}
                    />
                  );
                }
                return (
                  <ActivityCard
                    key={category.key}
                    title={category.label}
                    count={category.stats.count}
                    points={category.stats.points}
                    pointsEach={scoringRules[category.key === 'dreamsCompleted' ? 'dreamCompleted' : category.key]}
                    icon={category.icon}
                    color={category.color}
                    bgColor={category.bgColor}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div 
            className="bg-white rounded-2xl shadow-lg border border-professional-gray-200 p-6"
            role="region"
            aria-label="Quick statistics"
            data-testid="quick-stats"
          >
            <h3 className="text-lg font-semibold text-professional-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-professional-gray-600">Total Activities</span>
                <span className="font-bold text-professional-gray-900">{totalActivities}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-professional-gray-600">Average per Activity</span>
                <span className="font-bold text-professional-gray-900">
                  {totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0} pts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-professional-gray-600">Most Active</span>
                <span className="font-bold text-professional-gray-900">
                  {mostActiveCategory.label.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

SummaryView.propTypes = {
  categoryStats: PropTypes.shape({
    dreamsCompleted: PropTypes.shape({
      count: PropTypes.number.isRequired,
      points: PropTypes.number.isRequired
    }).isRequired,
    dreamConnects: PropTypes.shape({
      count: PropTypes.number.isRequired,
      points: PropTypes.number.isRequired
    }).isRequired,
    groupAttendance: PropTypes.shape({
      count: PropTypes.number.isRequired,
      points: PropTypes.number.isRequired
    }).isRequired,
    dreamProgress: PropTypes.shape({
      count: PropTypes.number.isRequired,
      points: PropTypes.number.isRequired
    }).isRequired
  }).isRequired,
  scoringRules: PropTypes.object.isRequired,
  totalScore: PropTypes.number.isRequired
};

export default SummaryView;

