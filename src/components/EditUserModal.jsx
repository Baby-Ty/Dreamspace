import { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Edit User Modal for People Dashboard
 * Simpler admin-focused modal for editing user details
 */
const EditUserModal = ({ user, coaches, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: user.name || '',
    title: user.title || '',
    manager: user.manager || '',
    office: user.office || '',
    roles: {
      admin: user.roles?.admin || false,
      coach: user.roles?.coach || user.isCoach || false,
      employee: user.roles?.employee !== false, // Default true
      people: user.roles?.people || false
    },
    assignedCoachId: user.assignedCoachId || '',
    teamName: user.teamName || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleCheckboxChange = (role) => {
    setFormData(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [role]: !prev.roles[role]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await onSave({
        ...formData,
        name: formData.displayName,
        isCoach: formData.roles.coach
      });
    } finally {
      setIsSaving(false);
    }
  };

  const regionOptions = [
    'South Africa',
    'United States', 
    'Mexico',
    'Brazil',
    'Poland',
    'Remote'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-professional-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-professional-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="p-2 text-professional-gray-400 hover:text-professional-gray-600 rounded-lg transition-colors duration-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-professional-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-full object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EC4B5C&color=fff&size=100`;
              }}
            />
            <div>
              <h3 className="text-base font-bold text-professional-gray-900">{user.name}</h3>
              <p className="text-sm text-professional-gray-600">{user.email}</p>
              <p className="text-xs text-professional-gray-500">Username: {user.email}</p>
            </div>
          </div>
        </div>

        {/* Form - Scrollable */}
        <form id="editUserForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-5">
            {/* Display Name and Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-professional-gray-700 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red text-sm"
                />
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-professional-gray-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red text-sm"
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>

            {/* Manager and Region */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="manager" className="block text-sm font-medium text-professional-gray-700 mb-1.5">
                  Manager
                </label>
                <select
                  id="manager"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white text-sm"
                >
                  <option value="">Select manager...</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.name}>
                      {coach.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-professional-gray-700 mb-1.5">
                  Region
                </label>
                <select
                  id="region"
                  value={formData.office}
                  onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white text-sm"
                >
                  <option value="">Select region...</option>
                  {regionOptions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Roles */}
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                Roles
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.admin}
                    onChange={() => handleCheckboxChange('admin')}
                    className="w-4 h-4 text-netsurit-red border-professional-gray-300 rounded focus:ring-netsurit-red"
                  />
                  <span className="text-sm text-professional-gray-700">Admin</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.coach}
                    onChange={() => handleCheckboxChange('coach')}
                    className="w-4 h-4 text-netsurit-red border-professional-gray-300 rounded focus:ring-netsurit-red"
                  />
                  <span className="text-sm text-professional-gray-700">Coach</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.employee}
                    onChange={() => handleCheckboxChange('employee')}
                    className="w-4 h-4 text-netsurit-red border-professional-gray-300 rounded focus:ring-netsurit-red"
                  />
                  <span className="text-sm text-professional-gray-700">Employee</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.people}
                    onChange={() => handleCheckboxChange('people')}
                    className="w-4 h-4 text-netsurit-red border-professional-gray-300 rounded focus:ring-netsurit-red"
                  />
                  <span className="text-sm text-professional-gray-700">People</span>
                </label>
              </div>
            </div>

            {/* Coach and Team */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="assignedCoach" className="block text-sm font-medium text-professional-gray-700 mb-1.5">
                  Coach
                </label>
                <select
                  id="assignedCoach"
                  value={formData.assignedCoachId}
                  onChange={(e) => setFormData({ ...formData, assignedCoachId: e.target.value })}
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red bg-white text-sm"
                >
                  <option value="">No coach assigned</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name} - {coach.teamName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-professional-gray-700 mb-1.5">
                  Team
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={formData.teamName || 'Team assigned based on coach'}
                  disabled
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg bg-professional-gray-50 text-professional-gray-500 text-sm"
                  placeholder="Team assigned based on coach"
                />
              </div>
            </div>

            {/* Non-editable SSO info */}
            <div className="bg-professional-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-professional-gray-700 mb-3">Non-editable (SSO-synced)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-professional-gray-500 mb-1">Email:</p>
                  <p className="text-professional-gray-900 font-medium break-all">{user.email}</p>
                </div>
                <div>
                  <p className="text-professional-gray-500 mb-1">Username:</p>
                  <p className="text-professional-gray-900 font-medium break-all">{user.email}</p>
                </div>
                <div>
                  <p className="text-professional-gray-500 mb-1">Account Status:</p>
                  <p className="text-green-600 font-medium">Active</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t border-professional-gray-200 px-6 py-4 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-professional-gray-800 text-white rounded-lg hover:bg-professional-gray-900 transition-all duration-200 font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="editUserForm"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

EditUserModal.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    title: PropTypes.string,
    manager: PropTypes.string,
    office: PropTypes.string,
    roles: PropTypes.shape({
      admin: PropTypes.bool,
      coach: PropTypes.bool,
      employee: PropTypes.bool,
      people: PropTypes.bool
    }),
    isCoach: PropTypes.bool,
    assignedCoachId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    teamName: PropTypes.string
  }).isRequired,
  coaches: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default EditUserModal;
