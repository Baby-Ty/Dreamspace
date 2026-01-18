import React, { useState, useMemo } from 'react';
import { X, Users2, AlertTriangle, Crown, Sparkles } from 'lucide-react';
import { generateRandomTeamName } from '../utils/teamNameGenerator';
import { CoachSelector, DemotionOptions, ChangesPreview } from './replace-coach';

const ReplaceCoachModal = ({ coach, availableReplacements, coaches, onClose, onConfirm }) => {
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [demoteCoachOption, setDemoteCoachOption] = useState('unassigned');
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

  const availableCoachesForAssignment = coaches.filter(c => c.id !== coach.id);

  const handleConfirm = () => {
    if (demoteCoachOption === 'disband-team') {
      onConfirm(coach.id, null, null, demoteCoachOption, null);
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

  const isConfirmDisabled = demoteCoachOption === 'disband-team' 
    ? false 
    : (!selectedReplacementId || (demoteCoachOption === 'assign-to-team' && !assignToTeamId));

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
                <h2 id="replace-coach-modal-title" className="text-xl font-bold text-professional-gray-900">
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

            {/* Replacement Search */}
            {demoteCoachOption !== 'disband-team' && (
              <CoachSelector
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredReplacements={filteredReplacements}
                selectedReplacementId={selectedReplacementId}
                setSelectedReplacementId={setSelectedReplacementId}
              />
            )}

            {/* Coach Demotion Options */}
            <DemotionOptions
              coachName={coach.name}
              demoteCoachOption={demoteCoachOption}
              setDemoteCoachOption={setDemoteCoachOption}
              setSelectedReplacementId={setSelectedReplacementId}
              assignToTeamId={assignToTeamId}
              setAssignToTeamId={setAssignToTeamId}
              availableCoachesForAssignment={availableCoachesForAssignment}
            />

            {/* New Team Name (Optional) */}
            {demoteCoachOption !== 'disband-team' && (
              <div>
                <label className="block text-sm font-bold text-professional-gray-700 mb-2">
                  New Team Name (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder={selectedReplacement ? `${selectedReplacement.name}'s Team` : 'Leave blank for default'}
                    className="flex-1 p-2.5 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
                    aria-label="New team name"
                  />
                  <button
                    type="button"
                    onClick={() => setNewTeamName(generateRandomTeamName())}
                    className="p-2.5 text-netsurit-coral hover:text-netsurit-red hover:bg-netsurit-coral/10 rounded-lg transition-colors"
                    aria-label="Generate random team name"
                    title="Generate random team name"
                  >
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-professional-gray-500 mt-1.5">
                  If left blank, will default to "{selectedReplacement?.name || 'New Coach'}'s Team"
                </p>
              </div>
            )}

            {/* Preview of Changes */}
            <ChangesPreview
              coach={coach}
              selectedReplacement={selectedReplacement}
              demoteCoachOption={demoteCoachOption}
              assignToTeamId={assignToTeamId}
              availableCoachesForAssignment={availableCoachesForAssignment}
            />

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
                disabled={isConfirmDisabled}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  !isConfirmDisabled
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