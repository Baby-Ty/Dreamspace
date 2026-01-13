import { Save, X, Loader2 } from 'lucide-react';

/**
 * Goal Edit Form Component
 * Form for editing goal details (title, type, recurrence, frequency, etc.)
 */
export default function GoalEditForm({
  editData,
  setEditData,
  onSaveEditing,
  onCancelEditing,
  isSavingGoalEdit = false
}) {
  return (
    <div className="rounded-2xl border-2 border-netsurit-red bg-white shadow-lg p-4">
      <h4 className="font-semibold text-professional-gray-900 mb-3">Edit Goal</h4>
      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-professional-gray-700 mb-1">
            Goal Title
          </label>
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
            placeholder="Enter goal title"
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-professional-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={editData.description || ''}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red resize-none"
            placeholder="Add details about your goal"
            rows="2"
          />
        </div>
        
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-professional-gray-700 mb-1">
            Type
          </label>
          <select
            value={editData.type}
            onChange={(e) => setEditData({ ...editData, type: e.target.value })}
            className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
          >
            <option value="consistency">Consistency</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
        
        {/* Consistency Options */}
        {editData.type === 'consistency' && (
          <>
            {/* Recurrence */}
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                Recurrence
              </label>
              <select
                value={editData.recurrence || 'weekly'}
                onChange={(e) => {
                  const newRecurrence = e.target.value;
                  setEditData({ 
                    ...editData, 
                    recurrence: newRecurrence,
                    frequency: newRecurrence === 'weekly' ? 1 : (newRecurrence === 'monthly' ? 2 : editData.frequency)
                  });
                }}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            {/* Target Duration */}
            <div>
              <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                Target {editData.recurrence === 'weekly' ? 'Weeks' : 'Months'}
              </label>
              <input
                type="number"
                value={editData.targetWeeks === '' ? '' : (editData.targetWeeks || 12)}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    setEditData({ ...editData, targetWeeks: '' });
                    return;
                  }
                  const numValue = parseInt(inputValue, 10);
                  if (!isNaN(numValue)) {
                    setEditData({ ...editData, targetWeeks: numValue });
                  }
                }}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                    setEditData({ ...editData, targetWeeks: 12 });
                  }
                }}
                className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                min="1"
                max="52"
              />
            </div>
            
            {/* Weekly frequency input */}
            {editData.recurrence === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Completions per week <span className="text-netsurit-red">*</span>
                </label>
                <input
                  type="number"
                  value={editData.frequency === '' ? '' : (editData.frequency || 1)}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setEditData({ ...editData, frequency: '' });
                      return;
                    }
                    const numValue = parseInt(inputValue, 10);
                    if (!isNaN(numValue)) {
                      setEditData({ ...editData, frequency: Math.max(1, Math.min(7, numValue)) });
                    }
                  }}
                  onBlur={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                      setEditData({ ...editData, frequency: 1 });
                    }
                  }}
                  min="1"
                  max="7"
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                  placeholder="e.g., 3"
                />
                <p className="text-xs text-professional-gray-500 mt-1">
                  How many times you want to complete this goal each week
                </p>
              </div>
            )}
            
            {/* Monthly frequency input */}
            {editData.recurrence === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-professional-gray-700 mb-1">
                  Completions per month <span className="text-netsurit-red">*</span>
                </label>
                <input
                  type="number"
                  value={editData.frequency === '' ? '' : (editData.frequency || 2)}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setEditData({ ...editData, frequency: '' });
                      return;
                    }
                    const numValue = parseInt(inputValue, 10);
                    if (!isNaN(numValue)) {
                      setEditData({ ...editData, frequency: Math.max(1, Math.min(31, numValue)) });
                    }
                  }}
                  onBlur={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
                      setEditData({ ...editData, frequency: 2 });
                    }
                  }}
                  min="1"
                  max="31"
                  className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
                  placeholder="e.g., 2"
                />
                <p className="text-xs text-professional-gray-500 mt-1">
                  How many times you want to complete this goal each month
                </p>
              </div>
            )}
          </>
        )}
        
        {/* Deadline Options */}
        {editData.type === 'deadline' && (
          <div>
            <label className="block text-sm font-medium text-professional-gray-700 mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={editData.targetDate ? editData.targetDate.split('T')[0] : ''}
              onChange={(e) => setEditData({ ...editData, targetDate: e.target.value })}
              className="w-full px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red"
            />
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={onSaveEditing}
            disabled={isSavingGoalEdit}
            className="flex-1 bg-netsurit-red text-white px-4 py-2 rounded-lg hover:bg-netsurit-coral transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingGoalEdit ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                <span>Save</span>
              </>
            )}
          </button>
          <button
            onClick={onCancelEditing}
            disabled={isSavingGoalEdit}
            className="flex-1 bg-professional-gray-200 text-professional-gray-700 px-4 py-2 rounded-lg hover:bg-professional-gray-300 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
