// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { TrendingUp, Calendar, Plus, Trash2 } from 'lucide-react';
import { useCareerData } from '../../hooks/useCareerData';

export default function DevelopmentPlanTab({ onViewItem }) {
  const { developmentPlan, addDevelopmentPlan, isLoading, error } = useCareerData();
  
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    progress: 0,
    targetDate: '',
    status: 'Planned',
    skills: []
  });

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
        <p>Error loading development plan: {error}</p>
      </div>
    );
  }

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
}

