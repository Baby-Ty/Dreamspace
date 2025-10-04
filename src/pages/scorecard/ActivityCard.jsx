// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';

/**
 * Pure presentational component for displaying an activity score card
 * @param {string} title - Card title
 * @param {number} count - Number of activities
 * @param {number} points - Total points earned
 * @param {number} pointsEach - Points per activity
 * @param {Component} icon - Lucide icon component
 * @param {string} color - Text color class
 * @param {string} bgColor - Background color class
 */
function ActivityCard({ title, count, points, pointsEach, icon: Icon, color, bgColor }) {
  return (
    <div 
      className="p-4 rounded-xl border border-professional-gray-200 hover:shadow-sm transition-all duration-200 hover:scale-[1.02]"
      data-testid={`activity-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      role="article"
      aria-label={`${title}: ${count} activities, ${points} points`}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`} aria-hidden="true">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-professional-gray-900 text-sm truncate">{title}</h4>
          <p className="text-xs text-professional-gray-500">
            {count} {count === 1 ? 'activity' : 'activities'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-professional-gray-600">
          {pointsEach} pts each
        </span>
        <span className={`text-lg font-bold ${color}`}>
          {points}
        </span>
      </div>
    </div>
  );
}

ActivityCard.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  points: PropTypes.number.isRequired,
  pointsEach: PropTypes.number.isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
  bgColor: PropTypes.string.isRequired
};

export default ActivityCard;

