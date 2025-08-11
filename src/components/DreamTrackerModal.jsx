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
  TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DreamTrackerModal = ({ dream, onClose, onUpdate }) => {
  const { updateDreamProgress } = useApp();
  const [activeInfoTab, setActiveInfoTab] = useState('notes');
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

  // Brand gradient for progress indicators (consistent across app)
  const brandGradient = 'from-blue-500 via-indigo-500 to-purple-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-3 z-[1000]">
      <div className="relative bg-white rounded-xl shadow-md p-4 w-full max-w-5xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header with inline progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{localDream.title}</h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded">{localDream.category}</span>
            <div className="ml-auto flex items-center gap-3 min-w-[220px] w-full sm:w-auto">
              <span className="text-lg font-extrabold text-gray-900 whitespace-nowrap">{localDream.progress}%</span>
              <div className="w-full sm:w-48 bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${brandGradient} h-2 rounded-full transition-all`}
                  style={{ width: `${localDream.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            {hasChanges && (
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
            <button
              onClick={toggleComplete}
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {localDream.progress === 100 ? 'Completed' : 'Mark as Complete'}
            </button>
          </div>
        </div>

        {/* Main body */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6">
          {/* Left column: Content card */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
              {localDream.image && (
                <img
                  src={localDream.image}
                  alt={localDream.title}
                  className="rounded-lg w-full object-cover mb-3"
                />
              )}
              {localDream.description && (
                <p className="text-gray-700 text-sm leading-relaxed">{localDream.description}</p>
              )}
            </div>
          </div>

          {/* Right column: Milestones (sticky) */}
          <div className="md:pl-1">
            <div className="sticky top-4 bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800">Milestones</h3>
              <div className="space-y-2">
                {localDream.milestones && localDream.milestones.length > 0 ? (
                  localDream.milestones.map((milestone) => (
                    <div key={milestone.id} className="group flex items-start gap-3">
                      <button onClick={() => toggleMilestone(milestone.id)} className="mt-0.5">
                        {milestone.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`${milestone.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{milestone.text}</p>
                      </div>
                      <button
                        onClick={() => deleteMilestone(milestone.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">No milestones yet.</div>
                )}
              </div>
              {!isAddingMilestone ? (
                <button
                  onClick={() => setIsAddingMilestone(true)}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-sm mt-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </button>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { addMilestone(); setIsAddingMilestone(false); }
                    }}
                    placeholder="New milestone..."
                    className="flex-1 input-field"
                  />
                  <button
                    onClick={() => { addMilestone(); setIsAddingMilestone(false); }}
                    disabled={!newMilestone.trim()}
                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setIsAddingMilestone(false); setNewMilestone(''); }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Full-width Notes & History on larger screens */}
          <div className="space-y-3 md:col-span-2 lg:col-span-2">
            <div className="border-b">
              <div role="tablist" className="flex gap-6">
                <button
                  role="tab"
                  aria-selected={activeInfoTab === 'notes'}
                  onClick={() => setActiveInfoTab('notes')}
                  className={`py-2 text-sm font-medium ${activeInfoTab === 'notes' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Notes
                </button>
                <button
                  role="tab"
                  aria-selected={activeInfoTab === 'history'}
                  onClick={() => setActiveInfoTab('history')}
                  className={`py-2 text-sm font-medium ${activeInfoTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  History
                </button>
              </div>
            </div>
            <div>
              {activeInfoTab === 'notes' ? (
                <div className="space-y-4">
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                      placeholder="Quick add a note..."
                      className="flex-1 input-field"
                    />
                    <button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {localDream.notes && localDream.notes.length > 0 ? (
                      [...localDream.notes].map((note) => (
                        <div key={note.id} className="bg-white border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(note.timestamp)}</span>
                          </div>
                          <p className="text-gray-800 text-sm whitespace-pre-wrap">{note.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No notes yet.</div>
                    )}
                  </div>
                </div>
              ) : (
                <HistoryTab history={localDream.history} formatDate={formatDate} />
              )}
            </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Milestones</h3>
        <div className="text-sm text-gray-600">
          {completedCount} of {milestones.length} completed
        </div>
      </div>

      {/* Add New Milestone */}
      <div className="flex space-x-3">
        <input
          type="text"
          value={newMilestone}
          onChange={(e) => setNewMilestone(e.target.value)}
          placeholder="Add a new milestone..."
          className="flex-1 input-field"
          onKeyPress={(e) => e.key === 'Enter' && onAddMilestone()}
        />
        <button
          onClick={onAddMilestone}
          disabled={!newMilestone.trim()}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Milestones List */}
      <div className="space-y-3">
        {milestones.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No milestones yet. Add your first milestone above!</p>
          </div>
        ) : (
          milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all ${
                milestone.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => onToggleMilestone(milestone.id)}
                className="flex-shrink-0"
              >
                {milestone.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                )}
              </button>
              
              <div className="flex-1">
                <p className={`font-medium ${
                  milestone.completed 
                    ? 'text-green-800 line-through' 
                    : 'text-gray-900'
                }`}>
                  {milestone.text}
                </p>
              </div>
              
              <button
                onClick={() => onDeleteMilestone(milestone.id)}
                className="flex-shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Notes</h3>

      {/* Add New Note */}
      <div className="space-y-3">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note about your progress, thoughts, or experiences..."
          className="w-full h-32 input-field resize-none"
        />
        <button
          onClick={onAddNote}
          disabled={!newNote.trim()}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Edit3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No notes yet. Add your first note above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(note.timestamp)}</span>
                </div>
              </div>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
            </div>
          ))
        )}
      </div>
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
        return 'text-blue-600 bg-blue-100';
      case 'milestone':
        return 'text-green-600 bg-green-100';
      case 'note':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">History</h3>

      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No history yet. Your progress updates will appear here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getHistoryColor(entry.type)}`}>
                {getHistoryIcon(entry.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <p className="text-gray-900 font-medium">{entry.action}</p>
                  <p className="text-sm text-gray-600 mt-1">{formatDate(entry.timestamp)}</p>
                </div>
              </div>
              {index < history.length - 1 && (
                <div className="absolute left-5 mt-10 w-0.5 h-4 bg-gray-200"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamTrackerModal;