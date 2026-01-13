// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Edit3 } from 'lucide-react';

/**
 * Development Plan tab component for UserManagementModal
 */
export default function DevelopmentTab({ user, onOpenCareerModal }) {
  const developmentPlan = user.developmentPlan || [];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Development Plan</h3>
        <span className="text-sm text-professional-gray-600">{developmentPlan.length} activities</span>
      </div>

      <div className="space-y-4">
        {developmentPlan.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
            onClick={() => onOpenCareerModal(item, 'development')}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-professional-gray-900">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-professional-gray-600 mt-1">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.skills?.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-netsurit-light-coral/20 text-netsurit-red text-xs rounded-lg font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-netsurit-warm-orange/20 text-netsurit-orange text-xs rounded-lg font-medium">
                    {item.status}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCareerModal(item, 'development');
                    }}
                    className="text-netsurit-red hover:text-netsurit-coral text-sm font-medium flex items-center transition-colors duration-200"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-professional-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                  <div 
                    className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden" 
                    style={{ width: `${item.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
