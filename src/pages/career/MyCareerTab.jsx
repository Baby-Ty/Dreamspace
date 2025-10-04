// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { Briefcase, Target, Calendar, MapPin, Edit3, Save, X, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useCareerData } from '../../hooks/useCareerData';

export default function MyCareerTab() {
  const { careerProfile, updateCareerProfile, addCareerHighlight, isLoading, error } = useCareerData();
  
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({});
  const [newHighlight, setNewHighlight] = useState({ title: '', description: '', date: '' });
  const [showAddHighlight, setShowAddHighlight] = useState(false);

  // Early returns
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-netsurit-red"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading career profile: {error}</p>
      </div>
    );
  }

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
      
      if (preferenceType === 'want') updatedPreferences.wantToDo = formData.wantToDo;
      else if (preferenceType === 'dont') updatedPreferences.dontWantToDo = formData.dontWantToDo;
      else if (preferenceType === 'motivators') updatedPreferences.motivators = formData.motivators;
      
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

  const renderEditableSection = (title, section, icon, fields) => (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
          {icon}
          {title}
        </h3>
        {editingSection !== section ? (
          <button
            onClick={() => handleEdit(section)}
            className="text-netsurit-red hover:text-netsurit-coral text-sm flex items-center"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => handleSave(section)}
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
        {fields.map(field => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-professional-gray-700 mb-1">{field.label}</label>
            {editingSection === section ? (
              <input
                type={field.type || "text"}
                value={formData[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder={field.placeholder}
              />
            ) : (
              <p className="text-professional-gray-900 bg-professional-gray-50 p-2 rounded-md border border-professional-gray-200 text-sm flex items-center">
                {field.icon}
                {careerProfile[section]?.[field.key] || 'Not specified'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreferencesSection = (title, section, preferenceKey, bgColor = 'bg-white') => (
    <div className={`${bgColor} rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
          <Target className="w-4 h-4 mr-2 text-professional-gray-600" />
          {title}
        </h3>
        {editingSection !== `preferences-${section}` ? (
          <button
            onClick={() => handleEdit(`preferences-${section}`)}
            className="text-netsurit-red hover:text-netsurit-coral text-xs flex items-center"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </button>
        ) : (
          <div className="flex space-x-1">
            <button
              onClick={() => handleSave(`preferences-${section}`)}
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
        {editingSection === `preferences-${section}` ? (
          <div className="space-y-2">
            {(formData[preferenceKey] || []).map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleArrayChange(preferenceKey, index, e.target.value)}
                  className="flex-1 p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                  placeholder={`Enter ${title.toLowerCase()}`}
                />
                <button
                  onClick={() => removeArrayItem(preferenceKey, index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem(preferenceKey)}
              className="flex items-center text-netsurit-red hover:text-netsurit-coral text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {(careerProfile.preferences?.[preferenceKey] || []).length > 0 ? (
              careerProfile.preferences[preferenceKey].map((item, index) => (
                <div key={index} className="bg-professional-gray-50 p-2 rounded-md border border-professional-gray-200">
                  <p className="text-sm text-professional-gray-800">{item}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-professional-gray-500 italic">No {title.toLowerCase()} specified</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-professional-gray-900 mb-1">My Career Profile</h2>
        <p className="text-sm text-professional-gray-600">Track your current role, experience, and career highlights</p>
      </div>

      {/* Current Role */}
      {renderEditableSection(
        'Current Role',
        'currentRole',
        <Briefcase className="w-4 h-4 mr-2 text-professional-gray-600" />,
        [
          { key: 'jobTitle', label: 'Job Title', placeholder: 'Enter job title' },
          { key: 'department', label: 'Department', placeholder: 'Enter department' },
          { key: 'startDate', label: 'Start Date', type: 'date', icon: <Calendar className="w-3 h-3 mr-2 text-professional-gray-500" /> },
          { key: 'location', label: 'Location', placeholder: 'Enter location', icon: <MapPin className="w-3 h-3 mr-2 text-professional-gray-500" /> }
        ]
      )}

      {/* Aspirations */}
      {renderEditableSection(
        'My Aspirations',
        'aspirations',
        <Target className="w-4 h-4 mr-2 text-netsurit-red" />,
        [
          { key: 'desiredJobTitle', label: 'Desired Job Title', placeholder: 'Enter desired job title' },
          { key: 'preferredDepartment', label: 'Preferred Department', placeholder: 'Enter preferred department' },
          { key: 'preferredGeography', label: 'Preferred Geography', placeholder: 'Enter preferred locations' }
        ]
      )}

      {/* Preferences Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderPreferencesSection('What I Want to Do', 'want', 'wantToDo')}
        {renderPreferencesSection("What I Don't Want to Do", 'dont', 'dontWantToDo', 'bg-professional-gray-50')}
        {renderPreferencesSection('What Motivates Me', 'motivators', 'motivators', 'bg-professional-gray-50')}
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
        
        {showAddHighlight && (
          <div className="mb-4 p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
            <div className="space-y-3">
              <input
                type="text"
                value={newHighlight.title}
                onChange={(e) => setNewHighlight(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Highlight title"
              />
              <textarea
                value={newHighlight.description}
                onChange={(e) => setNewHighlight(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="Description"
                rows={2}
              />
              <input
                type="date"
                value={newHighlight.date}
                onChange={(e) => setNewHighlight(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
              />
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
              No career highlights added yet. Click &quot;Add Highlight&quot; to get started!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

