// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import React, { useState, useMemo } from 'react';
import { X, Users2, AlertTriangle, ArrowRight, Crown, Search, UserCheck, UserX } from 'lucide-react';

const ReplaceCoachModal = ({ coach, availableReplacements, coaches, onClose, onConfirm }) => {
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [demoteCoachOption, setDemoteCoachOption] = useState('unassigned'); // 'unassigned', 'assign-to-team', 'disband-team'
  const [assignToTeamId, setAssignToTeamId] = useState('');

  const selectedReplacement = availableReplacements.find(r => r.id === selectedReplacementId);

  // Filter and search functionality
  const filteredReplacements = useMemo(() => {
    const validReplacements = availableReplacements.filter(r => r.id !== coach.id);
    
    if (!searchTerm.trim()) {
      return validReplacements;
    }
    
    return validReplacements.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.office.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableReplacements, coach.id, searchTerm]);

  // Available coaches for team assignment (excluding current coach being replaced)
  const availableCoachesForAssignment = coaches.filter(c => c.id !== coach.id);

  const handleConfirm = () => {
    // For disband team, no replacement is needed
    if (demoteCoachOption === 'disband-team') {
      onConfirm(
        coach.id, 
        null, // No replacement coach
        null, // No team name
        demoteCoachOption,
        null
      );
    } else if (selectedReplacementId) {
      onConfirm(
        coach.id, 
        selectedReplacementId, 
        newTeamName || null,
        demoteCoachOption,
        assignToTeamId || null
      );
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-coach-modal-title"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-professional-gray-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="replace-coach-modal"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-white flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="p-2 bg-gradient-to-br from-netsurit-red to-netsurit-coral rounded-lg flex-shrink-0">
                <Users2 className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 
                  id="replace-coach-modal-title"
                  className="text-xl font-bold text-professional-gray-900"
                >
                  Replace Team Coach
                </h2>
                <p className="text-sm text-professional-gray-600 mt-0.5">
                  Select a new coach and choose what happens to the current coach
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-professional-gray-500 flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Current Coach Info */}
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-3">
                Current Coach
              </label>
              <div className="flex items-center space-x-4 p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
                <img
                  src={coach.avatar}
                  alt={coach.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white flex-shrink-0"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=6366f1&color=fff&size=48`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-netsurit-red flex-shrink-0" aria-hidden="true" />
                    <h4 className="font-semibold text-professional-gray-900 truncate">{coach.name}</h4>
                  </div>
                  <p className="text-sm text-professional-gray-600 truncate">{coach.teamName}</p>
                  <p className="text-sm text-professional-gray-500">{coach.teamMetrics?.teamSize || 0} team members</p>
                </div>
              </div>
            </div>

            {/* Replacement Search - Only show if not disbanding team */}
            {demoteCoachOption !== 'disband-team' && (
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
            )}

            {/* Coach Demotion Options */}
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-3">
                What should happen to {coach.name}?
              </label>
              <div className="space-y-3">
                {/* Option 1: Unassigned */}
                <div 
                  onClick={() => setDemoteCoachOption('unassigned')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    demoteCoachOption === 'unassigned' 
                      ? 'border-netsurit-red bg-netsurit-red/5 shadow-sm' 
                      : 'border-professional-gray-200 hover:border-professional-gray-300 hover:bg-professional-gray-50'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDemoteCoachOption('unassigned');
                    }
                  }}
                  aria-label="Move coach to unassigned pool"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      demoteCoachOption === 'unassigned' ? 'border-netsurit-red bg-netsurit-red' : 'border-professional-gray-300 bg-white'
                    }`}>
                      {demoteCoachOption === 'unassigned' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-professional-gray-900 mb-1">Move to Unassigned</h4>
                      <p className="text-sm text-professional-gray-600">Becomes a regular user in the unassigned pool</p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Assign to Team */}
                <div 
                  onClick={() => setDemoteCoachOption('assign-to-team')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    demoteCoachOption === 'assign-to-team' 
                      ? 'border-netsurit-red bg-netsurit-red/5 shadow-sm' 
                      : 'border-professional-gray-200 hover:border-professional-gray-300 hover:bg-professional-gray-50'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDemoteCoachOption('assign-to-team');
                    }
                  }}
                  aria-label="Assign coach to another team"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      demoteCoachOption === 'assign-to-team' ? 'border-netsurit-red bg-netsurit-red' : 'border-professional-gray-300 bg-white'
                    }`}>
                      {demoteCoachOption === 'assign-to-team' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-professional-gray-900 mb-1">Assign to Another Team</h4>
                      <p className="text-sm text-professional-gray-600">Becomes a team member under another coach</p>
                    </div>
                  </div>
                </div>

                {/* Option 3: Disband Team */}
                <div 
                  onClick={() => {
                    setDemoteCoachOption('disband-team');
                    setSelectedReplacementId(''); // Clear replacement selection
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    demoteCoachOption === 'disband-team' 
                      ? 'border-netsurit-red bg-netsurit-red/5 shadow-sm' 
                      : 'border-professional-gray-200 hover:border-professional-gray-300 hover:bg-professional-gray-50'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDemoteCoachOption('disband-team');
                      setSelectedReplacementId('');
                    }
                  }}
                  aria-label="Disband team and move all members to unassigned"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      demoteCoachOption === 'disband-team' ? 'border-netsurit-red bg-netsurit-red' : 'border-professional-gray-300 bg-white'
                    }`}>
                      {demoteCoachOption === 'disband-team' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-professional-gray-900">Disband Team</h4>
                        <UserX className="w-4 h-4 text-professional-gray-400" aria-hidden="true" />
                      </div>
                      <p className="text-sm text-professional-gray-600">
                        Move <strong>all team members and coach</strong> to unassigned pool
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Selection (if assign-to-team is selected) */}
                {demoteCoachOption === 'assign-to-team' && (
                  <div className="ml-7 mt-3">
                    <select
                      value={assignToTeamId}
                      onChange={(e) => setAssignToTeamId(e.target.value)}
                      className="w-full p-2.5 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 bg-white"
                      aria-label="Select team to assign coach to"
                    >
                      <option value="">Select a team to join...</option>
                      {availableCoachesForAssignment.map(availableCoach => (
                        <option key={availableCoach.id} value={availableCoach.id}>
                          👑 {availableCoach.name}'s Team ({availableCoach.teamMetrics?.teamSize || 0} members)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* New Team Name (Optional) - Only show if not disbanding team */}
            {demoteCoachOption !== 'disband-team' && (
            <div>
              <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                New Team Name (Optional)
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder={selectedReplacement ? `${selectedReplacement.name}'s Team` : 'Leave blank for default'}
                className="w-full p-2.5 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
                aria-label="New team name"
              />
              <p className="text-xs text-professional-gray-500 mt-1.5">
                If left blank, will default to "{selectedReplacement?.name || 'New Coach'}'s Team"
              </p>
            </div>
            )}

            {/* Preview of Changes */}
            {(selectedReplacement || demoteCoachOption === 'disband-team') && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">What will happen:</h4>
                    <ul className="text-sm text-blue-700 space-y-1.5">
                      {demoteCoachOption === 'disband-team' ? (
                        <>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span><strong>{coach.teamName}</strong> will be disbanded and deleted</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span><strong>{coach.name}</strong> will be demoted and move to unassigned pool</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>All <strong>{coach.teamMetrics?.teamSize || 0} team members</strong> will move to unassigned pool</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>No replacement coach will be assigned</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span><strong>{selectedReplacement.name}</strong> will become the new coach</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>All {coach.teamMetrics?.teamSize || 0} team members will be reassigned</span>
                          </li>
                          {selectedReplacement.role === 'coach' && selectedReplacement.teamMetrics?.teamSize > 0 && (
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Teams will be merged (total: {(coach.teamMetrics?.teamSize || 0) + (selectedReplacement.teamMetrics?.teamSize || 0)} members)</span>
                            </li>
                          )}
                          {selectedReplacement.role !== 'coach' && (
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span><strong>{selectedReplacement.name}</strong> will be promoted to coach role</span>
                            </li>
                          )}
                          {demoteCoachOption === 'unassigned' && (
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span><strong>{coach.name}</strong> will move to the unassigned users pool</span>
                            </li>
                          )}
                          {demoteCoachOption === 'assign-to-team' && assignToTeamId && (
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span><strong>{coach.name}</strong> will join <strong>{availableCoachesForAssignment.find(c => c.id === assignToTeamId)?.name}'s</strong> team as a member</span>
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-50/50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">Important</h4>
                  <p className="text-sm text-amber-700">
                    This action cannot be undone. The team structure will be permanently changed and all members will be notified of the new coaching assignment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 sm:p-6 border-t border-professional-gray-200 bg-professional-gray-50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-professional-gray-700 bg-white border border-professional-gray-300 hover:bg-professional-gray-50 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-professional-gray-500"
                aria-label="Cancel and close modal"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={
                  demoteCoachOption === 'disband-team' 
                    ? false 
                    : (!selectedReplacementId || (demoteCoachOption === 'assign-to-team' && !assignToTeamId))
                }
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  (demoteCoachOption === 'disband-team' || (selectedReplacementId && (demoteCoachOption !== 'assign-to-team' || assignToTeamId)))
                    ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral hover:from-netsurit-coral hover:to-netsurit-orange text-white shadow-md hover:shadow-lg focus:ring-netsurit-red'
                    : 'bg-professional-gray-300 text-professional-gray-500 cursor-not-allowed'
                }`}
                aria-label={demoteCoachOption === 'disband-team' ? 'Disband team' : 'Replace coach'}
              >
                {demoteCoachOption === 'disband-team' ? 'Disband Team' : 'Replace Coach'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplaceCoachModal;
