// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';

/**
 * Pure presentational component for displaying dream progress
 * @param {string} title - Card title
 * @param {number} totalDreams - Total number of dreams
 * @param {number} averageProgress - Average progress percentage
 * @param {Component} icon - Lucide icon component
 * @param {string} color - Text color class
 * @param {string} bgColor - Background color class
 */
function ProgressCard({ title, totalDreams, averageProgress, icon: Icon, color, bgColor }) {
  return (
    <div 
      className="p-4 rounded-xl border border-professional-gray-200 hover:shadow-sm transition-all duration-200 hover:scale-[1.02]"
      data-testid="progress-card"
      role="article"
      aria-label={`${title}: ${totalDreams} dreams, ${averageProgress}% average progress`}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`} aria-hidden="true">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-professional-gray-900 text-sm truncate">{title}</h4>
          <p className="text-xs text-professional-gray-500">
            {totalDreams} {totalDreams === 1 ? 'dream' : 'dreams'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-professional-gray-600">
          Average progress
        </span>
        <span className={`text-lg font-bold ${color}`}>
          {averageProgress}%
        </span>
      </div>
    </div>
  );
}

ProgressCard.propTypes = {
  title: PropTypes.string.isRequired,
  totalDreams: PropTypes.number.isRequired,
  averageProgress: PropTypes.number.isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
  bgColor: PropTypes.string.isRequired
};

export default ProgressCard;

