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
  Clock,
  TrendingUp,
  MessageSquare,
  User,
  Eye,
  Bookmark
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DreamCoachingModal = ({ dream, teamMember, onClose, onAddCoachNote }) => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [newCoachNote, setNewCoachNote] = useState('');
  const [coachNoteType, setCoachNoteType] = useState('observation');
  const [isAddingNote, setIsAddingNote] = useState(false);

  if (!dream || !teamMember) return null;

  const handleAddCoachNote = () => {
    if (newCoachNote.trim()) {
      const note = {
        id: Date.now(),
        dreamId: dream.id,
        teamMemberId: teamMember.id,
        coachId: currentUser.id,
        coachName: currentUser.name,
        note: newCoachNote,
        type: coachNoteType,
        createdAt: new Date().toISOString(),
        isCoachNote: true
      };
      
      if (onAddCoachNote) {
        onAddCoachNote(note);
      }
      
      setNewCoachNote('');
      setIsAddingNote(false);
    }
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
    return dream.milestones?.filter(m => m.completed).length || 0;
  };

  const getTotalMilestones = () => {
    return dream.milestones?.length || 0;
  };

  const dreamCoachNotes = dream.notes?.filter(note => note.isCoachNote) || [];
  const memberNotes = dream.notes?.filter(note => !note.isCoachNote) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-4 w-11/12 max-w-5xl">
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-2xl">
        {/* Header */}
          <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 sm:p-5 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl emoji-white">{getCategoryIcon(dream.category)}</span>
                  <div className="text-white min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{dream.title}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-white/80">
                  <span className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{teamMember.name}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Bookmark className="h-4 w-4" />
                    <span>{dream.category}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>{dream.progress}% complete</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
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
            </div>
          </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Dream Image */}
            <div className="flex-shrink-0">
              {dream.image ? (
                <img 
                  src={dream.image} 
                  alt={dream.title}
                      className="w-20 h-20 rounded-xl object-cover shadow-lg border-2 border-white"
                />
              ) : (
                    <div className="w-20 h-20 rounded-xl bg-professional-gray-200 flex items-center justify-center shadow-lg border-2 border-white">
                      <span className="text-2xl emoji-white">{getCategoryIcon(dream.category)}</span>
                </div>
              )}
            </div>
            {/* Progress Info */}
                <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-professional-gray-700">Overall Progress</span>
                    <span className="text-lg font-bold text-netsurit-red">{dream.progress}%</span>
              </div>
                  <div className="w-full bg-professional-gray-200 rounded-full h-3 shadow-inner border border-professional-gray-300">
                <div 
                      className="bg-gradient-to-r from-netsurit-red to-netsurit-coral h-3 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
                  style={{ width: `${dream.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-sm text-professional-gray-600 mt-3 leading-relaxed">{dream.description}</p>
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
                <span className="hidden sm:inline">Member Notes</span>
                <span className="sm:hidden">Notes</span>
                <span className="ml-1">({memberNotes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('coaching')}
                className={`flex-1 sm:flex-none py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === 'coaching'
                    ? 'border-netsurit-red text-netsurit-red bg-white'
                    : 'border-transparent text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-100'
              }`}
            >
                <span className="hidden sm:inline">Coaching Notes</span>
                <span className="sm:hidden">Coach</span>
                <span className="ml-1">({dreamCoachNotes.length})</span>
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
                    {dream.description || "This dream represents a personal goal or aspiration that the member is working towards achieving."}
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
                    {dream.motivation || `This ${dream.category.toLowerCase()} goal is important for personal growth and development, contributing to overall life satisfaction and achievement.`}
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
                    {dream.approach || `Through structured milestones and consistent progress tracking, this dream is being pursued with ${getTotalMilestones()} defined steps towards completion.`}
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
                            style={{ width: `${dream.progress}%` }}
                          ></div>
                        </div>
                            <span className="font-bold text-netsurit-red">{dream.progress}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                          <span className="text-sm font-medium text-professional-gray-600">Milestones Completed</span>
                          <span className="font-bold text-professional-gray-900">{getCompletedMilestones()}/{getTotalMilestones()}</span>
                    </div>
                    <div className="flex justify-between">
                          <span className="text-sm font-medium text-professional-gray-600">Member Notes</span>
                          <span className="font-bold text-professional-gray-900">{memberNotes.length}</span>
                    </div>
                    <div className="flex justify-between">
                          <span className="text-sm font-medium text-professional-gray-600">Coaching Notes</span>
                          <span className="font-bold text-professional-gray-900">{dreamCoachNotes.length}</span>
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
                    {dream.history?.slice(0, 3).map((entry) => (
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
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Milestones</h3>
                <div className="text-sm text-professional-gray-600">
                  {getCompletedMilestones()} of {getTotalMilestones()} completed
                </div>
              </div>
              
              <div className="space-y-3">
                {dream.milestones?.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
                    <p className="text-professional-gray-500">No milestones set yet</p>
                    <p className="text-sm mt-2 text-professional-gray-500">The team member hasn't added any milestones for this dream.</p>
                  </div>
                ) : (
                  dream.milestones?.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex items-center space-x-4 p-4 rounded-2xl border-2 shadow-lg transition-all duration-300 ${
                        milestone.completed
                          ? 'bg-professional-gray-50 border-professional-gray-300'
                          : 'bg-white border-professional-gray-200 hover:border-professional-gray-300 hover:shadow-xl'
                      }`}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-professional-gray-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 text-professional-gray-400 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1">
                        <p className={`font-medium ${
                          milestone.completed 
                            ? 'text-professional-gray-700 line-through' 
                            : 'text-professional-gray-900'
                        }`}>
                          {milestone.text}
                        </p>
                        <p className="text-sm text-professional-gray-500 mt-1">
                          Created {new Date(milestone.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-professional-gray-400 flex-shrink-0">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">View Only</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Member's Personal Notes</h3>
              <div className="space-y-4">
                {memberNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <Edit3 className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
                    <p className="text-professional-gray-500">No personal notes yet</p>
                    <p className="text-sm mt-2 text-professional-gray-500">The team member hasn't added any personal notes for this dream.</p>
                  </div>
                ) : (
                  memberNotes.map((note) => (
                    <div key={note.id} className="bg-white border border-professional-gray-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2 text-sm text-professional-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(note.timestamp).toLocaleDateString()} at {new Date(note.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-professional-gray-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'coaching' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Coaching Notes</h3>
                <button
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Coaching Note</span>
                </button>
              </div>

              {/* Add Coaching Note Form */}
              {isAddingNote && (
                <div className="bg-netsurit-light-coral/10 border border-netsurit-light-coral/30 rounded-2xl p-4 sm:p-5">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                      Note Type
                    </label>
                    <select
                      value={coachNoteType}
                      onChange={(e) => setCoachNoteType(e.target.value)}
                      className="w-full border border-professional-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200"
                    >
                      <option value="observation">Observation</option>
                      <option value="encouragement">Encouragement</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="concern">Concern</option>
                      <option value="milestone">Milestone Achievement</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-professional-gray-700 mb-2">
                      Coaching Note
                    </label>
                    <textarea
                      value={newCoachNote}
                      onChange={(e) => setNewCoachNote(e.target.value)}
                      placeholder="Add your coaching observations, suggestions, or encouragement..."
                      className="w-full h-32 border border-professional-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-netsurit-red focus:border-netsurit-red transition-all duration-200 resize-none"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddCoachNote}
                      className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white px-4 py-2 rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Note</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewCoachNote('');
                      }}
                      className="bg-professional-gray-200 text-professional-gray-700 px-4 py-2 rounded-xl hover:bg-professional-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Coaching Notes */}
              <div className="space-y-4">
                {dreamCoachNotes.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
                    <p className="text-professional-gray-500">No coaching notes yet</p>
                    <p className="text-sm mt-2 text-professional-gray-500">Add coaching insights and feedback to help guide the team member's progress.</p>
                  </div>
                ) : (
                  dreamCoachNotes.map((note) => (
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
                            Coach: {note.coachName}
                          </span>
                        </div>
                        <p className="text-professional-gray-800 leading-relaxed mb-3">{note.note}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-netsurit-red font-medium">
                            {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
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
                  ))
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamCoachingModal;
