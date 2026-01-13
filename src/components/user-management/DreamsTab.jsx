// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { BookOpen, Eye } from 'lucide-react';

/**
 * Dreams tab component for UserManagementModal
 */
export default function DreamsTab({ user, onOpenDreamModal }) {
  const dreams = user.sampleDreams || [];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Dream Book</h3>
        <span className="text-sm text-professional-gray-600">{dreams.length} dreams</span>
      </div>

      {dreams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {dreams.map((dream, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => onOpenDreamModal(dream)}
            >
              <img
                src={dream.image}
                alt={dream.title}
                className="w-full h-32 object-cover"
              />
              <div className="p-4 sm:p-5">
                <h4 className="font-bold text-professional-gray-900 mb-2">{dream.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-professional-gray-100 text-professional-gray-700 text-xs rounded-lg font-medium">
                    {dream.category}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDreamModal(dream);
                    }}
                    className="text-netsurit-red hover:text-netsurit-coral text-sm font-medium flex items-center transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
          <p className="text-professional-gray-500">No dreams created yet</p>
        </div>
      )}
    </div>
  );
}
