// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

/**
 * Skills tab component for UserManagementModal
 */
export default function SkillsTab({ user }) {
  // Mock skills data - in a real app, this would come from user.skills
  const technicalSkills = [
    { name: 'JavaScript', level: 85, category: 'Programming' },
    { name: 'React', level: 80, category: 'Frontend' },
    { name: 'Node.js', level: 75, category: 'Backend' },
    { name: 'AWS', level: 70, category: 'Cloud' }
  ];

  const softSkills = [
    { name: 'Communication', level: 90 },
    { name: 'Leadership', level: 75 },
    { name: 'Problem Solving', level: 85 },
    { name: 'Teamwork', level: 88 }
  ];

  const getSkillColor = (level) => {
    if (level >= 80) return 'bg-gradient-to-r from-netsurit-red to-netsurit-coral';
    if (level >= 60) return 'bg-gradient-to-r from-netsurit-coral to-netsurit-orange';
    return 'bg-gradient-to-r from-netsurit-orange to-netsurit-warm-orange';
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Skills Assessment</h3>

      {/* Technical Skills */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
          <h4 className="text-lg font-bold text-professional-gray-900">Technical Skills</h4>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicalSkills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-professional-gray-900">{skill.name}</span>
                  <span className="text-sm text-professional-gray-600">{skill.level}%</span>
                </div>
                <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                  <div 
                    className={`h-3 rounded-full transition-all duration-700 ease-out shadow-lg ${getSkillColor(skill.level)}`}
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
                <span className="text-xs text-professional-gray-500">{skill.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Soft Skills */}
      <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
        <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
          <h4 className="text-lg font-bold text-professional-gray-900">Soft Skills</h4>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {softSkills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-professional-gray-900">{skill.name}</span>
                  <span className="text-sm text-professional-gray-600">{skill.level}%</span>
                </div>
                <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                  <div 
                    className={`h-3 rounded-full transition-all duration-700 ease-out shadow-lg ${getSkillColor(skill.level)}`}
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
