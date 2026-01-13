// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { Users, Heart, BookOpen, Network } from 'lucide-react';
import HelpTooltip from '../../components/HelpTooltip';

/**
 * Header section for Dream Connect page with KPI metrics
 */
export default function DreamConnectHeader({ 
  allUsersCount, 
  connectsCount, 
  uniqueCategories 
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        {/* Title Section */}
        <div className="mb-6 lg:mb-0">
          <div className="flex items-center space-x-3 mb-2">
            <Network className="h-8 w-8 text-netsurit-red" />
            <h1 className="text-3xl font-bold text-professional-gray-900">
              Dream Connect
            </h1>
            <HelpTooltip 
              title="Dream Connect Guide"
              content="Connect with colleagues who share similar dream categories. Browse suggested connections, filter by category or location, and request a Dream Connect meeting. Complete connects earn you +5 points on your scorecard!"
            />
          </div>
          <p className="text-professional-gray-600">
            Find colleagues with shared dream categories and learn from each other
          </p>
        </div>
        
        {/* KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-netsurit-red" />
            </div>
            <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
              Dreamers
            </p>
            <p className="text-xl font-bold text-professional-gray-900">{allUsersCount || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <Heart className="h-6 w-6 text-netsurit-coral" />
            </div>
            <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
              Your Connects
            </p>
            <p className="text-xl font-bold text-professional-gray-900">
              {connectsCount || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-professional-gray-200 hover:shadow-md transition-shadow text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-6 w-6 text-netsurit-orange" />
            </div>
            <p className="text-xs font-medium text-professional-gray-500 uppercase tracking-wide">
              Categories
            </p>
            <p className="text-xl font-bold text-professional-gray-900">{uniqueCategories}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

DreamConnectHeader.propTypes = {
  allUsersCount: PropTypes.number,
  connectsCount: PropTypes.number,
  uniqueCategories: PropTypes.number
};

DreamConnectHeader.defaultProps = {
  allUsersCount: 0,
  connectsCount: 0,
  uniqueCategories: 0
};
