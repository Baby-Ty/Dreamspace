import React, { useState, useEffect } from 'react';
import { 
  X, 
  Target, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  Edit3, 
  Save,
  Trash2,
  Clock,
  Award,
  TrendingUp,
  Bookmark,
  User,
  MessageSquare,
  Repeat
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import MilestoneAccordion from './MilestoneAccordion';

const DreamTrackerModal = ({ dream, onClose, onUpdate }) => {
  const { updateDreamProgress, currentUser, weeklyGoals, addWeeklyGoal, updateWeeklyGoal } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [localDream, setLocalDream] = useState({
    ...dream,
    milestones: dream.milestones || [],
    notes: dream.notes || [],
    history: dream.history || []
  });
  const [newMilestone, setNewMilestone] = useState('');
  const [newNote, setNewNote] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneEditData, setMilestoneEditData] = useState({
    text: '',
    type: 'consistency',
    targetWeeks: 12,
    startDate: '',
    endOnDreamComplete: false
  });
  
  // Goal modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalFormData, setGoalFormData] = useState({
    title: '',
    description: '',
    milestoneId: null,
    recurrence: 'once',
    weekLog: {}
  });


  useEffect(() => {
    setLocalDream({
      ...dream,
      milestones: dream.milestones || [],
      notes: dream.notes || [],
      history: dream.history || []
    });
  }, [dream]);

  const handleProgressChange = (newProgress) => {
    const updatedDream = { ...localDream, progress: newProgress };
    setLocalDream(updatedDream);
    setHasChanges(true);
    
    // Add to history
    const historyEntry = {
      id: Date.now(),
      type: 'progress',
      action: `Progress updated to ${newProgress}%`,
      timestamp: new Date().toISOString(),
      oldValue: localDream.progress,
      newValue: newProgress
    };
    
    updatedDream.history = [historyEntry, ...updatedDream.history];
    setLocalDream(updatedDream);
    
    // Update global state
    updateDreamProgress(dream.id, newProgress);
  };

  const toggleComplete = () => {
    const isComplete = localDream.progress === 100;
    const newProgress = isComplete ? 90 : 100;
    handleProgressChange(newProgress);
  };

  const addMilestone = () => {
    if (newMilestone.trim()) {
      const nowIso = new Date().toISOString();
      const milestone = {
        id: Date.now(),
        text: newMilestone.trim(),
        completed: false,
        createdAt: nowIso,
        // Default to consistency milestone with 12 weeks
        coachManaged: true,
        type: 'consistency',
        targetWeeks: 12,
        startDate: nowIso,
        endOnDreamComplete: false,
        streakWeeks: 0
      };
      
      const updatedDream = {
        ...localDream,
        milestones: [...localDream.milestones, milestone]
      };
      
      setLocalDream(updatedDream);
      setNewMilestone('');
      setHasChanges(true);
      
      // Add to history
      const historyEntry = {
        id: Date.now(),
        type: 'milestone',
        action: `Added milestone: "${milestone.text}"`,
        timestamp: new Date().toISOString()
      };
      
      updatedDream.history = [historyEntry, ...updatedDream.history];
      setLocalDream(updatedDream);
      
      // Auto-create weekly recurring goal for consistency milestone
      const weeklyGoal = {
        id: Date.now() + Math.random(),
        title: localDream.title,
        description: `Track progress for ${milestone.text}`,
        dreamId: localDream.id,
        dreamTitle: localDream.title,
        dreamCategory: localDream.category,
        completed: false,
        milestoneId: milestone.id,
        recurrence: 'weekly',
        active: true,
        weekLog: {},
        recurring: true,
        createdAt: nowIso
      };
      
      // Add the goal to the global state
      addWeeklyGoal(weeklyGoal);
    }
  };

  const toggleMilestone = (milestoneId) => {
    const updatedMilestones = localDream.milestones.map(milestone =>
      milestone.id === milestoneId 
        ? { ...milestone, completed: !milestone.completed }
        : milestone
    );
    
    const milestone = localDream.milestones.find(m => m.id === milestoneId);
    const updatedDream = { ...localDream, milestones: updatedMilestones };
    setLocalDream(updatedDream);
    setHasChanges(true);
    
    // Add to history
    const historyEntry = {
      id: Date.now(),
      type: 'milestone',
      action: `${milestone.completed ? 'Uncompleted' : 'Completed'} milestone: "${milestone.text}"`,
      timestamp: new Date().toISOString()
    };
    
    updatedDream.history = [historyEntry, ...updatedDream.history];
    setLocalDream(updatedDream);
  };

  const deleteMilestone = (milestoneId) => {
    const milestone = localDream.milestones.find(m => m.id === milestoneId);
    const updatedMilestones = localDream.milestones.filter(m => m.id !== milestoneId);
    const updatedDream = { ...localDream, milestones: updatedMilestones };
    setLocalDream(updatedDream);
    setHasChanges(true);
    
    // Add to history
    const historyEntry = {
      id: Date.now(),
      type: 'milestone',
      action: `Deleted milestone: "${milestone.text}"`,
      timestamp: new Date().toISOString()
    };
    
    updatedDream.history = [historyEntry, ...updatedDream.history];
    setLocalDream(updatedDream);
  };

  const startEditingMilestone = (milestone) => {
    setEditingMilestone(milestone.id);
    setMilestoneEditData({
      text: milestone.text,
      type: milestone.type || 'consistency',
      targetWeeks: milestone.targetWeeks || 12,
      startDate: milestone.startDate || new Date().toISOString(),
      endOnDreamComplete: milestone.endOnDreamComplete || false
    });
  };

  const cancelEditingMilestone = () => {
    setEditingMilestone(null);
    setMilestoneEditData({
      text: '',
      type: 'consistency',
      targetWeeks: 12,
      startDate: '',
      endOnDreamComplete: false
    });
  };

  const saveEditedMilestone = () => {
    if (!milestoneEditData.text.trim()) return;

    const updatedMilestones = localDream.milestones.map(milestone =>
      milestone.id === editingMilestone
        ? {
            ...milestone,
            text: milestoneEditData.text.trim(),
            type: milestoneEditData.type,
            targetWeeks: milestoneEditData.targetWeeks,
            startDate: milestoneEditData.startDate,
            endOnDreamComplete: milestoneEditData.endOnDreamComplete
          }
        : milestone
    );

    const updatedDream = { ...localDream, milestones: updatedMilestones };
    setLocalDream(updatedDream);
    setHasChanges(true);

    // Add to history
    const historyEntry = {
      id: Date.now(),
      type: 'milestone',
      action: `Updated milestone: "${milestoneEditData.text}"`,
      timestamp: new Date().toISOString()
    };

    updatedDream.history = [historyEntry, ...updatedDream.history];
    setLocalDream(updatedDream);

    cancelEditingMilestone();
  };

  const addNote = () => {
    if (newNote.trim()) {
      const note = {
        id: Date.now(),
        text: newNote.trim(),
        timestamp: new Date().toISOString()
      };
      
      const updatedDream = {
        ...localDream,
        notes: [note, ...localDream.notes]
      };
      
      setLocalDream(updatedDream);
      setNewNote('');
      setHasChanges(true);
      
      // Add to history
      const historyEntry = {
        id: Date.now(),
        type: 'note',
        action: 'Added new note',
        timestamp: new Date().toISOString()
      };
      
      updatedDream.history = [historyEntry, ...updatedDream.history];
      setLocalDream(updatedDream);
    }
  };

  const handleAddGoalToMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    setEditingGoal(null);
    setGoalFormData({
      title: '',
      description: '',
      milestoneId: milestone.id,
      recurrence: 'once',
      weekLog: {}
    });
    setShowGoalModal(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    const milestone = localDream.milestones.find(m => m.id === goal.milestoneId);
    setSelectedMilestone(milestone);
    setGoalFormData({
      title: goal.title,
      description: goal.description || '',
      milestoneId: goal.milestoneId,
      recurrence: goal.recurrence || 'weekly',
      weekLog: goal.weekLog || {}
    });
    setShowGoalModal(true);
  };

  const handleSaveGoal = () => {
    if (!goalFormData.title.trim()) return;
    
    if (editingGoal) {
      // Update existing goal
      const updatedGoal = {
        ...editingGoal,
        title: goalFormData.title.trim(),
        description: goalFormData.description.trim(),
        recurrence: goalFormData.recurrence
      };
      updateWeeklyGoal(updatedGoal);
    } else {
      // Create new goal
      const newGoal = {
        id: Date.now(),
        title: goalFormData.title.trim(),
        description: goalFormData.description.trim(),
        completed: false,
        dreamId: localDream.id,
        dreamTitle: localDream.title,
        dreamCategory: localDream.category,
        milestoneId: goalFormData.milestoneId,
        recurrence: goalFormData.recurrence,
        active: true,
        createdAt: new Date().toISOString()
      };

      if (newGoal.recurrence === 'weekly') {
        newGoal.weekLog = {};
      }

      addWeeklyGoal(newGoal);
    }
    
    // Reset form and close modal
    setGoalFormData({
      title: '',
      description: '',
      milestoneId: null,
      recurrence: 'once',
      weekLog: {}
    });
    setShowGoalModal(false);
    setSelectedMilestone(null);
    setEditingGoal(null);
  };

  const handleSave = () => {
    onUpdate(localDream);
    setHasChanges(false);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Health': '💪',
      'Travel': '✈️',
      'Career': '💼',
      'Learning': '📚',
      'Creative': '🎨',
      'Financial': '💰',
      'Relationships': '👥',
      'Adventure': '⚡',
      'Spiritual': '🙏',
      'Community': '🤝'
    };
    return icons[category] || '🎯';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-netsurit-red';
    if (progress >= 50) return 'bg-netsurit-coral';
    if (progress >= 20) return 'bg-netsurit-orange';
    return 'bg-professional-gray-400';
  };

  const getCompletedMilestones = () => {
    return localDream.milestones?.filter(m => m.completed).length || 0;
  };

  const getTotalMilestones = () => {
    return localDream.milestones?.length || 0;
  };

  // Brand gradient for progress indicators (consistent across app)
  const brandGradient = 'from-netsurit-red via-netsurit-coral to-netsurit-orange';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl flex flex-col max-h-full overflow-hidden">
        {/* Header */}
          <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral p-3 sm:p-4 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
              <span className="text-xl sm:text-2xl emoji-white flex-shrink-0">{getCategoryIcon(localDream.category)}</span>
                  <div className="text-white min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">{localDream.title}</h2>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                  <span className="flex items-center space-x-1">
                    <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{localDream.category}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{localDream.progress}%</span>
                  </span>
                </div>
              </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {hasChanges && (
              <button
                onClick={handleSave}
                    className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-lg hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-1.5 text-sm font-medium"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
            <button 
              onClick={onClose}
                  className="p-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X className="w-5 h-5" />
            </button>
              </div>
          </div>
        </div>

        {/* Progress Overview - Compact */}
          <div className="p-3 sm:p-4 border-b border-professional-gray-200 bg-professional-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {localDream.image && (
                  <img 
                    src={localDream.image} 
                    alt={localDream.title}
                    className="w-16 h-16 rounded-lg object-cover shadow-md border border-white flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-professional-gray-600">Overall Progress</span>
                    <span className="text-sm font-bold text-netsurit-red">{localDream.progress}%</span>
                  </div>
                  <div className="w-full bg-professional-gray-200 rounded-full h-2 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${localDream.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-professional-gray-600 mt-2 line-clamp-1">{localDream.description}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-professional-gray-600 bg-white px-2 py-1 rounded-md whitespace-nowrap">
                  {getCompletedMilestones()}/{getTotalMilestones()} milestones
                </span>
                <button
                  onClick={toggleComplete}
                  className="bg-professional-gray-500 text-white px-3 py-1.5 rounded-lg hover:bg-professional-gray-600 focus:outline-none focus:ring-2 focus:ring-professional-gray-400 transition-all duration-200 text-xs font-medium shadow-md whitespace-nowrap"
                >
                  {localDream.progress === 100 ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
              </div>
            </div>
        </div>

        {/* Navigation Tabs */}
          <div className="border-b border-professional-gray-200 bg-professional-gray-50 flex-shrink-0">
            <nav className="flex space-x-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'overview'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'milestones'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
              }`}
            >
                <span className="hidden sm:inline">Milestones</span>
                <span className="sm:hidden">Miles</span>
                <span className="ml-1">({getTotalMilestones()})</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'notes'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
              }`}
            >
                <span className="hidden sm:inline">Personal Notes</span>
                <span className="sm:hidden">Notes</span>
                <span className="ml-1">({localDream.notes?.filter(note => !note.isCoachNote).length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('coach-notes')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'coach-notes'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
              }`}
            >
                <span className="hidden sm:inline">Coach Notes</span>
                <span className="sm:hidden">Coach</span>
                <span className="ml-1">({localDream.notes?.filter(note => note.isCoachNote).length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
                className={`flex-1 sm:flex-none py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                activeTab === 'history'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
              }`}
            >
              History ({localDream.history?.length || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              {/* Dream Overview - What, Why, How */}
              <div className="space-y-3">
                  <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
                    <div className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-netsurit-red rounded-full"></div>
                        <h4 className="font-bold text-professional-gray-900 text-sm">What</h4>
                  </div>
                      <p className="text-professional-gray-700 leading-relaxed text-sm">
                    {localDream.description || "This dream represents a personal goal or aspiration that you're working towards achieving."}
                  </p>
                </div>
                  </div>

                  <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
                    <div className="p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-netsurit-coral rounded-full"></div>
                        <h4 className="font-bold text-professional-gray-900 text-sm">Why</h4>
                      </div>
                      <p className="text-professional-gray-700 leading-relaxed text-sm">
                    {localDream.motivation || `This ${localDream.category.toLowerCase()} goal is important for your personal growth and development, contributing to overall life satisfaction and achievement.`}
                  </p>
                </div>
                  </div>

                  <div className="bg-white rounded-xl border border-professional-gray-200 shadow-md">
                    <div className="p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-netsurit-orange rounded-full"></div>
                        <h4 className="font-bold text-professional-gray-900 text-sm">How</h4>
                      </div>
                      <p className="text-professional-gray-700 leading-relaxed text-sm">
                    {localDream.approach || `Through structured milestones and consistent progress tracking, you're pursuing this dream with ${getTotalMilestones()} defined steps towards completion.`}
                  </p>
                    </div>
                </div>
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
                          <span className="text-xs font-medium text-professional-gray-600">Milestones Completed</span>
                          <span className="font-bold text-professional-gray-900 text-xs">{getCompletedMilestones()}/{getTotalMilestones()}</span>
                    </div>
                    <div className="flex justify-between">
                          <span className="text-xs font-medium text-professional-gray-600">Personal Notes</span>
                          <span className="font-bold text-professional-gray-900 text-xs">{localDream.notes?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                          <span className="text-xs font-medium text-professional-gray-600">Activity History</span>
                          <span className="font-bold text-professional-gray-900 text-xs">{localDream.history?.length || 0}</span>
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
          )}

          {activeTab === 'milestones' && (
            <MilestonesTab
              milestones={localDream.milestones}
              newMilestone={newMilestone}
              setNewMilestone={setNewMilestone}
              onAddMilestone={addMilestone}
              onToggleMilestone={toggleMilestone}
              onDeleteMilestone={deleteMilestone}
              onAddGoalToMilestone={handleAddGoalToMilestone}
              onEditGoal={handleEditGoal}
              dreamId={localDream.id}
              dreamProgress={localDream.progress}
              weeklyGoals={weeklyGoals}
              editingMilestone={editingMilestone}
              onStartEditingMilestone={startEditingMilestone}
              onCancelEditingMilestone={cancelEditingMilestone}
              onSaveEditedMilestone={saveEditedMilestone}
              milestoneEditData={milestoneEditData}
              setMilestoneEditData={setMilestoneEditData}
            />
          )}

          {activeTab === 'notes' && (
            <NotesTab 
              notes={localDream.notes?.filter(note => !note.isCoachNote) || []}
              newNote={newNote}
              setNewNote={setNewNote}
              onAddNote={addNote}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'coach-notes' && (
            <CoachNotesTab 
              coachNotes={localDream.notes?.filter(note => note.isCoachNote) || []}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab 
              history={localDream.history || []}
              formatDate={formatDate}
            />
          )}
          </div>
        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getCategoryIcon(localDream.category)}</div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-professional-gray-900">
                      {editingGoal ? 'Edit Goal' : 'Add Goal'}
                    </h3>
                    <p className="text-sm text-professional-gray-600">
                      {selectedMilestone?.text}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowGoalModal(false);
                    setSelectedMilestone(null);
                    setEditingGoal(null);
                  }}
                  className="p-2 text-professional-gray-400 hover:text-professional-gray-600 hover:bg-professional-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-5">
              {/* Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSaveGoal(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    value={goalFormData.title}
                    onChange={(e) => setGoalFormData({ ...goalFormData, title: e.target.value })}
                    placeholder="What do you want to accomplish?"
                    className="w-full px-4 py-2 border border-professional-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={goalFormData.description}
                    onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
                    placeholder="Add more details about your goal..."
                    className="w-full px-4 py-2 border border-professional-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 h-20 resize-none"
                  />
                </div>

                {/* Recurrence Selection */}
                <div>
                  <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                    Goal Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setGoalFormData({ ...goalFormData, recurrence: 'once' })}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        goalFormData.recurrence === 'once'
                          ? 'border-netsurit-red bg-netsurit-red/5 text-netsurit-red font-medium'
                          : 'border-professional-gray-300 text-professional-gray-600 hover:border-professional-gray-400'
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-sm font-semibold">One-time Goal</div>
                        <div className="text-xs mt-1">Complete once</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalFormData({ ...goalFormData, recurrence: 'weekly' })}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        goalFormData.recurrence === 'weekly'
                          ? 'border-netsurit-red bg-netsurit-red/5 text-netsurit-red font-medium'
                          : 'border-professional-gray-300 text-professional-gray-600 hover:border-professional-gray-400'
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-sm font-semibold flex items-center space-x-1.5">
                          <Repeat className="w-4 h-4" />
                          <span>Recurring Weekly</span>
                        </div>
                        <div className="text-xs mt-1">Track each week</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recurring Info - Only show when weekly selected */}
                {goalFormData.recurrence === 'weekly' && (
                  <div className="flex items-start space-x-3 p-3 bg-netsurit-light-coral/20 rounded-lg border border-netsurit-coral/30">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-professional-gray-900">
                        Weekly Goal Benefits
                      </p>
                      <p className="text-xs text-professional-gray-600 mt-1">
                        Track completion each week to build your consistency streak
                      </p>
                    </div>
                  </div>
                )}

                {selectedMilestone?.coachManaged && selectedMilestone?.type === 'consistency' && (
                  <div className="flex items-start space-x-3 p-3 bg-netsurit-warm-orange/20 rounded-lg border border-netsurit-orange/30">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-professional-gray-900">
                        ⭐ Linked to Coach Milestone
                      </p>
                      <p className="text-xs text-professional-gray-600 mt-1">
                        Your weekly completions will count toward the "{selectedMilestone.text}" milestone
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoalModal(false);
                      setSelectedMilestone(null);
                      setEditingGoal(null);
                    }}
                    className="flex-1 px-4 py-2 border border-professional-gray-300 text-professional-gray-700 rounded-xl hover:bg-professional-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!goalFormData.title.trim()}
                    className="flex-1 bg-professional-gray-500 text-white px-4 py-2 rounded-xl hover:bg-professional-gray-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingGoal ? 'Save Changes' : 'Add Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// (Old OverviewTab removed; layout now handled directly in modal)

// Milestones Tab Component
const MilestonesTab = ({ 
  milestones, 
  newMilestone, 
  setNewMilestone, 
  onAddMilestone, 
  onToggleMilestone, 
  onDeleteMilestone,
  onAddGoalToMilestone,
  onEditGoal,
  dreamId,
  dreamProgress,
  weeklyGoals,
  editingMilestone,
  onStartEditingMilestone,
  onCancelEditingMilestone,
  onSaveEditedMilestone,
  milestoneEditData,
  setMilestoneEditData
}) => {
  const completedCount = milestones.filter(m => m.completed).length;
  
  // Get linked goals for each milestone
  const getLinkedGoals = (milestoneId) => {
    return weeklyGoals.filter(goal => 
      goal.milestoneId === milestoneId && goal.dreamId === dreamId
    );
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-professional-gray-900">Milestones</h3>
        <div className="text-xs text-professional-gray-600">
          {completedCount} of {milestones.length} completed
        </div>
      </div>

      {/* Add New Milestone */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newMilestone}
          onChange={(e) => setNewMilestone(e.target.value)}
          placeholder="Add a new milestone..."
          className="flex-1 px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 text-sm"
          onKeyPress={(e) => e.key === 'Enter' && onAddMilestone()}
          aria-label="New milestone title"
        />
        <button
          onClick={onAddMilestone}
          disabled={!newMilestone.trim()}
          className="bg-professional-gray-500 text-white px-3 py-2 rounded-lg hover:bg-professional-gray-600 focus:outline-none focus:ring-2 focus:ring-professional-gray-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 text-sm"
          aria-label="Add milestone"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Add</span>
        </button>
      </div>

      {/* Milestones List with Accordion */}
      <div className="space-y-2" role="list" aria-label="Milestones">
        {milestones.length === 0 ? (
          <div className="text-center py-8" role="status">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-professional-gray-300" aria-hidden="true" />
            <p className="text-professional-gray-500 text-sm">No milestones yet. Add your first milestone above!</p>
          </div>
        ) : (
          milestones.map((milestone) => (
            <div key={milestone.id} role="listitem">
              <MilestoneAccordion
                milestone={milestone}
                linkedGoals={getLinkedGoals(milestone.id)}
                onToggleMilestone={onToggleMilestone}
                onDeleteMilestone={onDeleteMilestone}
                onAddGoalToMilestone={onAddGoalToMilestone}
                onEditGoal={onEditGoal}
                dreamProgress={dreamProgress}
                isEditing={editingMilestone === milestone.id}
                onStartEditing={onStartEditingMilestone}
                onCancelEditing={onCancelEditingMilestone}
                onSaveEditing={onSaveEditedMilestone}
                editData={milestoneEditData}
                setEditData={setMilestoneEditData}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Notes Tab Component
const NotesTab = ({ notes, newNote, setNewNote, onAddNote, formatDate }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-professional-gray-900">Notes</h3>

      {/* Add New Note */}
      <div className="space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note about your progress, thoughts, or experiences..."
          className="w-full h-24 px-3 py-2 border border-professional-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 resize-none text-sm"
        />
        <button
          onClick={onAddNote}
          disabled={!newNote.trim()}
          className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-3 py-1.5 rounded-lg hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 text-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-2">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <Edit3 className="w-10 h-10 mx-auto mb-3 text-professional-gray-300" />
            <p className="text-professional-gray-500 text-sm">No notes yet. Add your first note above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-white border border-professional-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 text-xs text-professional-gray-600">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(note.timestamp)}</span>
                  </div>
                </div>
                <p className="text-professional-gray-800 leading-relaxed whitespace-pre-wrap text-sm">{note.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Coach Notes Tab Component
const CoachNotesTab = ({ coachNotes, formatDate }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-professional-gray-900">Coach Notes</h3>
        <span className="text-xs text-professional-gray-600 bg-netsurit-light-coral/20 text-netsurit-red px-2 py-1 rounded-md font-medium">
          {coachNotes.length} insights
        </span>
      </div>

      {coachNotes.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-professional-gray-300" />
          <p className="text-professional-gray-500 text-sm">No coaching notes yet.</p>
          <p className="text-xs mt-2 text-professional-gray-500">Your coach will add insights and feedback here to help guide your progress.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coachNotes.map((note) => (
            <div key={note.id} className="bg-white border border-professional-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-netsurit-red" />
                    <span className="text-xs font-medium text-professional-gray-800 capitalize">
                    {note.type?.replace('_', ' ') || 'Coach Note'}
                  </span>
                </div>
                  <span className="text-xs text-netsurit-red font-medium">
                  {note.coachName || 'Your Coach'}
                </span>
              </div>
                <p className="text-professional-gray-800 leading-relaxed mb-2 text-sm">{note.note || note.text}</p>
              <div className="flex items-center justify-between text-xs">
                  <span className="text-netsurit-red font-medium">
                  {formatDate(note.createdAt || note.timestamp)}
                </span>
                {note.type && (
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      note.type === 'encouragement' ? 'bg-professional-gray-100 text-professional-gray-700' :
                      note.type === 'suggestion' ? 'bg-netsurit-light-coral/20 text-netsurit-red' :
                      note.type === 'concern' ? 'bg-netsurit-warm-orange/20 text-netsurit-orange' :
                      note.type === 'milestone' ? 'bg-netsurit-coral/20 text-netsurit-coral' :
                      'bg-professional-gray-100 text-professional-gray-700'
                  }`}>
                    {note.type.replace('_', ' ')}
                  </span>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// History Tab Component
const HistoryTab = ({ history, formatDate }) => {
  const getHistoryIcon = (type) => {
    switch (type) {
      case 'progress':
        return <TrendingUp className="w-3 h-3" />;
      case 'milestone':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'note':
        return <Edit3 className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getHistoryColor = (type) => {
    switch (type) {
      case 'progress':
        return 'text-netsurit-red bg-netsurit-light-coral/20';
      case 'milestone':
        return 'text-netsurit-coral bg-netsurit-coral/20';
      case 'note':
        return 'text-netsurit-orange bg-netsurit-orange/20';
      default:
        return 'text-professional-gray-600 bg-professional-gray-100';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-professional-gray-900">History</h3>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-10 h-10 mx-auto mb-3 text-professional-gray-300" />
          <p className="text-professional-gray-500 text-sm">No history yet. Your progress updates will appear here!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex items-start space-x-3 relative">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getHistoryColor(entry.type)}`}>
                {getHistoryIcon(entry.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white border border-professional-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="p-3">
                    <p className="text-professional-gray-900 font-medium text-sm">{entry.action}</p>
                    <p className="text-xs text-professional-gray-600 mt-1">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              </div>
              {index < history.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-2 bg-professional-gray-200"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamTrackerModal;