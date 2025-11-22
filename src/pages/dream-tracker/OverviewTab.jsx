// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  TrendingUp, 
  Clock, 
  Target,
  Eye,
  EyeOff
} from 'lucide-react';

/**
 * Overview Tab - Displays dream overview with What/Why/How and progress stats
 * @component
 */
export function OverviewTab({ 
  localDream, 
  completedGoals, 
  totalGoals, 
  getCategoryIcon, 
  formatDate, 
  handlePrivacyChange,
  handleUpdateDescription,
  handleUpdateMotivation,
  handleUpdateApproach,
  canEdit = true 
}) {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editingField && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingField]);

  const handleStartEdit = (field, currentValue) => {
    if (!canEdit) return;
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = (field) => {
    if (!canEdit) return;
    
    const trimmedValue = editValue.trim();
    
    if (field === 'what') {
      handleUpdateDescription(trimmedValue);
    } else if (field === 'why') {
      handleUpdateMotivation(trimmedValue);
    } else if (field === 'how') {
      handleUpdateApproach(trimmedValue);
    }
    
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(field);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const EditableField = ({ field, label, color, value, placeholder, onUpdate }) => {
    const isEditing = editingField === field;
    const displayValue = value || '';
    const showPlaceholder = !value && !isEditing;

    return (
      <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
        <div className="p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-2 h-2 ${color} rounded-full`}></div>
            <h4 className="font-bold text-professional-gray-900 text-sm">{label}</h4>
            {field === 'what' && (
              <span className="text-xs text-professional-gray-400 italic ml-2">{placeholder}</span>
            )}
            {field !== 'what' && showPlaceholder && (
              <span className="text-xs text-professional-gray-400 italic ml-2">{placeholder}</span>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => handleKeyDown(e, field)}
                className="w-full text-sm text-professional-gray-700 leading-relaxed border border-professional-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-netsurit-red resize-none"
                placeholder={placeholder}
                rows={3}
                data-testid={`edit-${field}-textarea`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveEdit(field)}
                  className="px-3 py-1 bg-netsurit-red text-white text-xs rounded-lg hover:bg-netsurit-coral transition-colors"
                  data-testid={`save-${field}-button`}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-professional-gray-200 text-professional-gray-700 text-xs rounded-lg hover:bg-professional-gray-300 transition-colors"
                  data-testid={`cancel-${field}-button`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => canEdit && handleStartEdit(field, displayValue)}
              className={`text-professional-gray-700 leading-relaxed text-sm min-h-[1.5rem] ${
                canEdit ? 'cursor-text hover:bg-professional-gray-50 rounded p-1 -m-1 transition-colors' : ''
              }`}
              data-testid={`${field}-display`}
            >
              {displayValue || (
                <span className="text-professional-gray-400 italic">{placeholder}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
      {/* Dream Overview - What, Why, How */}
      <div className="space-y-3">
        <EditableField
          field="what"
          label="What"
          color="bg-netsurit-red"
          value={localDream.description}
          placeholder="What is your dream? Describe what you want to achieve..."
          onUpdate={handleUpdateDescription}
        />

        <EditableField
          field="why"
          label="Why"
          color="bg-netsurit-coral"
          value={localDream.motivation}
          placeholder="Why is this important to you? What will it mean when you achieve this..."
          onUpdate={handleUpdateMotivation}
        />

        <EditableField
          field="how"
          label="How"
          color="bg-netsurit-orange"
          value={localDream.approach}
          placeholder="How will you achieve this? What's your approach or strategy..."
          onUpdate={handleUpdateApproach}
        />
      </div>

      {/* Key Stats */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
          <div className="p-2 px-3 border-b border-professional-gray-200 bg-professional-gray-50">
            <h4 className="font-bold text-professional-gray-900 flex items-center space-x-2 text-sm">
              <TrendingUp className="h-4 w-4 text-netsurit-red" />
              <span>Progress Statistics</span>
            </h4>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-professional-gray-600">Overall Progress</span>
                <div className="flex items-center space-x-2">
                  <div className="w-12 bg-professional-gray-200 rounded-full h-2 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${localDream.progress}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-netsurit-red text-xs">{localDream.progress}%</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-medium text-professional-gray-600">Goals Completed</span>
                <span className="font-bold text-professional-gray-900 text-xs">{completedGoals}/{totalGoals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-medium text-professional-gray-600">Activity History</span>
                <span className="font-bold text-professional-gray-900 text-xs">{localDream.history?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dream Settings */}
        <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
          <div className="p-2 px-3 border-b border-professional-gray-200 bg-professional-gray-50">
            <h4 className="font-bold text-professional-gray-900 flex items-center space-x-2 text-sm">
              {localDream.isPublic ? (
                <Eye className="h-4 w-4 text-netsurit-red" />
              ) : (
                <EyeOff className="h-4 w-4 text-professional-gray-600" />
              )}
              <span>Dream Visibility</span>
            </h4>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-professional-gray-600">
                  {localDream.isPublic 
                    ? 'Visible to coaches and team members' 
                    : 'Private - only visible to you'}
                </span>
              </div>
              {!canEdit && (
                <div className="text-xs text-professional-gray-500 italic mb-2">
                  View only - Coach viewing mode
                </div>
              )}
              <div 
                className="flex items-center space-x-2"
                role="group"
                aria-label="Dream visibility"
              >
                <button
                  type="button"
                  onClick={() => canEdit && handlePrivacyChange(false)}
                  disabled={!canEdit}
                  aria-pressed={!localDream.isPublic}
                  data-testid="private-button"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !canEdit ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    !localDream.isPublic 
                      ? 'bg-professional-gray-600 text-white' 
                      : 'bg-professional-gray-100 text-professional-gray-600 hover:bg-professional-gray-200'
                  }`}
                >
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => canEdit && handlePrivacyChange(true)}
                  disabled={!canEdit}
                  aria-pressed={localDream.isPublic}
                  data-testid="public-button"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !canEdit ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    localDream.isPublic 
                      ? 'bg-netsurit-red text-white' 
                      : 'bg-professional-gray-100 text-professional-gray-600 hover:bg-professional-gray-200'
                  }`}
                >
                  Public
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
          <div className="p-2 px-3 border-b border-professional-gray-200 bg-professional-gray-50">
            <h4 className="font-bold text-professional-gray-900 flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-netsurit-red" />
              <span>Recent Activity</span>
            </h4>
          </div>
          <div className="p-3">
            <div className="space-y-2">
              {localDream.history?.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-netsurit-coral rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-xs text-professional-gray-700 font-medium">{entry.action}</p>
                    <p className="text-xs text-professional-gray-500">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) || <p className="text-xs text-professional-gray-500 italic">No recent activity</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

OverviewTab.propTypes = {
  localDream: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    motivation: PropTypes.string,
    approach: PropTypes.string,
    category: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    isPublic: PropTypes.bool,
    notes: PropTypes.array,
    history: PropTypes.array
  }).isRequired,
  completedGoals: PropTypes.number.isRequired,
  totalGoals: PropTypes.number.isRequired,
  getCategoryIcon: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  handlePrivacyChange: PropTypes.func.isRequired,
  handleUpdateDescription: PropTypes.func.isRequired,
  handleUpdateMotivation: PropTypes.func.isRequired,
  handleUpdateApproach: PropTypes.func.isRequired,
  canEdit: PropTypes.bool
};

export default React.memo(OverviewTab);







