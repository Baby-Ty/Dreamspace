
import React from 'react';
import PropTypes from 'prop-types';
import { Users2 } from 'lucide-react';
import TeamMemberCard from '../TeamMemberCard';

/**
 * TeamMembersSection - Grid display of team member cards
 * @component
 */
export function TeamMembersSection({ 
  teamMembers, 
  currentUserId, 
  isCoach, 
  onGenerateBackground,
  onViewDreamInCoachMode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-professional-gray-900">
          Team Members
        </h2>
        <p className="text-sm text-professional-gray-500">
          {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid of Team Member Cards */}
      {teamMembers.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-professional-gray-50 rounded-2xl border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-professional-gray-100 to-professional-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users2 className="w-10 h-10 text-professional-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-professional-gray-900 mb-3">
            No team members yet
          </h3>
          <p className="text-professional-gray-600 max-w-md mx-auto leading-relaxed">
            {isCoach 
              ? 'Start building your team by adding members through the People Hub.'
              : 'Your team is being set up. Check back soon!'}
          </p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          role="list"
          aria-label="Team members"
        >
          {teamMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              isCoach={isCoach}
              onGenerateBackground={onGenerateBackground}
              onViewDreamInCoachMode={onViewDreamInCoachMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

TeamMembersSection.propTypes = {
  teamMembers: PropTypes.array.isRequired,
  currentUserId: PropTypes.string,
  isCoach: PropTypes.bool.isRequired,
  onGenerateBackground: PropTypes.func.isRequired,
  onViewDreamInCoachMode: PropTypes.func.isRequired
};

export default TeamMembersSection;