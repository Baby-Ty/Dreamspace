// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { Target, Calendar, Plus } from 'lucide-react';
import { useCareerData } from '../../hooks/useCareerData';

export default function CareerGoalsTab({ onViewItem }) {
  const { careerGoals, addCareerGoal, isLoading, error } = useCareerData();
  
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    progress: 0,
    targetDate: '',
    status: 'Planned'
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
        <p>Error loading career goals: {error}</p>
      </div>
    );
  }

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
}

