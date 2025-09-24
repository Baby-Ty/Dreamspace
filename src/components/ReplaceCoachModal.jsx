import React, { useState, useMemo } from 'react';
import { X, Users2, AlertTriangle, ArrowRight, Crown, Search, UserCheck } from 'lucide-react';

const ReplaceCoachModal = ({ coach, availableReplacements, coaches, onClose, onConfirm }) => {
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [demoteCoachOption, setDemoteCoachOption] = useState('unassigned'); // 'unassigned', 'assign-to-team'
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
    if (selectedReplacementId) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-professional-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-netsurit-orange/10 rounded-lg">
              <Users2 className="w-5 h-5 text-netsurit-orange" />
            </div>
            <h2 className="text-lg font-semibold text-professional-gray-900">Replace Team Coach</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Coach Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-professional-gray-900 mb-3">Current Coach</h3>
            <div className="flex items-center space-x-4 p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
              <img
                src={coach.avatar}
                alt={coach.name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=6366f1&color=fff&size=48`;
                }}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-netsurit-red" />
                  <h4 className="font-semibold text-professional-gray-900">{coach.name}</h4>
                </div>
                <p className="text-sm text-professional-gray-600">{coach.teamName}</p>
                <p className="text-sm text-professional-gray-500">{coach.teamMetrics?.teamSize || 0} team members</p>
              </div>
            </div>
          </div>

          {/* Replacement Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-professional-gray-900 mb-3">
              Select New Coach
            </label>
            
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-professional-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or office..."
                className="w-full pl-10 pr-4 py-3 border border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
              />
            </div>

            {/* Results List */}
            <div className="max-h-48 overflow-y-auto border border-professional-gray-200 rounded-lg">
              {filteredReplacements.length === 0 ? (
                <div className="p-4 text-center text-professional-gray-500">
                  {searchTerm.trim() ? 'No users found matching your search' : 'No available replacements'}
                </div>
              ) : (
                filteredReplacements.map(replacement => (
                  <div
                    key={replacement.id}
                    onClick={() => setSelectedReplacementId(replacement.id)}
                    className={`p-3 border-b border-professional-gray-100 cursor-pointer hover:bg-professional-gray-50 transition-colors ${
                      selectedReplacementId === replacement.id ? 'bg-netsurit-red/10 border-l-4 border-l-netsurit-red' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={replacement.avatar}
                        alt={replacement.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(replacement.name)}&background=6366f1&color=fff&size=32`;
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {replacement.role === 'coach' ? (
                            <Crown className="w-4 h-4 text-netsurit-red" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-professional-gray-400" />
                          )}
                          <h4 className="font-medium text-professional-gray-900">{replacement.name}</h4>
                        </div>
                        <p className="text-sm text-professional-gray-600">{replacement.office}</p>
                        {replacement.role === 'coach' && replacement.teamMetrics?.teamSize > 0 && (
                          <p className="text-xs text-netsurit-red">Current team: {replacement.teamMetrics.teamSize} members</p>
                        )}
                        {replacement.role !== 'coach' && (
                          <p className="text-xs text-netsurit-orange">Will be promoted to coach</p>
                        )}
                      </div>
                      {selectedReplacementId === replacement.id && (
                        <div className="w-4 h-4 bg-netsurit-red rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coach Demotion Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-professional-gray-900 mb-3">
              What should happen to {coach.name}?
            </label>
            <div className="space-y-3">
              {/* Option 1: Unassigned */}
              <div 
                onClick={() => setDemoteCoachOption('unassigned')}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  demoteCoachOption === 'unassigned' 
                    ? 'border-netsurit-red bg-netsurit-red/5' 
                    : 'border-professional-gray-300 hover:bg-professional-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    demoteCoachOption === 'unassigned' ? 'border-netsurit-red bg-netsurit-red' : 'border-professional-gray-300'
                  }`}>
                    {demoteCoachOption === 'unassigned' && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                  </div>
                  <div>
                    <h4 className="font-medium text-professional-gray-900">Move to Unassigned</h4>
                    <p className="text-sm text-professional-gray-600">Becomes a regular user in the unassigned pool</p>
                  </div>
                </div>
              </div>

              {/* Option 2: Assign to Team */}
              <div 
                onClick={() => setDemoteCoachOption('assign-to-team')}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  demoteCoachOption === 'assign-to-team' 
                    ? 'border-netsurit-red bg-netsurit-red/5' 
                    : 'border-professional-gray-300 hover:bg-professional-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    demoteCoachOption === 'assign-to-team' ? 'border-netsurit-red bg-netsurit-red' : 'border-professional-gray-300'
                  }`}>
                    {demoteCoachOption === 'assign-to-team' && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>}
                  </div>
                  <div>
                    <h4 className="font-medium text-professional-gray-900">Assign to Another Team</h4>
                    <p className="text-sm text-professional-gray-600">Becomes a team member under another coach</p>
                  </div>
                </div>
              </div>

              {/* Team Selection (if assign-to-team is selected) */}
              {demoteCoachOption === 'assign-to-team' && (
                <div className="ml-7 mt-3">
                  <select
                    value={assignToTeamId}
                    onChange={(e) => setAssignToTeamId(e.target.value)}
                    className="w-full p-2 border border-professional-gray-300 rounded focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
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

          {/* New Team Name (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-professional-gray-900 mb-2">
              New Team Name (Optional)
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder={selectedReplacement ? `${selectedReplacement.name}'s Team` : 'Leave blank for default'}
              className="w-full p-3 border border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
            />
            <p className="text-xs text-professional-gray-500 mt-1">
              If left blank, will default to "{selectedReplacement?.name || 'New Coach'}'s Team"
            </p>
          </div>

          {/* Preview of Changes */}
          {selectedReplacement && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-2">What will happen:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>{selectedReplacement.name}</strong> will become the new coach</li>
                    <li>• All {coach.teamMetrics?.teamSize || 0} team members will be reassigned</li>
                    {selectedReplacement.role === 'coach' && selectedReplacement.teamMetrics?.teamSize > 0 && (
                      <li>• Teams will be merged (total: {(coach.teamMetrics?.teamSize || 0) + (selectedReplacement.teamMetrics?.teamSize || 0)} members)</li>
                    )}
                    {selectedReplacement.role !== 'coach' && (
                      <li>• <strong>{selectedReplacement.name}</strong> will be promoted to coach role</li>
                    )}
                    {demoteCoachOption === 'unassigned' && (
                      <li>• <strong>{coach.name}</strong> will move to the unassigned users pool</li>
                    )}
                    {demoteCoachOption === 'assign-to-team' && assignToTeamId && (
                      <li>• <strong>{coach.name}</strong> will join <strong>{availableCoachesForAssignment.find(c => c.id === assignToTeamId)?.name}'s</strong> team as a member</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">Important</h4>
                <p className="text-sm text-amber-700">
                  This action cannot be undone. The team structure will be permanently changed and all members will be notified of the new coaching assignment.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-professional-gray-700 bg-professional-gray-100 hover:bg-professional-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedReplacementId || (demoteCoachOption === 'assign-to-team' && !assignToTeamId)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedReplacementId && (demoteCoachOption !== 'assign-to-team' || assignToTeamId)
                  ? 'bg-netsurit-orange hover:bg-netsurit-warm-orange text-white'
                  : 'bg-professional-gray-300 text-professional-gray-500 cursor-not-allowed'
              }`}
            >
              Replace Coach
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplaceCoachModal;
