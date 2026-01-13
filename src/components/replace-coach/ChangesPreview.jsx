import { ArrowRight } from 'lucide-react';

/**
 * Preview panel showing what will happen when changes are confirmed
 */
export default function ChangesPreview({
  coach,
  selectedReplacement,
  demoteCoachOption,
  assignToTeamId,
  availableCoachesForAssignment
}) {
  if (!selectedReplacement && demoteCoachOption !== 'disband-team') {
    return null;
  }

  return (
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
  );
}
