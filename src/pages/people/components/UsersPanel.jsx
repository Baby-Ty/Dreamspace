import React from 'react';
import PropTypes from 'prop-types';
import { Search, X, Edit3, Crown, ArrowRight, UserPlus, RotateCcw, Trash2 } from 'lucide-react';
import FlagIcon from '../../../components/FlagIcon';
import { getCountryCode } from '../../../utils/regionUtils';

export function UsersPanel({ 
  displayedUsers, 
  userFilter, 
  onFilterChange, 
  userSearchTerm, 
  onUserSearchChange, 
  onEditUser, 
  onPromoteUser, 
  onAssignUser,
  onReactivateUser,
  onDeleteUser,
  currentUserId
}) {
  const isDeactivatedView = userFilter === 'deactivated';
  
  const getTitle = () => {
    switch (userFilter) {
      case 'all':
        return 'All Users';
      case 'deactivated':
        return 'Deactivated Users';
      case 'unassigned':
      default:
        return 'Unassigned Users';
    }
  };

  const getPlaceholder = () => {
    switch (userFilter) {
      case 'all':
        return 'Search all users...';
      case 'deactivated':
        return 'Search deactivated users...';
      case 'unassigned':
      default:
        return 'Search unassigned users...';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-professional-gray-200 p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-xl font-bold text-professional-gray-900 flex-shrink-0">{getTitle()}</h2>
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-professional-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" aria-hidden="true" />
              <input 
                type="text" 
                placeholder={getPlaceholder()} 
                value={userSearchTerm} 
                onChange={(e) => onUserSearchChange(e.target.value)} 
                className="w-full pl-9 pr-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm" 
                aria-label={getPlaceholder()} 
              />
              {userSearchTerm && (
                <button 
                  onClick={() => onUserSearchChange('')} 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-professional-gray-400 hover:text-netsurit-red transition-colors duration-200" 
                  title="Clear search" 
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* 3-Way Filter Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => onFilterChange('unassigned')} 
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              userFilter === 'unassigned' 
                ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white hover:from-netsurit-coral hover:to-netsurit-orange' 
                : 'bg-professional-gray-100 text-professional-gray-700 hover:bg-professional-gray-200'
            }`}
            aria-label="Show unassigned users"
          >
            Unassigned
          </button>
          <button 
            onClick={() => onFilterChange('all')} 
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              userFilter === 'all' 
                ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white hover:from-netsurit-coral hover:to-netsurit-orange' 
                : 'bg-professional-gray-100 text-professional-gray-700 hover:bg-professional-gray-200'
            }`}
            aria-label="Show all users"
          >
            All Users
          </button>
          <button 
            onClick={() => onFilterChange('deactivated')} 
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              userFilter === 'deactivated' 
                ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white hover:from-netsurit-coral hover:to-netsurit-orange' 
                : 'bg-professional-gray-100 text-professional-gray-700 hover:bg-professional-gray-200'
            }`}
            aria-label="Show deactivated users"
          >
            Deactivated
          </button>
        </div>
      </div>

      <div className="space-y-3" role="list" aria-label="User list">
        {displayedUsers.map((user) => (
          <div 
            key={user.id} 
            className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
              isDeactivatedView ? 'border-red-200 bg-red-50/30' : 'border-professional-gray-200'
            }`} 
            role="listitem"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className={`w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ${
                    isDeactivatedView ? 'ring-red-200 opacity-60' : 'ring-professional-gray-200'
                  }`}
                  onError={(e) => { 
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EC4B5C&color=fff&size=100`; 
                  }} 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-base font-semibold truncate ${
                      isDeactivatedView ? 'text-professional-gray-600' : 'text-professional-gray-900'
                    }`}>
                      {user.name}
                    </h4>
                    {!isDeactivatedView && (
                      <button 
                        onClick={() => onEditUser(user)} 
                        className="p-1 text-professional-gray-400 hover:text-netsurit-red hover:bg-netsurit-red/10 rounded transition-colors duration-200" 
                        title="Edit user" 
                        aria-label={`Edit ${user.name}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {isDeactivatedView && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                        Deactivated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-sm text-professional-gray-600 mt-1">
                    {user.email && (
                      <span className="truncate">{user.email}</span>
                    )}
                    {user.office && (
                      <span className="flex items-center gap-1.5">
                        <FlagIcon countryCode={getCountryCode(user.office)} className="w-4 h-4" />
                        {user.office}
                      </span>
                    )}
                    {!isDeactivatedView && (
                      <>
                        <span className="text-professional-gray-700">{user.score || 0}pts</span>
                        <span className="text-professional-gray-700">{user.dreamsCount || 0} dreams</span>
                        <span className="text-professional-gray-700">{user.connectsCount || 0} connects</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Conditional Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isDeactivatedView ? (
                  <>
                    <button 
                      onClick={() => onReactivateUser(user.id)} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-professional-gray-700 text-white text-xs font-medium rounded-md hover:bg-professional-gray-800 transition-all duration-200" 
                      title="Reactivate user"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reactivate
                    </button>
                    <button 
                      onClick={() => onDeleteUser(user)} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md" 
                      title="Permanently delete user"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => onPromoteUser(user)} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white text-xs font-medium rounded-md hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-sm hover:shadow-md" 
                      title="Promote to coach"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Promote
                    </button>
                    <button 
                      onClick={() => onAssignUser(user)} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-professional-gray-700 text-white text-xs font-medium rounded-md hover:bg-professional-gray-800 transition-all duration-200" 
                      title="Assign to coach"
                    >
                      Assign to Coach
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
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
                <p className="text-professional-gray-500">No {getTitle().toLowerCase()} match "{userSearchTerm}"</p>
                <button onClick={() => onUserSearchChange('')} className="mt-3 text-sm text-netsurit-red hover:text-netsurit-coral transition-colors duration-200">Clear search</button>
              </>
            ) : (
              <>
                <UserPlus className="w-16 h-16 text-professional-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-professional-gray-900 mb-2">
                  {isDeactivatedView ? 'No deactivated users' : userFilter === 'all' ? 'No users found' : 'All users assigned'}
                </h3>
                <p className="text-professional-gray-500">
                  {isDeactivatedView 
                    ? 'There are no deactivated users in the system' 
                    : userFilter === 'all' 
                      ? 'There are no users in the system' 
                      : 'Every user is either a coach or assigned to a team'}
                </p>
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
  userFilter: PropTypes.oneOf(['unassigned', 'all', 'deactivated']).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  userSearchTerm: PropTypes.string.isRequired,
  onUserSearchChange: PropTypes.func.isRequired,
  onEditUser: PropTypes.func.isRequired,
  onPromoteUser: PropTypes.func.isRequired,
  onAssignUser: PropTypes.func.isRequired,
  onReactivateUser: PropTypes.func.isRequired,
  onDeleteUser: PropTypes.func.isRequired,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default UsersPanel;