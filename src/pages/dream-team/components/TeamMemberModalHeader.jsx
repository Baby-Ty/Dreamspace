import { X, Users2 } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Team Member Modal Header Component
 * Displays member avatar, name, role, and close button
 */
export default function TeamMemberModalHeader({ member, closeButtonRef, onClose }) {
  return (
    <div className="relative bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 text-white flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20"></div>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={member.avatar && !member.avatar.startsWith('blob:') 
                ? member.avatar 
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=64`}
              alt={`${member.name}'s profile`}
              className="w-12 h-12 rounded-full ring-2 ring-white shadow-lg object-cover"
              onError={(e) => {
                // Fallback to generated avatar if image fails to load (including blob URLs)
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=EC4B5C&color=fff&size=64`;
              }}
            />
            {member.isCoach && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border-2 border-netsurit-red rounded-full flex items-center justify-center">
                <Users2 className="w-3 h-3 text-netsurit-red" aria-hidden="true" />
              </div>
            )}
          </div>
          <div>
            <h3 id="member-modal-title" className="text-lg font-bold">
              {member.name}
            </h3>
            <p className="text-white/90 text-sm">
              {member.isCoach ? 'Dream Coach' : 'Team Member'}
            </p>
          </div>
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
          aria-label="Close modal"
          data-testid="close-modal-button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

TeamMemberModalHeader.propTypes = {
  member: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    isCoach: PropTypes.bool
  }).isRequired,
  closeButtonRef: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};
