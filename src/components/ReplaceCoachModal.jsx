import React, { useState } from 'react';
import { X, Users2, AlertTriangle, ArrowRight, Crown } from 'lucide-react';

const ReplaceCoachModal = ({ coach, availableReplacements, onClose, onConfirm }) => {
  const [selectedReplacementId, setSelectedReplacementId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');

  const selectedReplacement = availableReplacements.find(r => r.id === selectedReplacementId);

  const handleConfirm = () => {
    if (selectedReplacementId) {
      onConfirm(coach.id, selectedReplacementId, newTeamName || null);
    }
  };

  // Filter out the current coach from available replacements
  const validReplacements = availableReplacements.filter(r => r.id !== coach.id);

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

          {/* Replacement Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-professional-gray-900 mb-3">
              Select New Coach
            </label>
            <select
              value={selectedReplacementId}
              onChange={(e) => setSelectedReplacementId(e.target.value)}
              className="w-full p-3 border border-professional-gray-300 rounded-lg focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
            >
              <option value="">Choose a replacement...</option>
              <optgroup label="Existing Coaches">
                {validReplacements.filter(r => r.role === 'coach').map(replacement => (
                  <option key={replacement.id} value={replacement.id}>
                    👑 {replacement.name} ({replacement.office})
                    {replacement.teamMetrics?.teamSize > 0 ? ` - ${replacement.teamMetrics.teamSize} current members` : ' - No current team'}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Users (will be promoted)">
                {validReplacements.filter(r => r.role !== 'coach').map(replacement => (
                  <option key={replacement.id} value={replacement.id}>
                    👤 {replacement.name} ({replacement.office}) - Will be promoted to coach
                  </option>
                ))}
              </optgroup>
            </select>
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
                    <li>• <strong>{coach.name}</strong> will {coach.teamMetrics?.teamSize > 1 ? 'lose coaching role' : 'become a regular user'}</li>
                    <li>• <strong>{selectedReplacement.name}</strong> will become the new coach</li>
                    <li>• All {coach.teamMetrics?.teamSize || 0} team members will be reassigned</li>
                    {selectedReplacement.role === 'coach' && selectedReplacement.teamMetrics?.teamSize > 0 && (
                      <li>• Teams will be merged (total: {(coach.teamMetrics?.teamSize || 0) + (selectedReplacement.teamMetrics?.teamSize || 0)} members)</li>
                    )}
                    {selectedReplacement.role !== 'coach' && (
                      <li>• <strong>{selectedReplacement.name}</strong> will be promoted to coach role</li>
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
              disabled={!selectedReplacementId}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedReplacementId
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
