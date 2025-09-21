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
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DreamTrackerModal = ({ dream, onClose, onUpdate }) => {
  const { updateDreamProgress, currentUser } = useApp();
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
      const milestone = {
        id: Date.now(),
        text: newMilestone.trim(),
        completed: false,
        createdAt: new Date().toISOString()
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-4 w-11/12 max-w-5xl">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl">
        {/* Header */}
          <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 sm:p-5 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl emoji-white">{getCategoryIcon(localDream.category)}</span>
                  <div className="text-white min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{localDream.title}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-white/80">
                  <span className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{currentUser?.name}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Bookmark className="h-4 w-4" />
                    <span>{localDream.category}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>{localDream.progress}% complete</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <button
                onClick={handleSave}
                    className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 font-medium"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            )}
            <button 
              onClick={onClose}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            >
              <X className="w-6 h-6" />
            </button>
              </div>
          </div>
        </div>

        {/* Progress Overview */}
          <div className="p-4 sm:p-5">
            <div className="bg-professional-gray-50 rounded-2xl p-4 sm:p-5 border border-professional-gray-200 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="font-bold text-professional-gray-900 text-lg">Progress Overview</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <span className="text-sm font-medium text-professional-gray-600 bg-white px-3 py-1 rounded-lg">
                {getCompletedMilestones()}/{getTotalMilestones()} milestones completed
              </span>
              <button
                onClick={toggleComplete}
                    className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
              >
                {localDream.progress === 100 ? 'Mark Incomplete' : 'Mark Complete'}
              </button>
            </div>
          </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Dream Image */}
            <div className="flex-shrink-0">
              {localDream.image ? (
                <img 
                  src={localDream.image} 
                  alt={localDream.title}
                      className="w-20 h-20 rounded-xl object-cover shadow-lg border-2 border-white"
                />
              ) : (
                    <div className="w-20 h-20 rounded-xl bg-professional-gray-200 flex items-center justify-center shadow-lg border-2 border-white">
                      <Target className="h-8 w-8 text-professional-gray-400" />
                </div>
              )}
            </div>
            {/* Progress Info */}
                <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-professional-gray-700">Overall Progress</span>
                    <span className="text-lg font-bold text-netsurit-red">{localDream.progress}%</span>
              </div>
                  <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                <div 
                      className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
                  style={{ width: `${localDream.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-sm text-professional-gray-600 mt-3 leading-relaxed">{localDream.description}</p>
                </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
          <div className="border-b border-professional-gray-200 bg-professional-gray-50">
            <nav className="flex space-x-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
                className={`flex-1 sm:flex-none py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'overview'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
                className={`flex-1 sm:flex-none py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
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
                className={`flex-1 sm:flex-none py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
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
                className={`flex-1 sm:flex-none py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
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
                className={`flex-1 sm:flex-none py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'history'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
              }`}
            >
              History ({localDream.history?.length || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
          <div className="p-4 sm:p-5 min-h-96">
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
              {/* Dream Overview - What, Why, How */}
              <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
                    <div className="p-4 sm:p-5">
                  <div className="flex items-center space-x-2 mb-4">
                        <div className="w-3 h-3 bg-netsurit-red rounded-full"></div>
                        <h4 className="font-bold text-professional-gray-900">What</h4>
                  </div>
                      <p className="text-professional-gray-700 leading-relaxed">
                    {localDream.description || "This dream represents a personal goal or aspiration that you're working towards achieving."}
                  </p>
                </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-3 h-3 bg-netsurit-coral rounded-full"></div>
                        <h4 className="font-bold text-professional-gray-900">Why</h4>
                      </div>
                      <p className="text-professional-gray-700 leading-relaxed">
                    {localDream.motivation || `This ${localDream.category.toLowerCase()} goal is important for your personal growth and development, contributing to overall life satisfaction and achievement.`}
                  </p>
                </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-3 h-3 bg-netsurit-orange rounded-full"></div>
                        <h4 className="font-bold text-professional-gray-900">How</h4>
                      </div>
                      <p className="text-professional-gray-700 leading-relaxed">
                    {localDream.approach || `Through structured milestones and consistent progress tracking, you're pursuing this dream with ${getTotalMilestones()} defined steps towards completion.`}
                  </p>
                    </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
                    <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
                      <h4 className="font-bold text-professional-gray-900 flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-netsurit-red" />
                    <span>Progress Statistics</span>
                  </h4>
                    </div>
                    <div className="p-4 sm:p-5">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-professional-gray-600">Overall Progress</span>
                      <div className="flex items-center space-x-2">
                            <div className="w-16 bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                          <div 
                                className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                            style={{ width: `${localDream.progress}%` }}
                          ></div>
                        </div>
                            <span className="font-bold text-netsurit-red">{localDream.progress}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                          <span className="text-sm font-medium text-professional-gray-600">Milestones Completed</span>
                          <span className="font-bold text-professional-gray-900">{getCompletedMilestones()}/{getTotalMilestones()}</span>
                    </div>
                    <div className="flex justify-between">
                          <span className="text-sm font-medium text-professional-gray-600">Personal Notes</span>
                          <span className="font-bold text-professional-gray-900">{localDream.notes?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                          <span className="text-sm font-medium text-professional-gray-600">Activity History</span>
                          <span className="font-bold text-professional-gray-900">{localDream.history?.length || 0}</span>
                        </div>
                      </div>
                  </div>
                </div>

                {/* Recent Activity */}
                  <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl">
                    <div className="p-4 sm:p-5 border-b border-professional-gray-200 bg-professional-gray-50">
                      <h4 className="font-bold text-professional-gray-900 flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-netsurit-red" />
                    <span>Recent Activity</span>
                  </h4>
                    </div>
                    <div className="p-4 sm:p-5">
                  <div className="space-y-3">
                    {localDream.history?.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-netsurit-coral rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                              <p className="text-sm text-professional-gray-700 font-medium">{entry.action}</p>
                              <p className="text-xs text-professional-gray-500">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                          </div>
                        )) || <p className="text-sm text-professional-gray-500 italic">No recent activity</p>}
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
  onDeleteMilestone 
}) => {
  const completedCount = milestones.filter(m => m.completed).length;
  
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Milestones</h3>
        <div className="text-sm text-professional-gray-600">
          {completedCount} of {milestones.length} completed
        </div>
      </div>

      {/* Add New Milestone */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={newMilestone}
          onChange={(e) => setNewMilestone(e.target.value)}
          placeholder="Add a new milestone..."
          className="flex-1 px-4 py-2 border border-professional-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
          onKeyPress={(e) => e.key === 'Enter' && onAddMilestone()}
        />
        <button
          onClick={onAddMilestone}
          disabled={!newMilestone.trim()}
          className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Milestones List */}
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
            <p className="text-professional-gray-500">No milestones yet. Add your first milestone above!</p>
          </div>
        ) : (
          milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`flex items-center space-x-4 p-4 rounded-2xl border-2 shadow-lg transition-all duration-300 ${
                milestone.completed
                  ? 'bg-professional-gray-50 border-professional-gray-300'
                  : 'bg-white border-professional-gray-200 hover:border-professional-gray-300 hover:shadow-xl'
              }`}
            >
              <button
                onClick={() => onToggleMilestone(milestone.id)}
                className="flex-shrink-0"
              >
                {milestone.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-professional-gray-600" />
                ) : (
                  <Circle className="w-6 h-6 text-professional-gray-400 hover:text-professional-gray-600 transition-colors duration-200" />
                )}
              </button>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  milestone.completed 
                    ? 'text-professional-gray-700 line-through' 
                    : 'text-professional-gray-900'
                }`}>
                  {milestone.text}
                </p>
              </div>
              
              <button
                onClick={() => onDeleteMilestone(milestone.id)}
                className="flex-shrink-0 p-2 text-netsurit-warm-orange hover:text-netsurit-red hover:bg-netsurit-light-coral/20 rounded-xl transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
    <div className="space-y-4 sm:space-y-5">
      <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Notes</h3>

      {/* Add New Note */}
      <div className="space-y-3">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note about your progress, thoughts, or experiences..."
          className="w-full h-32 px-4 py-3 border border-professional-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 resize-none"
        />
        <button
          onClick={onAddNote}
          disabled={!newNote.trim()}
          className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <Edit3 className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
            <p className="text-professional-gray-500">No notes yet. Add your first note above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-white border border-professional-gray-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 text-sm text-professional-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(note.timestamp)}</span>
                  </div>
                </div>
                <p className="text-professional-gray-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
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
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Coach Notes</h3>
        <span className="text-sm text-professional-gray-600 bg-netsurit-light-coral/20 text-netsurit-red px-3 py-1 rounded-lg font-medium">
          {coachNotes.length} coaching insights
        </span>
      </div>

      {coachNotes.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
          <p className="text-professional-gray-500">No coaching notes yet.</p>
          <p className="text-sm mt-2 text-professional-gray-500">Your coach will add insights and feedback here to help guide your progress.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coachNotes.map((note) => (
            <div key={note.id} className="bg-white border border-professional-gray-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-netsurit-red" />
                    <span className="text-sm font-medium text-professional-gray-800 capitalize">
                    {note.type?.replace('_', ' ') || 'Coach Note'}
                  </span>
                </div>
                  <span className="text-xs text-netsurit-red font-medium">
                  Coach: {note.coachName || 'Your Coach'}
                </span>
              </div>
                <p className="text-professional-gray-800 leading-relaxed mb-3">{note.note || note.text}</p>
              <div className="flex items-center justify-between text-sm">
                  <span className="text-netsurit-red font-medium">
                  {formatDate(note.createdAt || note.timestamp)}
                </span>
                {note.type && (
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
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
        return <TrendingUp className="w-4 h-4" />;
      case 'milestone':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'note':
        return <Edit3 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
    <div className="space-y-4 sm:space-y-5">
      <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">History</h3>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
          <p className="text-professional-gray-500">No history yet. Your progress updates will appear here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex items-start space-x-4 relative">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getHistoryColor(entry.type)}`}>
                {getHistoryIcon(entry.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white border border-professional-gray-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="p-4 sm:p-5">
                    <p className="text-professional-gray-900 font-medium">{entry.action}</p>
                    <p className="text-sm text-professional-gray-600 mt-1">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              </div>
              {index < history.length - 1 && (
                <div className="absolute left-5 top-10 w-0.5 h-4 bg-professional-gray-200"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamTrackerModal;