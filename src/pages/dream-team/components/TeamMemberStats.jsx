import { BookOpen, Heart } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Team Member Stats Component
 * Displays dreams count and connects count
 */
export default function TeamMemberStats({ dreamsCount, connectsCount }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-professional-gray-50 rounded-lg p-3 text-center">
        <BookOpen className="w-5 h-5 text-netsurit-red mx-auto mb-1" aria-hidden="true" />
        <p className="text-xs text-professional-gray-600">Dreams</p>
        <p className="text-lg font-bold text-professional-gray-900">
          {dreamsCount || 0}
        </p>
      </div>
      <div className="bg-professional-gray-50 rounded-lg p-3 text-center">
        <Heart className="w-5 h-5 text-netsurit-coral mx-auto mb-1" aria-hidden="true" />
        <p className="text-xs text-professional-gray-600">Connects</p>
        <p className="text-lg font-bold text-professional-gray-900">
          {connectsCount || 0}
        </p>
      </div>
    </div>
  );
}

TeamMemberStats.propTypes = {
  dreamsCount: PropTypes.number,
  connectsCount: PropTypes.number
};

TeamMemberStats.defaultProps = {
  dreamsCount: 0,
  connectsCount: 0
};
