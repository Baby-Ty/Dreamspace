import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Assign User to Coach Modal
 */
const AssignUserModal = ({ user, coaches, onClose, onConfirm }) => {
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCoachId) {
      setIsSubmitting(true);
      try {
        await onConfirm(selectedCoachId);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const selectedCoach = coaches.find(c => c.id === selectedCoachId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-professional-gray-700 to-professional-gray-800 rounded-full flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-professional-gray-900">Assign to Coach</h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-professional-gray-400 hover:text-professional-gray-600 rounded-lg transition-colors duration-200"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-professional-gray-50 rounded-lg mb-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=48`;
              }}
            />
            <div>
              <p className="font-medium text-professional-gray-900">{user.name}</p>
              <p className="text-sm text-professional-gray-500">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="coachSelect" className="block text-sm font-medium text-professional-gray-700 mb-2">
                Select Coach <span className="text-netsurit-red">*</span>
              </label>
              <select
                id="coachSelect"
                value={selectedCoachId}
                onChange={(e) => setSelectedCoachId(e.target.value)}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red"
                required
                autoFocus
                disabled={isSubmitting}
              >
                <option value="">Choose a coach...</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name} - {coach.teamName} ({coach.teamMetrics?.teamSize || 0} members)
                  </option>
                ))}
              </select>
              {selectedCoach && (
                <div className="mt-3 p-3 bg-netsurit-red/10 border border-netsurit-red/20 rounded-lg">
                  <p className="text-xs text-professional-gray-700">
                    <span className="font-medium">{user.name}</span> will be added to{' '}
                    <span className="font-medium">{selectedCoach.name}'s</span> team{' '}
                    <span className="font-medium">{selectedCoach.teamName}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-professional-gray-300 text-professional-gray-700 rounded-lg hover:bg-professional-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedCoachId}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

AssignUserModal.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string
  }).isRequired,
  coaches: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    teamName: PropTypes.string,
    teamMetrics: PropTypes.shape({
      teamSize: PropTypes.number
    })
  })).isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default AssignUserModal;
