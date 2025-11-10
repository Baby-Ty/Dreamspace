// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import PropTypes from 'prop-types';
import { Users2, Target, Heart, Eye, Filter, ArrowUpDown } from 'lucide-react';
import FlagIcon from '../FlagIcon';
import { getCountryCode } from '../../utils/regionUtils';

/**
 * Pure presentational component for displaying team member list
 * @param {Array} members - Array of team member objects
 * @param {string} filterStatus - Current filter ('all', 'excelling', 'on-track', 'needs-attention')
 * @param {Function} onFilterChange - Callback for filter change (status) => void
 * @param {string} sortBy - Current sort ('score', 'name', 'dreams', 'connects')
 * @param {Function} onSortChange - Callback for sort change (sortKey) => void
 * @param {Function} onViewMember - Callback when member is clicked (member) => void
 * @param {Function} getStatusColor - Function to get status color class (score) => string
 * @param {Function} getStatusText - Function to get status text (score) => string
 */
function TeamMemberList({
  members,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange,
  onViewMember,
  getStatusColor,
  getStatusText
}) {
  const filterOptions = [
    { value: 'all', label: 'All Members' },
    { value: 'excelling', label: 'Excelling' },
    { value: 'on-track', label: 'On Track' },
    { value: 'needs-attention', label: 'Needs Attention' }
  ];

  const sortOptions = [
    { value: 'score', label: 'Score' },
    { value: 'name', label: 'Name' },
    { value: 'dreams', label: 'Dreams' },
    { value: 'connects', label: 'Connects' }
  ];

  if (!members || members.length === 0) {
    return (
      <div 
        className="text-center py-12 text-professional-gray-500"
        data-testid="team-member-list-empty"
      >
        <Users2 className="w-16 h-16 mx-auto mb-4 text-professional-gray-300" />
        <h3 className="text-lg font-semibold text-professional-gray-900 mb-2">
          No team members found
        </h3>
        <p className="text-sm">
          {filterStatus !== 'all' 
            ? 'Try changing the filter to see more members.'
            : 'This coach doesn\'t have any team members yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="team-member-list">
      {/* Filters and Sort */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-professional-gray-50 p-4 rounded-xl border border-professional-gray-200"
        data-testid="member-filters"
      >
        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-professional-gray-600" aria-hidden="true" />
          <label htmlFor="status-filter" className="text-sm font-medium text-professional-gray-700">
            Filter:
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-1.5 border border-professional-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
            data-testid="filter-select"
            aria-label="Filter team members by status"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-professional-gray-600" aria-hidden="true" />
          <label htmlFor="sort-by" className="text-sm font-medium text-professional-gray-700">
            Sort by:
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-1.5 border border-professional-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
            data-testid="sort-select"
            aria-label="Sort team members by"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-professional-gray-600" data-testid="member-count">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Member List */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        role="list"
        aria-label="Team members"
      >
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl border border-professional-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => onViewMember(member)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onViewMember(member);
              }
            }}
            role="listitem"
            tabIndex={0}
            aria-label={`View ${member.name}'s profile. Score: ${member.score || 0}, Dreams: ${member.dreamsCount || 0}, Connects: ${member.connectsCount || 0}`}
            data-testid={`member-card-${member.id}`}
          >
            {/* Member Header */}
            <div className="p-4 border-b border-professional-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <img
                    src={member.avatar}
                    alt={`${member.name}'s avatar`}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-white"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=48`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-professional-gray-900 truncate group-hover:text-netsurit-red transition-colors">
                      {member.name}
                    </h4>
                    <p className="text-xs text-professional-gray-600 truncate flex items-center gap-1">
                      <FlagIcon countryCode={getCountryCode(member.office)} className="w-3 h-3" />
                      {member.office}
                    </p>
                  </div>
                </div>
                <Eye className="w-4 h-4 text-professional-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </div>
            </div>

            {/* Member Stats */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center" data-testid={`member-${member.id}-score`}>
                  <div className="text-lg font-bold text-professional-gray-900">
                    {member.score || 0}
                  </div>
                  <div className="text-xs text-professional-gray-600">Score</div>
                </div>
                <div className="text-center" data-testid={`member-${member.id}-dreams`}>
                  <div className="text-lg font-bold text-professional-gray-900 flex items-center justify-center">
                    <Target className="w-4 h-4 mr-1 text-netsurit-coral" aria-hidden="true" />
                    {member.dreamsCount || 0}
                  </div>
                  <div className="text-xs text-professional-gray-600">Dreams</div>
                </div>
                <div className="text-center" data-testid={`member-${member.id}-connects`}>
                  <div className="text-lg font-bold text-professional-gray-900 flex items-center justify-center">
                    <Heart className="w-4 h-4 mr-1 text-netsurit-red" aria-hidden="true" />
                    {member.connectsCount || 0}
                  </div>
                  <div className="text-xs text-professional-gray-600">Connects</div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(member.score)}`}
                  data-testid={`member-${member.id}-status`}
                  aria-label={`Status: ${getStatusText(member.score)}`}
                >
                  {getStatusText(member.score)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

TeamMemberList.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string,
      office: PropTypes.string,
      score: PropTypes.number,
      dreamsCount: PropTypes.number,
      connectsCount: PropTypes.number
    })
  ).isRequired,
  filterStatus: PropTypes.oneOf(['all', 'excelling', 'on-track', 'needs-attention']).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  sortBy: PropTypes.oneOf(['score', 'name', 'dreams', 'connects']).isRequired,
  onSortChange: PropTypes.func.isRequired,
  onViewMember: PropTypes.func.isRequired,
  getStatusColor: PropTypes.func.isRequired,
  getStatusText: PropTypes.func.isRequired
};

export default TeamMemberList;
