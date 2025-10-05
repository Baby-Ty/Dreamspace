// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState } from 'react';
import { Award, Plus, Edit3, Save, X } from 'lucide-react';
import { useCareerData } from '../../hooks/useCareerData';

export default function MySkillsTab() {
  const { careerProfile, updateSkill, addSkill, updateCareerProfile, isLoading, error } = useCareerData();
  
  const [showAddSkill, setShowAddSkill] = useState(null);
  const [newSkill, setNewSkill] = useState({ name: '', level: 50, category: '' });
  const [editingSkill, setEditingSkill] = useState(null);

  const technicalSkills = careerProfile.skills?.technical || [];
  const softSkills = careerProfile.skills?.soft || [];

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
        <p>Error loading skills: {error}</p>
      </div>
    );
  }

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

  const renderSkillSection = (title, skillType, skills) => (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
          <Award className="w-4 h-4 mr-2 text-professional-gray-600" />
          {title}
        </h3>
        <button
          onClick={() => setShowAddSkill(skillType)}
          className="text-netsurit-red hover:text-netsurit-coral text-sm flex items-center"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Skill
        </button>
      </div>

      {/* Add Skill Form */}
      {showAddSkill === skillType && (
        <div className="mb-4 p-4 bg-professional-gray-50 rounded-lg border border-professional-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-professional-gray-700 mb-1">Skill Name</label>
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder={skillType === 'technical' ? "e.g., React, Python" : "e.g., Leadership"}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-professional-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={newSkill.category}
                onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 rounded-md border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                placeholder="e.g., Frontend, Communication"
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
              onClick={() => handleAddSkill(skillType)}
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

      {/* Skills List */}
      <div className="space-y-3">
        {skills.length > 0 ? (
          skills.map((skill, index) => (
            <div key={skill.id || index} className="p-3 bg-professional-gray-50 rounded-md border border-professional-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-professional-gray-900 text-sm">{skill.name}</h4>
                  {skill.category && (
                    <p className="text-xs text-professional-gray-500">{skill.category}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {editingSkill === `${skillType}-${index}` ? (
                    <>
                      <button
                        onClick={() => setEditingSkill(null)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingSkill(null)}
                        className="text-professional-gray-600 hover:text-professional-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingSkill(`${skillType}-${index}`)}
                        className="text-netsurit-red hover:text-netsurit-coral"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skillType, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingSkill === `${skillType}-${index}` ? (
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={skill.level}
                  onChange={(e) => handleUpdateSkill(skillType, index, 'level', parseInt(e.target.value))}
                  className="w-full slider"
                />
              ) : (
                <>
                  <div className="flex justify-between text-xs text-professional-gray-600 mb-1">
                    <span>Proficiency</span>
                    <span>{skill.level}%</span>
                  </div>
                  <div className="w-full bg-professional-gray-200 rounded-full h-2">
                    <div 
                      className={`${getSkillColor(skill.level)} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-professional-gray-500 italic text-center py-4">
            No {title.toLowerCase()} added yet.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-professional-gray-900 mb-1">My Skills</h2>
        <p className="text-sm text-professional-gray-600">Track your technical and soft skills proficiency levels</p>
      </div>

      {renderSkillSection('Technical Skills', 'technical', technicalSkills)}
      {renderSkillSection('Soft Skills', 'soft', softSkills)}
    </div>
  );
}

