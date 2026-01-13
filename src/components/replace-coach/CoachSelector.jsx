import { Search, Crown, UserCheck } from 'lucide-react';

/**
 * Searchable list for selecting a replacement coach
 */
export default function CoachSelector({
  searchTerm,
  setSearchTerm,
  filteredReplacements,
  selectedReplacementId,
  setSelectedReplacementId
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-professional-gray-700 mb-3">
        Select New Coach
      </label>
      
      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-professional-gray-400 w-4 h-4" aria-hidden="true" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or office..."
          className="w-full pl-10 pr-4 py-2.5 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
          aria-label="Search for replacement coach"
        />
      </div>

      {/* Results List */}
      <div className="max-h-48 overflow-y-auto border border-professional-gray-200 rounded-lg bg-white">
        {filteredReplacements.length === 0 ? (
          <div className="p-4 text-center text-professional-gray-500">
            {searchTerm.trim() ? 'No users found matching your search' : 'No available replacements'}
          </div>
        ) : (
          filteredReplacements.map(replacement => (
            <div
              key={replacement.id}
              onClick={() => setSelectedReplacementId(replacement.id)}
              className={`p-3 border-b border-professional-gray-100 cursor-pointer hover:bg-professional-gray-50 transition-all duration-200 ${
                selectedReplacementId === replacement.id ? 'bg-netsurit-red/10 border-l-4 border-l-netsurit-red' : ''
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedReplacementId(replacement.id);
                }
              }}
              aria-label={`Select ${replacement.name} as replacement coach`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={replacement.avatar}
                  alt={replacement.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-professional-gray-100 flex-shrink-0"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(replacement.name)}&background=6366f1&color=fff&size=40`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {replacement.role === 'coach' ? (
                      <Crown className="w-4 h-4 text-netsurit-red flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-professional-gray-400 flex-shrink-0" aria-hidden="true" />
                    )}
                    <h4 className="font-medium text-professional-gray-900 truncate">{replacement.name}</h4>
                  </div>
                  <p className="text-sm text-professional-gray-600 truncate">{replacement.office}</p>
                  {replacement.role === 'coach' && replacement.teamMetrics?.teamSize > 0 && (
                    <p className="text-xs text-netsurit-red mt-0.5">Current team: {replacement.teamMetrics.teamSize} members</p>
                  )}
                  {replacement.role !== 'coach' && (
                    <p className="text-xs text-netsurit-orange mt-0.5 font-medium">Will be promoted to coach</p>
                  )}
                </div>
                {selectedReplacementId === replacement.id && (
                  <div className="w-5 h-5 bg-gradient-to-r from-netsurit-red to-netsurit-coral rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-netsurit-red/20">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
