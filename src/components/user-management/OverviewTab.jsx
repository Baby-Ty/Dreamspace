import { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Users, 
  MapPin,
  Calendar,
  CheckCircle2,
  Edit3,
  Star
} from 'lucide-react';
import peopleService from '../../services/peopleService';
import { showToast } from '../../utils/toast';
import { logger } from '../../utils/logger';

/**
 * Overview tab component for UserManagementModal
 */
export default function OverviewTab({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: user.name || '',
    email: user.email || '',
    office: user.office || '',
    title: user.title || '',
    department: user.department || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await peopleService.updateUserProfile(user.id, editedData);

      if (result.success) {
        logger.info('user-management-modal', 'User profile updated successfully', { userId: user.id });
        showToast('Profile updated successfully', 'success');
        Object.assign(user, editedData);
        setIsEditing(false);
      } else {
        logger.error('user-management-modal', 'Failed to update user profile', { error: result.error, userId: user.id });
        showToast('Failed to update profile. Please try again.', 'error');
      }
    } catch (error) {
      logger.error('user-management-modal', 'Error updating user profile', { error: error.message, userId: user.id });
      showToast('Error updating profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      name: user.name || '',
      email: user.email || '',
      office: user.office || '',
      title: user.title || '',
      department: user.department || ''
    });
    setIsEditing(false);
  };

  const regionOptions = ['All', 'South Africa', 'United States', 'Mexico', 'Brazil', 'Poland'];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">User Overview</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-professional-gray-100 text-professional-gray-700 rounded-lg hover:bg-professional-gray-200 transition-all duration-200"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl p-4 sm:p-5">
          <h4 className="text-lg font-bold text-professional-gray-900 mb-4">Edit Profile Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={editedData.name}
                onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={editedData.email}
                onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Region / Office
              </label>
              <select
                value={editedData.office}
                onChange={(e) => setEditedData({ ...editedData, office: e.target.value })}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
              >
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={editedData.title}
                onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={editedData.department}
                onChange={(e) => setEditedData({ ...editedData, department: e.target.value })}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-light-coral/20 rounded-xl">
                <BookOpen className="w-8 h-8 text-netsurit-red" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Active Dreams</p>
                <p className="text-2xl font-bold text-professional-gray-900">{user.dreamsCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-coral/20 rounded-xl">
                <Users className="w-8 h-8 text-netsurit-coral" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Connections</p>
                <p className="text-2xl font-bold text-professional-gray-900">{user.connectsCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="p-3 bg-netsurit-orange/20 rounded-xl">
                <Star className="w-8 h-8 text-netsurit-orange" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-professional-gray-600">Total Score</p>
                <p className="text-2xl font-bold text-professional-gray-900">{user.score || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dream Categories */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
          <h4 className="text-lg font-bold text-professional-gray-900">Dream Categories</h4>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {user.dreamCategories?.map((category) => (
              <span
                key={category}
                className="px-3 py-1 bg-professional-gray-100 text-professional-gray-700 text-sm rounded-lg font-medium"
              >
                {category}
              </span>
            )) || <span className="text-professional-gray-500">No categories yet</span>}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
          <h4 className="text-lg font-bold text-professional-gray-900">Recent Activity</h4>
        </div>
        <div className="p-4 sm:p-5">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-professional-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Last login: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-professional-gray-600">
              <BookOpen className="w-4 h-4" />
              <span>Latest dream: {user.latestDreamTitle || 'No dreams yet'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}