import { Mail, MapPin, Award, BookOpen } from 'lucide-react';
import PropTypes from 'prop-types';
import TeamMemberStats from './TeamMemberStats';
import PublicDreamCard from './PublicDreamCard';

/**
 * Team Member Modal Body Component
 * Displays member information, stats, and public dreams
 */
export default function TeamMemberModalBody({ member, isCoach, onDreamClick, publicDreams }) {
  return (
    <div className="p-6 overflow-y-auto flex-1">
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {member.email && (
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-professional-gray-400" aria-hidden="true" />
              <span className="text-sm text-professional-gray-600">{member.email}</span>
            </div>
          )}
          {member.office && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-professional-gray-400" aria-hidden="true" />
              <span className="text-sm text-professional-gray-600">{member.office}</span>
            </div>
          )}
          {member.score !== undefined && (
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-netsurit-coral" aria-hidden="true" />
              <span className="text-sm font-semibold text-professional-gray-900">
                {member.score} points
              </span>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <TeamMemberStats 
          dreamsCount={member.dreamsCount}
          connectsCount={member.connectsCount}
        />

        {/* Dream Categories */}
        {member.dreamCategories && member.dreamCategories.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-professional-gray-900 mb-2">
              Dream Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {member.dreamCategories.map((category, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-netsurit-red/10 text-netsurit-red text-sm rounded-full border border-netsurit-red/20"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Public Dreams */}
        <div>
          <h4 className="text-sm font-bold text-professional-gray-900 mb-3">
            Public Dreams
          </h4>
          {publicDreams.length === 0 ? (
            <div className="bg-professional-gray-50 rounded-lg p-4 text-center">
              <BookOpen className="w-8 h-8 text-professional-gray-400 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-professional-gray-600">
                No public dreams yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {publicDreams.map((dream) => (
                <PublicDreamCard
                  key={dream.id}
                  dream={dream}
                  isCoach={isCoach}
                  onDreamClick={onDreamClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

TeamMemberModalBody.propTypes = {
  member: PropTypes.shape({
    email: PropTypes.string,
    office: PropTypes.string,
    score: PropTypes.number,
    dreamsCount: PropTypes.number,
    connectsCount: PropTypes.number,
    dreamCategories: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  isCoach: PropTypes.bool.isRequired,
  onDreamClick: PropTypes.func.isRequired,
  publicDreams: PropTypes.arrayOf(PropTypes.object).isRequired
};
