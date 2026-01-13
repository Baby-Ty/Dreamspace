// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Edit3 } from 'lucide-react';

/**
 * Career Goals tab component for UserManagementModal
 */
export default function CareerGoalsTab({ user, onOpenCareerModal }) {
  const careerGoals = user.careerGoals || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-netsurit-warm-orange/20 text-netsurit-orange';
      case 'Planned':
        return 'bg-netsurit-light-coral/20 text-netsurit-coral';
      case 'Completed':
        return 'bg-netsurit-red/20 text-netsurit-red';
      default:
        return 'bg-professional-gray-100 text-professional-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Career Goals</h3>
        <span className="text-sm text-gray-600">{careerGoals.length} goals</span>
      </div>

      <div className="space-y-4">
        {careerGoals.map((goal) => (
          <div 
            key={goal.id} 
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onOpenCareerModal(goal, 'goal')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{goal.title}</h4>
                {goal.description && (
                  <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCareerModal(goal, 'goal');
                }}
                className="text-netsurit-red hover:text-netsurit-coral text-sm font-medium flex items-center"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-professional-gray-600 mb-1">
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                <div 
                  className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden" 
                  style={{ width: `${goal.progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
