import React, { useState } from 'react';
import { 
  User, 
  Target, 
  TrendingUp, 
  Award, 
  Briefcase,
  Calendar,
  MapPin,
  ExternalLink,
  X,
  Edit3,
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CareerTrackerModal from '../components/CareerTrackerModal';

const CareerBook = () => {
  const { currentUser, updateCareerGoal, updateDevelopmentPlan, updateCareerProfile, addCareerHighlight, updateSkill, addSkill, addCareerGoal, addDevelopmentPlan } = useApp();
  const [activeTab, setActiveTab] = useState('my-career');
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingType, setViewingType] = useState(null); // 'goal' or 'development'

  const tabs = [
    { id: 'my-career', name: 'My Career', icon: User },
    { id: 'career-goals', name: 'Career Goals', icon: Target },
    { id: 'development-plan', name: 'Development Plan', icon: TrendingUp },
    { id: 'my-skills', name: 'My Skills', icon: Award },
  ];

  const isActiveTab = (tabId) => activeTab === tabId;

  const handleViewItem = (item, type) => {
    setViewingItem(item);
    setViewingType(type);
  };

  const handleCloseModal = () => {
    setViewingItem(null);
    setViewingType(null);
  };

  const handleUpdateItem = (updatedItem, type) => {
    if (type === 'goal') {
      updateCareerGoal(updatedItem);
    } else {
      updateDevelopmentPlan(updatedItem);
    }
    setViewingItem(null);
    setViewingType(null);
  };

  if (!currentUser) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netsurit-red mx-auto mb-4"></div>
          <p className="text-professional-gray-600">Loading Career Book...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-3 sm:space-y-3">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-3 mb-2">
              <Briefcase className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-3xl font-bold text-professional-gray-900">
                Career Book
              </h1>
            </div>
            <p className="text-professional-gray-600">
              Track your career journey, goals, and professional development
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-professional-gray-200 overflow-hidden">
        <div className="border-b border-professional-gray-200">
          <nav className="flex space-x-0" aria-label="Career Book Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActiveTab(tab.id)
                      ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white shadow-lg'
                      : 'text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5">
          {activeTab === 'my-career' && <MyCareerTab currentUser={currentUser} updateCareerProfile={updateCareerProfile} addCareerHighlight={addCareerHighlight} />}
          {activeTab === 'career-goals' && <CareerGoalsTab currentUser={currentUser} onViewItem={handleViewItem} updateCareerGoal={updateCareerGoal} addCareerGoal={addCareerGoal} />}
          {activeTab === 'development-plan' && <DevelopmentPlanTab currentUser={currentUser} onViewItem={handleViewItem} updateDevelopmentPlan={updateDevelopmentPlan} addDevelopmentPlan={addDevelopmentPlan} />}
          {activeTab === 'my-skills' && <MySkillsTab currentUser={currentUser} updateSkill={updateSkill} addSkill={addSkill} updateCareerProfile={updateCareerProfile} />}
        </div>
      </div>

      {/* Career Tracker Modal */}
      {viewingItem && (
        <CareerTrackerModal
          careerItem={viewingItem}
          type={viewingType}
          onClose={handleCloseModal}
          onUpdate={handleUpdateItem}
        />
      )}
    </div>
  );
};

// My Career Tab Component
const MyCareerTab = ({ currentUser, updateCareerProfile, addCareerHighlight }) => {
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({});
  const [newHighlight, setNewHighlight] = useState({ title: '', description: '', date: '' });
  const [showAddHighlight, setShowAddHighlight] = useState(false);

  const careerProfile = currentUser?.careerProfile || {};

  const handleEdit = (section) => {
    setEditingSection(section);
    if (section.startsWith('preferences-')) {
      const preferenceType = section.split('-')[1];
      const preferences = careerProfile.preferences || {};
      if (preferenceType === 'want') {
        setFormData({ wantToDo: preferences.wantToDo || [] });
      } else if (preferenceType === 'dont') {
        setFormData({ dontWantToDo: preferences.dontWantToDo || [] });
      } else if (preferenceType === 'motivators') {
        setFormData({ motivators: preferences.motivators || [] });
      }
    } else {
      setFormData(careerProfile[section] || {});
    }
  };

  const handleSave = (section) => {
    if (section.startsWith('preferences-')) {
      const preferenceType = section.split('-')[1];
      const currentPreferences = careerProfile.preferences || {};
      let updatedPreferences = { ...currentPreferences };
      
      if (preferenceType === 'want') {
        updatedPreferences.wantToDo = formData.wantToDo;
      } else if (preferenceType === 'dont') {
        updatedPreferences.dontWantToDo = formData.dontWantToDo;
      } else if (preferenceType === 'motivators') {
        updatedPreferences.motivators = formData.motivators;
      }
      
      updateCareerProfile({ preferences: updatedPreferences });
    } else {
      updateCareerProfile({ [section]: formData });
    }
    setEditingSection(null);
    setFormData({});
  };

  const handleCancel = () => {
    setEditingSection(null);
    setFormData({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => {
      const newArray = [...(prev[field] || [])];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => {
      const newArray = [...(prev[field] || [])];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  const handleAddHighlight = () => {
    if (newHighlight.title && newHighlight.description) {
      const highlight = {
        id: Date.now(),
        ...newHighlight,
        date: newHighlight.date || new Date().toISOString().split('T')[0]
      };
      addCareerHighlight(highlight);
      setNewHighlight({ title: '', description: '', date: '' });
      setShowAddHighlight(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-professional-gray-900 mb-1">My Career Profile</h2>
        <p className="text-sm text-professional-gray-600">Track your current role, experience, and career highlights</p>
      </div>

      {/* Current Role Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
            <Briefcase className="w-4 h-4 mr-2 text-professional-gray-600" />
            Current Role
          </h3>
          {editingSection !== 'currentRole' ? (
            <button
              onClick={() => handleEdit('currentRole')}
              className="text-netsurit-red hover:text-netsurit-coral text-sm flex items-center"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => handleSave('currentRole')}
                className="text-green-600 hover:text-green-700 text-sm flex items-center"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="text-professional-gray-600 hover:text-professional-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">Job Title</label>
            {editingSection === 'currentRole' ? (
              <input
                type="text"
                value={formData.jobTitle || ''}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Enter job title"
              />
            ) : (
              <p className="text-professional-gray-900 bg-professional-gray-50 p-2 rounded-md border border-professional-gray-200 text-sm">
                {careerProfile.currentRole?.jobTitle || 'Not specified'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">Department</label>
            {editingSection === 'currentRole' ? (
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Enter department"
              />
            ) : (
              <p className="text-professional-gray-900 bg-professional-gray-50 p-2 rounded-md border border-professional-gray-200 text-sm">
                {careerProfile.currentRole?.department || 'Not specified'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">Start Date</label>
            {editingSection === 'currentRole' ? (
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
              />
            ) : (
              <p className="text-professional-gray-900 bg-professional-gray-50 p-2 rounded-md border border-professional-gray-200 flex items-center text-sm">
                <Calendar className="w-3 h-3 mr-2 text-professional-gray-500" />
                {careerProfile.currentRole?.startDate || 'Not specified'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">Location</label>
            {editingSection === 'currentRole' ? (
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Enter location"
              />
            ) : (
              <p className="text-professional-gray-900 bg-professional-gray-50 p-2 rounded-md border border-professional-gray-200 flex items-center text-sm">
                <MapPin className="w-3 h-3 mr-2 text-professional-gray-500" />
                {careerProfile.currentRole?.location || 'Not specified'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Aspirations */}
      <div className="bg-professional-gray-50 rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
            <Target className="w-4 h-4 mr-2 text-netsurit-red" />
            My Aspirations
          </h3>
          {editingSection !== 'aspirations' ? (
            <button
              onClick={() => handleEdit('aspirations')}
              className="text-netsurit-red hover:text-netsurit-coral text-sm flex items-center"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => handleSave('aspirations')}
                className="text-green-600 hover:text-green-700 text-sm flex items-center"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="text-professional-gray-600 hover:text-professional-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">Desired Job Title</label>
            {editingSection === 'aspirations' ? (
              <input
                type="text"
                value={formData.desiredJobTitle || ''}
                onChange={(e) => handleInputChange('desiredJobTitle', e.target.value)}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Enter desired job title"
              />
            ) : (
              <p className="text-professional-gray-900 bg-white p-2 rounded-md border border-professional-gray-200 text-sm">
                {careerProfile.aspirations?.desiredJobTitle || 'Not specified'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">Preferred Department</label>
            {editingSection === 'aspirations' ? (
              <input
                type="text"
                value={formData.preferredDepartment || ''}
                onChange={(e) => handleInputChange('preferredDepartment', e.target.value)}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Enter preferred department"
              />
            ) : (
              <p className="text-professional-gray-900 bg-white p-2 rounded-md border border-professional-gray-200 text-sm">
                {careerProfile.aspirations?.preferredDepartment || 'Not specified'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">Interested in Relocation</label>
            {editingSection === 'aspirations' ? (
              <select
                value={formData.interestedInRelocation || false}
                onChange={(e) => handleInputChange('interestedInRelocation', e.target.value === 'true')}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
              >
                <option value={false}>No, prefer current location</option>
                <option value={true}>Yes, open to opportunities</option>
              </select>
            ) : (
              <p className="text-professional-gray-900 bg-white p-2 rounded-md border border-professional-gray-200 text-sm flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${careerProfile.aspirations?.interestedInRelocation ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                {careerProfile.aspirations?.interestedInRelocation ? 'Yes, open to opportunities' : 'No, prefer current location'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">Preferred Geography</label>
            {editingSection === 'aspirations' ? (
              <input
                type="text"
                value={formData.preferredGeography || ''}
                onChange={(e) => handleInputChange('preferredGeography', e.target.value)}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Enter preferred locations"
              />
            ) : (
              <p className="text-professional-gray-900 bg-white p-2 rounded-md border border-professional-gray-200 text-sm">
                {careerProfile.aspirations?.preferredGeography || 'Not specified'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Career Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* What I Want to Do */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
              <Target className="w-4 h-4 mr-2 text-professional-gray-600" />
              What I Want to Do
            </h3>
            {editingSection !== 'preferences-want' ? (
              <button
                onClick={() => handleEdit('preferences-want')}
                className="text-netsurit-red hover:text-netsurit-coral text-xs flex items-center"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </button>
            ) : (
              <div className="flex space-x-1">
                <button
                  onClick={() => handleSave('preferences-want')}
                  className="text-green-600 hover:text-green-700 text-xs flex items-center"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="text-professional-gray-600 hover:text-professional-gray-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {editingSection === 'preferences-want' ? (
              <div className="space-y-2">
                {(formData.wantToDo || []).map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('wantToDo', index, e.target.value)}
                      className="flex-1 p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                      placeholder="Enter what you want to do"
                    />
                    <button
                      onClick={() => removeArrayItem('wantToDo', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('wantToDo')}
                  className="flex items-center text-netsurit-red hover:text-netsurit-coral text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {(careerProfile.preferences?.wantToDo || []).length > 0 ? (
                  careerProfile.preferences.wantToDo.map((item, index) => (
                    <div key={index} className="bg-professional-gray-50 p-2 rounded-md border border-professional-gray-200">
                      <p className="text-sm text-professional-gray-800">{item}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-professional-gray-500 italic">No preferences specified</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* What I Don't Want to Do */}
        <div className="bg-professional-gray-50 rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
              <X className="w-4 h-4 mr-2 text-professional-gray-600" />
              What I Don't Want to Do
            </h3>
            {editingSection !== 'preferences-dont' ? (
              <button
                onClick={() => handleEdit('preferences-dont')}
                className="text-netsurit-red hover:text-netsurit-coral text-xs flex items-center"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </button>
            ) : (
              <div className="flex space-x-1">
                <button
                  onClick={() => handleSave('preferences-dont')}
                  className="text-green-600 hover:text-green-700 text-xs flex items-center"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="text-professional-gray-600 hover:text-professional-gray-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {editingSection === 'preferences-dont' ? (
              <div className="space-y-2">
                {(formData.dontWantToDo || []).map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('dontWantToDo', index, e.target.value)}
                      className="flex-1 p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                      placeholder="Enter what you don't want to do"
                    />
                    <button
                      onClick={() => removeArrayItem('dontWantToDo', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('dontWantToDo')}
                  className="flex items-center text-netsurit-red hover:text-netsurit-coral text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {(careerProfile.preferences?.dontWantToDo || []).length > 0 ? (
                  careerProfile.preferences.dontWantToDo.map((item, index) => (
                    <div key={index} className="bg-professional-gray-100 p-2 rounded-md border border-professional-gray-200">
                      <p className="text-sm text-professional-gray-800">{item}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-professional-gray-500 italic">No preferences specified</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Motivators */}
        <div className="bg-professional-gray-50 rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-netsurit-red" />
              What Motivates Me
            </h3>
            {editingSection !== 'preferences-motivators' ? (
              <button
                onClick={() => handleEdit('preferences-motivators')}
                className="text-netsurit-red hover:text-netsurit-coral text-xs flex items-center"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </button>
            ) : (
              <div className="flex space-x-1">
                <button
                  onClick={() => handleSave('preferences-motivators')}
                  className="text-green-600 hover:text-green-700 text-xs flex items-center"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="text-professional-gray-600 hover:text-professional-gray-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {editingSection === 'preferences-motivators' ? (
              <div className="space-y-2">
                {(formData.motivators || []).map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('motivators', index, e.target.value)}
                      className="flex-1 p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                      placeholder="Enter what motivates you"
                    />
                    <button
                      onClick={() => removeArrayItem('motivators', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('motivators')}
                  className="flex items-center text-netsurit-red hover:text-netsurit-coral text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {(careerProfile.preferences?.motivators || []).length > 0 ? (
                  careerProfile.preferences.motivators.map((item, index) => (
                    <div key={index} className="bg-white p-2 rounded-md border border-professional-gray-200">
                      <p className="text-sm text-professional-gray-800">{item}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-professional-gray-500 italic">No motivators specified</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Career Highlights */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-professional-gray-900">Career Highlights</h3>
          <button
            onClick={() => setShowAddHighlight(true)}
            className="text-netsurit-red hover:text-netsurit-coral text-sm flex items-center"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Highlight
          </button>
        </div>
        
        {/* Add Highlight Form */}
        {showAddHighlight && (
          <div className="mb-4 p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-professional-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newHighlight.title}
                  onChange={(e) => setNewHighlight(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                  placeholder="Enter highlight title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-professional-gray-700 mb-1">Description</label>
                <textarea
                  value={newHighlight.description}
                  onChange={(e) => setNewHighlight(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                  placeholder="Describe your achievement"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-professional-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newHighlight.date}
                  onChange={(e) => setNewHighlight(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddHighlight}
                  className="px-4 py-2 bg-netsurit-red text-white rounded-md text-sm hover:bg-netsurit-coral transition-colors"
                >
                  Add Highlight
                </button>
                <button
                  onClick={() => {
                    setShowAddHighlight(false);
                    setNewHighlight({ title: '', description: '', date: '' });
                  }}
                  className="px-4 py-2 bg-professional-gray-200 text-professional-gray-700 rounded-md text-sm hover:bg-professional-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {(careerProfile.careerHighlights || []).length > 0 ? (
            careerProfile.careerHighlights.map((highlight, index) => (
              <div key={highlight.id || index} className="p-3 bg-professional-gray-50 rounded-md border border-professional-gray-200">
                <h4 className="font-medium text-professional-gray-900 text-sm">{highlight.title}</h4>
                <p className="text-sm text-professional-gray-600 mt-1">{highlight.description}</p>
                <p className="text-xs text-professional-gray-500 mt-1">
                  {highlight.date ? new Date(highlight.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-professional-gray-500 italic text-center py-4">
              No career highlights added yet. Click "Add Highlight" to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Career Goals Tab Component
const CareerGoalsTab = ({ currentUser, onViewItem, addCareerGoal }) => {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    progress: 0,
    targetDate: '',
    status: 'Planned'
  });

  const careerGoals = currentUser?.careerGoals || [];

  const handleAddGoal = () => {
    if (newGoal.title && newGoal.description) {
      const goalToAdd = {
        id: Date.now(),
        ...newGoal,
        progress: parseInt(newGoal.progress),
        milestones: [],
        notes: [],
        history: []
      };
      addCareerGoal(goalToAdd);
      setNewGoal({
        title: '',
        description: '',
        progress: 0,
        targetDate: '',
        status: 'Planned'
      });
      setShowAddGoal(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Planned':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTargetDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short'
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-professional-gray-900 mb-1">Career Goals</h2>
            <p className="text-sm text-professional-gray-600">Define and track your professional aspirations and objectives</p>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="px-4 py-2 bg-netsurit-red text-white rounded-lg text-sm hover:bg-netsurit-coral transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Career Goal
          </button>
        </div>
      </div>

      {/* Add Goal Form */}
      {showAddGoal && (
        <div className="mb-6 p-6 bg-professional-gray-50 rounded-2xl border border-professional-gray-200">
          <h3 className="text-base font-semibold text-professional-gray-900 mb-4">Add New Career Goal</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                  placeholder="e.g., Become Senior Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-1">Description</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 rounded-lg border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Describe your career goal in detail..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">Status</label>
                <select
                  value={newGoal.status}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">Initial Progress ({newGoal.progress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newGoal.progress}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, progress: e.target.value }))}
                  className="w-full slider"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddGoal}
                className="px-6 py-3 bg-netsurit-red text-white rounded-lg text-sm hover:bg-netsurit-coral transition-colors font-semibold"
              >
                Create Goal
              </button>
              <button
                onClick={() => {
                  setShowAddGoal(false);
                  setNewGoal({
                    title: '',
                    description: '',
                    progress: 0,
                    targetDate: '',
                    status: 'Planned'
                  });
                }}
                className="px-6 py-3 bg-professional-gray-200 text-professional-gray-700 rounded-lg text-sm hover:bg-professional-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Career Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {careerGoals.map((goal) => (
          <div 
            key={goal.id} 
            className="bg-white rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => onViewItem(goal, 'goal')}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-professional-gray-900 text-sm flex-1">{goal.title}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ml-2 ${getStatusColor(goal.status)}`}>
                {goal.status}
              </span>
            </div>
            
            <p className="text-xs text-professional-gray-600 mb-3 line-clamp-2">{goal.description}</p>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-professional-gray-600 mb-1">
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <div className="w-full bg-professional-gray-200 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-professional-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Target: {formatTargetDate(goal.targetDate)}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewItem(goal, 'goal');
                }}
                className="text-xs text-netsurit-red hover:text-netsurit-coral font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {careerGoals.length === 0 && (
        <div className="text-center py-12 text-professional-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
          <p>No career goals yet. Start by adding your first career goal!</p>
        </div>
      )}
    </div>
  );
};

// Development Plan Tab Component
const DevelopmentPlanTab = ({ currentUser, onViewItem, addDevelopmentPlan }) => {
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    progress: 0,
    targetDate: '',
    status: 'Planned',
    skills: []
  });

  const developmentPlan = currentUser?.developmentPlan || [];

  const handleAddPlan = () => {
    if (newPlan.title && newPlan.description) {
      const planToAdd = {
        id: Date.now(),
        ...newPlan,
        progress: parseInt(newPlan.progress),
        skills: newPlan.skills.filter(skill => skill.trim() !== ''),
        milestones: [],
        notes: [],
        history: []
      };
      addDevelopmentPlan(planToAdd);
      setNewPlan({
        title: '',
        description: '',
        progress: 0,
        targetDate: '',
        status: 'Planned',
        skills: []
      });
      setShowAddPlan(false);
    }
  };

  const handleSkillChange = (index, value) => {
    const updatedSkills = [...newPlan.skills];
    updatedSkills[index] = value;
    setNewPlan(prev => ({ ...prev, skills: updatedSkills }));
  };

  const addSkillField = () => {
    setNewPlan(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  };

  const removeSkillField = (index) => {
    const updatedSkills = newPlan.skills.filter((_, i) => i !== index);
    setNewPlan(prev => ({ ...prev, skills: updatedSkills }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Planned':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTargetDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short'
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-professional-gray-900 mb-1">Development Plan</h2>
            <p className="text-sm text-professional-gray-600">Chart your learning path and professional growth activities</p>
          </div>
          <button
            onClick={() => setShowAddPlan(true)}
            className="px-4 py-2 bg-netsurit-red text-white rounded-lg text-sm hover:bg-netsurit-coral transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Development Plan
          </button>
        </div>
      </div>

      {/* Add Plan Form */}
      {showAddPlan && (
        <div className="mb-6 p-6 bg-professional-gray-50 rounded-2xl border border-professional-gray-200">
          <h3 className="text-base font-semibold text-professional-gray-900 mb-4">Add New Development Plan</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">Plan Title</label>
                <input
                  type="text"
                  value={newPlan.title}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                  placeholder="e.g., Advanced JavaScript Course"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newPlan.targetDate}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-1">Description</label>
              <textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 rounded-lg border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Describe your development plan in detail..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-1">Skills to Develop</label>
              <div className="space-y-2">
                {newPlan.skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(index, e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                      placeholder="Enter skill name"
                    />
                    <button
                      onClick={() => removeSkillField(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addSkillField}
                  className="flex items-center text-netsurit-red hover:text-netsurit-coral text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Skill
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">Status</label>
                <select
                  value={newPlan.status}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">Initial Progress ({newPlan.progress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newPlan.progress}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, progress: e.target.value }))}
                  className="w-full slider"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddPlan}
                className="px-6 py-3 bg-netsurit-red text-white rounded-lg text-sm hover:bg-netsurit-coral transition-colors font-semibold"
              >
                Create Plan
              </button>
              <button
                onClick={() => {
                  setShowAddPlan(false);
                  setNewPlan({
                    title: '',
                    description: '',
                    progress: 0,
                    targetDate: '',
                    status: 'Planned',
                    skills: []
                  });
                }}
                className="px-6 py-3 bg-professional-gray-200 text-professional-gray-700 rounded-lg text-sm hover:bg-professional-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Development Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {developmentPlan.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => onViewItem(item, 'development')}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-professional-gray-900 text-sm flex-1">{item.title}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ml-2 ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
            
            <p className="text-xs text-professional-gray-600 mb-3 line-clamp-2">{item.description}</p>
            
            {/* Skills */}
            {item.skills && item.skills.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {item.skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="bg-netsurit-light-coral/20 text-netsurit-red text-xs px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                  {item.skills.length > 3 && (
                    <span className="text-xs text-professional-gray-500">+{item.skills.length - 3} more</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-professional-gray-600 mb-1">
                <span>Progress</span>
                <span>{item.progress}%</span>
              </div>
              <div className="w-full bg-professional-gray-200 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-professional-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Target: {formatTargetDate(item.targetDate)}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewItem(item, 'development');
                }}
                className="text-xs text-netsurit-red hover:text-netsurit-coral font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {developmentPlan.length === 0 && (
        <div className="text-center py-12 text-professional-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
          <p>No development plans yet. Start by adding your first learning activity!</p>
        </div>
      )}
    </div>
  );
};

// My Skills Tab Component
const MySkillsTab = ({ currentUser, updateSkill, addSkill, updateCareerProfile }) => {
  const [showAddSkill, setShowAddSkill] = useState(null); // 'technical' or 'soft'
  const [newSkill, setNewSkill] = useState({ name: '', level: 50, category: '' });
  const [editingSkill, setEditingSkill] = useState(null);

  const careerProfile = currentUser?.careerProfile || {};
  const technicalSkills = careerProfile.skills?.technical || [];
  const softSkills = careerProfile.skills?.soft || [];

  const getSkillColor = (level) => {
    if (level >= 80) return 'bg-gradient-to-r from-netsurit-red to-netsurit-coral';
    if (level >= 60) return 'bg-gradient-to-r from-netsurit-coral to-netsurit-red';
    return 'bg-netsurit-red';
  };

  const handleAddSkill = (skillType) => {
    if (newSkill.name) {
      const skillToAdd = {
        id: Date.now(),
        ...newSkill,
        level: parseInt(newSkill.level)
      };
      addSkill(skillType, skillToAdd);
      setNewSkill({ name: '', level: 50, category: '' });
      setShowAddSkill(null);
    }
  };

  const handleUpdateSkill = (skillType, skillIndex, field, value) => {
    const skills = skillType === 'technical' ? technicalSkills : softSkills;
    const updatedSkill = { ...skills[skillIndex], [field]: value };
    updateSkill(skillType, skillIndex, updatedSkill);
  };

  const handleDeleteSkill = (skillType, skillIndex) => {
    const currentSkills = careerProfile.skills || { technical: [], soft: [] };
    const updatedSkills = { ...currentSkills };
    updatedSkills[skillType] = updatedSkills[skillType].filter((_, index) => index !== skillIndex);
    updateCareerProfile({ skills: updatedSkills });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-professional-gray-900 mb-1">My Skills</h2>
        <p className="text-sm text-professional-gray-600">Track your technical and soft skills proficiency levels</p>
      </div>

      {/* Technical Skills */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
            <Award className="w-4 h-4 mr-2 text-professional-gray-600" />
            Technical Skills
          </h3>
          <button
            onClick={() => setShowAddSkill('technical')}
            className="text-netsurit-red hover:text-netsurit-coral text-sm flex items-center"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Skill
          </button>
        </div>

        {/* Add Technical Skill Form */}
        {showAddSkill === 'technical' && (
          <div className="mb-4 p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-professional-gray-700 mb-1">Skill Name</label>
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                  placeholder="e.g., React, Python, AWS"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-professional-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newSkill.category}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                  placeholder="e.g., Frontend, Backend"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-professional-gray-700 mb-1">Level ({newSkill.level}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newSkill.level}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full slider"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => handleAddSkill('technical')}
                className="px-4 py-2 bg-netsurit-red text-white rounded-md text-sm hover:bg-netsurit-coral transition-colors"
              >
                Add Skill
              </button>
              <button
                onClick={() => {
                  setShowAddSkill(null);
                  setNewSkill({ name: '', level: 50, category: '' });
                }}
                className="px-4 py-2 bg-professional-gray-200 text-professional-gray-700 rounded-md text-sm hover:bg-professional-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {technicalSkills.length > 0 ? (
            technicalSkills.map((skill, index) => (
              <div key={skill.id || index} className="bg-professional-gray-50 p-3 rounded-md border border-professional-gray-200 group">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    {editingSkill === `technical-${index}` ? (
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => handleUpdateSkill('technical', index, 'name', e.target.value)}
                        className="w-full p-1 rounded border text-sm font-medium"
                        onBlur={() => setEditingSkill(null)}
                        onKeyPress={(e) => e.key === 'Enter' && setEditingSkill(null)}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="font-medium text-professional-gray-900 text-sm cursor-pointer hover:text-netsurit-red"
                        onClick={() => setEditingSkill(`technical-${index}`)}
                      >
                        {skill.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-professional-gray-600">{skill.level}%</span>
                    <button
                      onClick={() => handleDeleteSkill('technical', index)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-professional-gray-200 rounded-full h-1 mb-1">
                  <div 
                    className={`h-1 rounded-full ${getSkillColor(skill.level)}`}
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-professional-gray-500">{skill.category}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skill.level}
                    onChange={(e) => handleUpdateSkill('technical', index, 'level', parseInt(e.target.value))}
                    className="w-16 h-1 slider"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-professional-gray-500">
              <Award className="w-8 h-8 mx-auto mb-2 text-professional-gray-300" />
              <p className="text-sm">No technical skills added yet. Click "Add Skill" to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Soft Skills */}
      <div className="bg-professional-gray-50 rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
            <User className="w-4 h-4 mr-2 text-professional-gray-600" />
            Soft Skills
          </h3>
          <button
            onClick={() => setShowAddSkill('soft')}
            className="text-netsurit-red hover:text-netsurit-coral text-sm flex items-center"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Skill
          </button>
        </div>

        {/* Add Soft Skill Form */}
        {showAddSkill === 'soft' && (
          <div className="mb-4 p-4 bg-white rounded-lg border border-professional-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-professional-gray-700 mb-1">Skill Name</label>
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                  placeholder="e.g., Leadership, Communication"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-professional-gray-700 mb-1">Level ({newSkill.level}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newSkill.level}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full slider"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => handleAddSkill('soft')}
                className="px-4 py-2 bg-netsurit-red text-white rounded-md text-sm hover:bg-netsurit-coral transition-colors"
              >
                Add Skill
              </button>
              <button
                onClick={() => {
                  setShowAddSkill(null);
                  setNewSkill({ name: '', level: 50, category: '' });
                }}
                className="px-4 py-2 bg-professional-gray-200 text-professional-gray-700 rounded-md text-sm hover:bg-professional-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {softSkills.length > 0 ? (
            softSkills.map((skill, index) => (
              <div key={skill.id || index} className="bg-white p-3 rounded-md border border-professional-gray-200 group">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    {editingSkill === `soft-${index}` ? (
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => handleUpdateSkill('soft', index, 'name', e.target.value)}
                        className="w-full p-1 rounded border text-sm font-medium"
                        onBlur={() => setEditingSkill(null)}
                        onKeyPress={(e) => e.key === 'Enter' && setEditingSkill(null)}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="font-medium text-professional-gray-900 text-sm cursor-pointer hover:text-netsurit-red"
                        onClick={() => setEditingSkill(`soft-${index}`)}
                      >
                        {skill.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-professional-gray-600">{skill.level}%</span>
                    <button
                      onClick={() => handleDeleteSkill('soft', index)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-professional-gray-200 rounded-full h-1 mb-1">
                  <div 
                    className={`h-1 rounded-full ${getSkillColor(skill.level)}`}
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
                <div className="flex justify-end">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skill.level}
                    onChange={(e) => handleUpdateSkill('soft', index, 'level', parseInt(e.target.value))}
                    className="w-20 h-1 slider"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-professional-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-professional-gray-300" />
              <p className="text-sm">No soft skills added yet. Click "Add Skill" to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerBook;
