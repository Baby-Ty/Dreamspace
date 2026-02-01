import { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Delete Confirmation Modal for Permanent User Deletion
 * Requires typing user's name to confirm deletion
 */
const DeleteConfirmationModal = ({ user, onClose, onConfirm, isDeleting }) => {
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that user typed the exact name
    if (confirmName.trim() !== user.name.trim()) {
      setError(`Please type "${user.name}" exactly to confirm deletion`);
      return;
    }

    setError('');
    await onConfirm(user.id);
  };

  const isConfirmValid = confirmName.trim() === user.name.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-professional-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-professional-gray-900">Delete User</h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-professional-gray-400 hover:text-professional-gray-600 rounded-lg transition-colors duration-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-3 p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-professional-gray-200"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EF4444&color=fff&size=100`;
                }}
              />
              <div>
                <h3 className="text-lg font-bold text-professional-gray-900">{user.name}</h3>
                <p className="text-sm text-professional-gray-600">{user.email}</p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-800 mb-1">This action cannot be undone!</h4>
                  <p className="text-sm text-red-700">
                    Permanently deleting this user will remove all of their data from the system. This is irreversible.
                  </p>
                </div>
              </div>
            </div>

            {/* What will be deleted */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-professional-gray-900">The following data will be permanently deleted:</h4>
              <ul className="space-y-2 text-sm text-professional-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-professional-gray-400 rounded-full"></span>
                  <span>User profile and account information</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-professional-gray-400 rounded-full"></span>
                  <span>All dreams and dream book entries ({user.dreamsCount || 0} dreams)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-professional-gray-400 rounded-full"></span>
                  <span>All connections and meaningful moments ({user.connectsCount || 0} connects)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-professional-gray-400 rounded-full"></span>
                  <span>All scoring history and points ({user.score || 0} total points)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-professional-gray-400 rounded-full"></span>
                  <span>All weekly goals and planning data</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-professional-gray-400 rounded-full"></span>
                  <span>Team assignments and relationships</span>
                </li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <label htmlFor="confirmName" className="block text-sm font-bold text-professional-gray-900">
                Type <span className="font-mono text-netsurit-red">{user.name}</span> to confirm deletion:
              </label>
              <input
                type="text"
                id="confirmName"
                value={confirmName}
                onChange={(e) => {
                  setConfirmName(e.target.value);
                  setError('');
                }}
                disabled={isDeleting}
                className="w-full px-3 py-2 border-2 border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red text-sm disabled:bg-professional-gray-100"
                placeholder={`Type "${user.name}" to confirm`}
                autoComplete="off"
              />
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            {/* Additional Warning */}
            <div className="text-xs text-professional-gray-500 italic p-3 bg-professional-gray-50 rounded">
              Note: If this user is a coach with team members, deletion will be blocked. You must replace the coach or reassign team members first.
            </div>
          </div>
        </form>

        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t border-professional-gray-200 px-6 py-4 bg-professional-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-white border border-professional-gray-300 text-professional-gray-700 rounded-lg hover:bg-professional-gray-50 transition-all duration-200 font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isDeleting || !isConfirmValid}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Permanently Delete User
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationModal.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    dreamsCount: PropTypes.number,
    connectsCount: PropTypes.number,
    score: PropTypes.number
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool
};

export default DeleteConfirmationModal;
