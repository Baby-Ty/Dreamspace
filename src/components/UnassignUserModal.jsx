import React from 'react';
import { X, UserMinus, AlertTriangle } from 'lucide-react';

const UnassignUserModal = ({ user, coachId, coaches, onClose, onConfirm }) => {
  const coach = coaches.find(c => c.id === coachId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-professional-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-netsurit-red/10 rounded-lg">
              <UserMinus className="w-5 h-5 text-netsurit-red" />
            </div>
            <h2 className="text-lg font-semibold text-professional-gray-900">Unassign Team Member</h2>
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
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=48`;
              }}
            />
            <div>
              <h3 className="font-semibold text-professional-gray-900">{user.name}</h3>
              <p className="text-sm text-professional-gray-600">{user.office}</p>
              <p className="text-sm text-professional-gray-500">Currently assigned to: <span className="font-medium text-netsurit-red">{coach?.name || 'Unknown Coach'}</span></p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">Are you sure?</h4>
                <p className="text-sm text-amber-700">
                  This will remove <strong>{user.name}</strong> from <strong>{coach?.name}'s</strong> team. 
                  They will become unassigned and can be reassigned to another coach later.
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
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-netsurit-red hover:bg-netsurit-coral text-white rounded-lg font-medium transition-colors"
            >
              Unassign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnassignUserModal;
