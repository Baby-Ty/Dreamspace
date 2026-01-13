import { UserX } from 'lucide-react';

/**
 * Radio options for what happens to the demoted coach
 */
export default function DemotionOptions({
  coachName,
  demoteCoachOption,
  setDemoteCoachOption,
  setSelectedReplacementId,
  assignToTeamId,
  setAssignToTeamId,
  availableCoachesForAssignment
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-professional-gray-700 mb-3">
        What should happen to {coachName}?
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
            setSelectedReplacementId('');
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
  );
}
