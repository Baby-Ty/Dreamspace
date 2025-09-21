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
  Briefcase
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const CareerTrackerModal = ({ careerItem, type, onClose, onUpdate }) => {
  const { updateCareerProgress } = useApp();
  const [activeInfoTab, setActiveInfoTab] = useState('notes');
  const [localItem, setLocalItem] = useState({
    ...careerItem,
    milestones: careerItem.milestones || [],
    notes: careerItem.notes || [],
    history: careerItem.history || []
  });
  const [newMilestone, setNewMilestone] = useState('');
  const [newNote, setNewNote] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  useEffect(() => {
    setLocalItem({
      ...careerItem,
      milestones: careerItem.milestones || [],
      notes: careerItem.notes || [],
      history: careerItem.history || []
    });
  }, [careerItem]);

  const handleProgressChange = (newProgress) => {
    const updatedItem = { ...localItem, progress: newProgress };
    setLocalItem(updatedItem);
    setHasChanges(true);
    
    // Add to history
    const historyEntry = {
      id: Date.now(),
      type: 'progress',
      action: `Progress updated to ${newProgress}%`,
      timestamp: new Date().toISOString(),
      oldValue: localItem.progress,
      newValue: newProgress
    };
    
    updatedItem.history = [historyEntry, ...updatedItem.history];
    setLocalItem(updatedItem);
    
    // Update global state
    if (updateCareerProgress) {
      updateCareerProgress(careerItem.id, newProgress, type);
    }
  };

  const toggleComplete = () => {
    const isComplete = localItem.progress === 100;
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
      
      const updatedItem = {
        ...localItem,
        milestones: [...localItem.milestones, milestone]
      };
      
      setLocalItem(updatedItem);
      setNewMilestone('');
      setHasChanges(true);
      
      // Add to history
      const historyEntry = {
        id: Date.now(),
        type: 'milestone',
        action: `Added milestone: "${milestone.text}"`,
        timestamp: new Date().toISOString()
      };
      
      updatedItem.history = [historyEntry, ...updatedItem.history];
      setLocalItem(updatedItem);
    }
  };

  const toggleMilestone = (milestoneId) => {
    const updatedMilestones = localItem.milestones.map(milestone =>
      milestone.id === milestoneId 
        ? { ...milestone, completed: !milestone.completed }
        : milestone
    );
    
    const milestone = localItem.milestones.find(m => m.id === milestoneId);
    const updatedItem = { ...localItem, milestones: updatedMilestones };
    setLocalItem(updatedItem);
    setHasChanges(true);
    
    // Add to history
    const historyEntry = {
      id: Date.now(),
      type: 'milestone',
      action: `${milestone.completed ? 'Uncompleted' : 'Completed'} milestone: "${milestone.text}"`,
      timestamp: new Date().toISOString()
    };
    
    updatedItem.history = [historyEntry, ...updatedItem.history];
    setLocalItem(updatedItem);
  };

  const deleteMilestone = (milestoneId) => {
    const milestone = localItem.milestones.find(m => m.id === milestoneId);
    const updatedMilestones = localItem.milestones.filter(m => m.id !== milestoneId);
    const updatedItem = { ...localItem, milestones: updatedMilestones };
    setLocalItem(updatedItem);
    setHasChanges(true);
    
    // Add to history
    const historyEntry = {
      id: Date.now(),
      type: 'milestone',
      action: `Deleted milestone: "${milestone.text}"`,
      timestamp: new Date().toISOString()
    };
    
    updatedItem.history = [historyEntry, ...updatedItem.history];
    setLocalItem(updatedItem);
  };

  const addNote = () => {
    if (newNote.trim()) {
      const note = {
        id: Date.now(),
        text: newNote.trim(),
        timestamp: new Date().toISOString()
      };
      
      const updatedItem = {
        ...localItem,
        notes: [note, ...localItem.notes]
      };
      
      setLocalItem(updatedItem);
      setNewNote('');
      setHasChanges(true);
      
      // Add to history
      const historyEntry = {
        id: Date.now(),
        type: 'note',
        action: 'Added new note',
        timestamp: new Date().toISOString()
      };
      
      updatedItem.history = [historyEntry, ...updatedItem.history];
      setLocalItem(updatedItem);
    }
  };

  const handleSave = () => {
    onUpdate(localItem, type);
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

  // Brand gradient for progress indicators
  const brandGradient = 'from-netsurit-red to-netsurit-coral';

  const getTypeIcon = () => {
    return type === 'goal' ? <Target className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />;
  };

  const getTypeLabel = () => {
    return type === 'goal' ? 'Career Goal' : 'Development Plan';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-3 z-[1000]">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-professional-gray-200 p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto space-y-6">
        <div className="absolute top-6 right-6">
          <button
            onClick={onClose}
            className="p-2 text-professional-gray-400 hover:text-professional-gray-600 rounded-full hover:bg-professional-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header with inline progress */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-netsurit-red to-netsurit-coral rounded-xl flex items-center justify-center text-white shadow-lg">
              {getTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-professional-gray-900 leading-tight">{localItem.title}</h2>
                <span className="bg-netsurit-light-coral/20 text-netsurit-red text-xs px-3 py-1 rounded-full font-medium">{getTypeLabel()}</span>
              </div>
              {localItem.description && (
                <p className="text-professional-gray-600 text-sm leading-relaxed mb-4">{localItem.description}</p>
              )}
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-professional-gray-900">{localItem.progress || 0}%</span>
                <div className="flex-1 max-w-md bg-professional-gray-200 rounded-full h-3 shadow-inner">
                  <div
                    className={`bg-gradient-to-r ${brandGradient} h-3 rounded-full transition-all duration-500 shadow-sm`}
                    style={{ width: `${localItem.progress || 0}%` }}
                  ></div>
                </div>
                <button
                  onClick={toggleComplete}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-professional-gray-300 text-professional-gray-700 hover:bg-professional-gray-50 hover:border-professional-gray-400 transition-all duration-200"
                >
                  {localItem.progress === 100 ? 'Completed ✓' : 'Mark as Complete'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-professional-gray-200">
            {localItem.targetDate && (
              <div className="flex items-center gap-2 text-sm text-professional-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Target: {new Date(localItem.targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {hasChanges && (
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main body */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
          {/* Left column: Skills card */}
          {localItem.skills && localItem.skills.length > 0 && (
            <div className="space-y-4">
              <div className="bg-professional-gray-50 border border-professional-gray-200 rounded-2xl shadow-sm p-6">
                <h4 className="text-base font-semibold text-professional-gray-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-netsurit-red" />
                  Skills to Develop
                </h4>
                <div className="flex flex-wrap gap-2">
                  {localItem.skills.map((skill, index) => (
                    <span key={index} className="bg-netsurit-light-coral/20 text-netsurit-red text-sm px-3 py-2 rounded-xl font-medium border border-netsurit-light-coral/30">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Right column: Milestones (sticky) */}
          <div className="lg:pl-1">
            <div className="sticky top-4 bg-white rounded-2xl p-6 space-y-4 border border-professional-gray-200 shadow-lg">
              <h3 className="text-base font-semibold text-professional-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-netsurit-red" />
                Milestones
              </h3>
              <div className="space-y-3">
                {localItem.milestones && localItem.milestones.length > 0 ? (
                  localItem.milestones.map((milestone) => (
                    <div key={milestone.id} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-professional-gray-50 transition-colors">
                      <button onClick={() => toggleMilestone(milestone.id)} className="mt-0.5">
                        {milestone.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-professional-gray-400 hover:text-netsurit-red transition-colors" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm ${milestone.completed ? 'text-professional-gray-500 line-through' : 'text-professional-gray-900'}`}>{milestone.text}</p>
                      </div>
                      <button
                        onClick={() => deleteMilestone(milestone.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-professional-gray-500 text-sm text-center py-4 italic">No milestones yet.</div>
                )}
              </div>
              {!isAddingMilestone ? (
                <button
                  onClick={() => setIsAddingMilestone(true)}
                  className="inline-flex items-center gap-2 text-netsurit-red hover:text-netsurit-coral text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { addMilestone(); setIsAddingMilestone(false); }
                    }}
                    placeholder="New milestone..."
                    className="w-full p-3 rounded-xl border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { addMilestone(); setIsAddingMilestone(false); }}
                      disabled={!newMilestone.trim()}
                      className="px-4 py-2 text-sm bg-netsurit-red text-white rounded-xl disabled:opacity-50 hover:bg-netsurit-coral transition-colors font-medium"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setIsAddingMilestone(false); setNewMilestone(''); }}
                      className="px-4 py-2 text-sm border border-professional-gray-300 rounded-xl hover:bg-professional-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full-width Notes & History on larger screens */}
          <div className="space-y-6 md:col-span-2 lg:col-span-2">
            <div className="border-b border-professional-gray-200">
              <div role="tablist" className="flex gap-8">
                <button
                  role="tab"
                  aria-selected={activeInfoTab === 'notes'}
                  onClick={() => setActiveInfoTab('notes')}
                  className={`py-3 text-sm font-semibold transition-colors ${activeInfoTab === 'notes' ? 'text-netsurit-red border-b-2 border-netsurit-red' : 'text-professional-gray-600 hover:text-professional-gray-900'}`}
                >
                  Notes
                </button>
                <button
                  role="tab"
                  aria-selected={activeInfoTab === 'history'}
                  onClick={() => setActiveInfoTab('history')}
                  className={`py-3 text-sm font-semibold transition-colors ${activeInfoTab === 'history' ? 'text-netsurit-red border-b-2 border-netsurit-red' : 'text-professional-gray-600 hover:text-professional-gray-900'}`}
                >
                  History
                </button>
              </div>
            </div>
            <div>
              {activeInfoTab === 'notes' ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                      placeholder="Quick add a note..."
                      className="flex-1 p-3 rounded-xl border border-professional-gray-300 text-sm focus:ring-2 focus:ring-netsurit-red focus:border-transparent"
                    />
                    <button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl disabled:opacity-50 hover:from-netsurit-coral hover:to-netsurit-orange transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {localItem.notes && localItem.notes.length > 0 ? (
                      [...localItem.notes].map((note) => (
                        <div key={note.id} className="bg-professional-gray-50 border border-professional-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 text-xs text-professional-gray-600 mb-3">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(note.timestamp)}</span>
                          </div>
                          <p className="text-professional-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-professional-gray-500">
                        <p className="text-sm italic">No notes yet. Add your first note above!</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <HistoryTab history={localItem.history} formatDate={formatDate} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// History Tab Component
const HistoryTab = ({ history, formatDate }) => {
  const getHistoryIcon = (type) => {
    switch (type) {
      case 'progress':
        return <TrendingUp className="w-5 h-5" />;
      case 'milestone':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'note':
        return <Edit3 className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getHistoryColor = (type) => {
    switch (type) {
      case 'progress':
        return 'text-netsurit-red bg-netsurit-light-coral/20 border-netsurit-light-coral/30';
      case 'milestone':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'note':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      default:
        return 'text-professional-gray-600 bg-professional-gray-100 border-professional-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {history.length === 0 ? (
        <div className="text-center py-12 text-professional-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
          <p className="text-sm italic">No history yet. Your progress updates will appear here!</p>
        </div>
      ) : (
        <div className="space-y-5 relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-professional-gray-200"></div>
          
          {history.map((entry, index) => (
            <div key={entry.id} className="flex items-start space-x-4 relative">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center shadow-sm ${getHistoryColor(entry.type)} relative z-10`}>
                {getHistoryIcon(entry.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-professional-gray-50 border border-professional-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <p className="text-professional-gray-900 font-medium text-sm">{entry.action}</p>
                  <div className="flex items-center gap-2 text-xs text-professional-gray-600 mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(entry.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareerTrackerModal;
