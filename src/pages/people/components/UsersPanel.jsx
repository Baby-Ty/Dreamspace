import React from 'react';
import PropTypes from 'prop-types';
import { Search, X, Edit3, Crown, ArrowRight, UserPlus } from 'lucide-react';
import FlagIcon from '../../../components/FlagIcon';
import { getCountryCode } from '../../../utils/regionUtils';

export function UsersPanel({ displayedUsers, showAllUsers, onToggleShowAll, userSearchTerm, onUserSearchChange, onEditUser, onPromoteUser, onAssignUser }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-professional-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-professional-gray-900 flex-shrink-0">{showAllUsers ? 'All Users' : 'Unassigned Users'}</h2>
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-professional-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" aria-hidden="true" />
              <input type="text" placeholder={`Search ${showAllUsers ? 'all users' : 'unassigned users'}...`} value={userSearchTerm} onChange={(e) => onUserSearchChange(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm" aria-label={`Search ${showAllUsers ? 'all users' : 'unassigned users'}`} />
              {userSearchTerm && (
                <button onClick={() => onUserSearchChange('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-professional-gray-400 hover:text-netsurit-red transition-colors duration-200" title="Clear search" aria-label="Clear search">
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <button onClick={onToggleShowAll} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex-shrink-0 ${showAllUsers ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white hover:from-netsurit-coral hover:to-netsurit-orange' : 'bg-professional-gray-100 text-professional-gray-700 hover:bg-professional-gray-200'}`} aria-label={showAllUsers ? 'Show only unassigned users' : 'Show all users'}>
            {showAllUsers ? 'Show Unassigned' : 'Show All Users'}
          </button>
        </div>
      </div>

      <div className="space-y-3" role="list" aria-label="User list">
        {displayedUsers.map((user) => (
          <div key={user.id} className="bg-white border border-professional-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200" role="listitem">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-professional-gray-200" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EC4B5C&color=fff&size=100`; }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-semibold text-professional-gray-900 truncate">{user.name}</h4>
                    <button onClick={() => onEditUser(user)} className="p-1 text-professional-gray-400 hover:text-netsurit-red hover:bg-netsurit-red/10 rounded transition-colors duration-200" title="Edit user" aria-label={`Edit ${user.name}`}>
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-sm text-professional-gray-600 mt-1">
                    <span className="flex items-center gap-1.5">
                      <FlagIcon countryCode={getCountryCode(user.office)} className="w-4 h-4" />
                      {user.office}
                    </span>
                    <span className="text-professional-gray-700">{user.score || 0}pts</span>
                    <span className="text-professional-gray-700">{user.dreamsCount || 0} dreams</span>
                    <span className="text-professional-gray-700">{user.connectsCount || 0} connects</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => onPromoteUser(user)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white text-xs font-medium rounded-md hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-sm hover:shadow-md" title="Promote to coach">
                  <Crown className="w-3.5 h-3.5" />
                  Promote
                </button>
                <button onClick={() => onAssignUser(user)} className="flex items-center gap-1.5 px-3 py-1.5 bg-professional-gray-700 text-white text-xs font-medium rounded-md hover:bg-professional-gray-800 transition-all duration-200" title="Assign to coach">
                  Assign to Coach
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {displayedUsers.length === 0 && (
          <div className="text-center py-12">
            {userSearchTerm ? (
              <>
                <Search className="w-16 h-16 text-professional-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-professional-gray-900 mb-2">No users found</h3>
                <p className="text-professional-gray-500">No {showAllUsers ? 'users' : 'unassigned users'} match "{userSearchTerm}"</p>
                <button onClick={() => onUserSearchChange('')} className="mt-3 text-sm text-netsurit-red hover:text-netsurit-coral transition-colors duration-200">Clear search</button>
              </>
            ) : (
              <>
                <UserPlus className="w-16 h-16 text-professional-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-professional-gray-900 mb-2">{showAllUsers ? 'No users found' : 'All users assigned'}</h3>
                <p className="text-professional-gray-500">{showAllUsers ? 'There are no users in the system' : 'Every user is either a coach or assigned to a team'}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

UsersPanel.propTypes = {
  displayedUsers: PropTypes.array.isRequired,
  showAllUsers: PropTypes.bool.isRequired,
  onToggleShowAll: PropTypes.func.isRequired,
  userSearchTerm: PropTypes.string.isRequired,
  onUserSearchChange: PropTypes.func.isRequired,
  onEditUser: PropTypes.func.isRequired,
  onPromoteUser: PropTypes.func.isRequired,
  onAssignUser: PropTypes.func.isRequired
};

export default UsersPanel;