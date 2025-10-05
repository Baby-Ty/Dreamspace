// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useEffect, useRef, useCallback } from 'react';
import { X, BarChart3, Users2, Target, MessageSquare, TrendingUp, Mail, MapPin } from 'lucide-react';
import { useCoachDetail } from './useCoachDetail';
import CoachMetrics from './CoachMetrics';
import TeamMemberList from './TeamMemberList';
import CoachingAlerts from './CoachingAlerts';

/**
 * Modal shell for coach details
 * Handles layout, accessibility, focus trap, and keyboard navigation
 * All business logic delegated to useCoachDetail hook
 * All presentation delegated to child components
 */
export default function CoachDetailModal({ coach, onClose }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const {
    activeTab,
    setActiveTab,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    teamMetrics,
    coachingAlerts,
    filteredAndSortedMembers,
    summaryMetrics,
    getStatusColor,
    getStatusText
  } = useCoachDetail(coach);

  // Focus management
  useEffect(() => {
    // Focus close button on mount
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    // Store previously focused element
    const previouslyFocusedElement = document.activeElement;

    return () => {
      // Restore focus on unmount
      if (previouslyFocusedElement && previouslyFocusedElement.focus) {
        previouslyFocusedElement.focus();
      }
    };
  }, []);

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Escape key handler
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [handleEscapeKey]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Early return if no coach or team metrics
  if (!coach || !teamMetrics) {
    console.log('🚫 CoachDetailModal: No coach or teamMetrics', { 
      hasCoach: !!coach, 
      hasTeamMetrics: !!teamMetrics 
    });
    return null;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'team-members', name: 'Team Members', icon: Users2 },
    { id: 'performance', name: 'Performance', icon: TrendingUp },
  ];

  const isActiveTab = (tabId) => activeTab === tabId;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl border border-professional-gray-200 shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <img
                src={coach.avatar}
                alt={`${coach.name}'s profile`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=EC4B5C&color=fff&size=100`;
                }}
              />
              <div className="text-white min-w-0">
                <h1 
                  id="coach-modal-title"
                  className="text-xl sm:text-3xl font-bold text-white"
                >
                  {coach.name}
                </h1>
                <p className="text-base sm:text-xl text-white/80 mb-2">Dream Coach</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/80">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" aria-hidden="true" />
                    <span className="text-sm">{coach.email}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" aria-hidden="true" />
                    <span className="text-sm">{coach.office}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    Team Size: {summaryMetrics?.teamSize || 0}
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    Avg Score: {summaryMetrics?.averageScore || 0}
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    Engagement: {summaryMetrics?.engagementRate || 0}%
                  </span>
                </div>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="self-start sm:self-center p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
              aria-label="Close coach detail modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Alerts Banner */}
        {coachingAlerts.length > 0 && (
          <div className="bg-netsurit-warm-orange/10 border-b border-netsurit-warm-orange/30 px-6 py-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-netsurit-warm-orange" />
              <span className="text-sm font-medium text-netsurit-orange">
                {coachingAlerts.length} team member(s) need attention
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-professional-gray-200 bg-professional-gray-50">
          <div className="px-6">
            <nav 
              className="flex space-x-8"
              role="tablist"
              aria-label="Coach detail sections"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActiveTab(tab.id)
                        ? 'border-netsurit-red text-netsurit-red'
                        : 'border-transparent text-professional-gray-500 hover:text-professional-gray-700 hover:border-professional-gray-300'
                    }`}
                    role="tab"
                    aria-selected={isActiveTab(tab.id)}
                    aria-controls={`${tab.id}-panel`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{tab.name}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(95vh-300px)]">
          {activeTab === 'overview' && (
            <div
              role="tabpanel"
              id="overview-panel"
              aria-labelledby="overview-tab"
            >
              <div className="space-y-6">
                <CoachMetrics 
                  metrics={summaryMetrics} 
                  coach={coach}
                />
                
                {coachingAlerts.length > 0 && (
                  <CoachingAlerts alerts={coachingAlerts} />
                )}
              </div>
            </div>
          )}

          {activeTab === 'team-members' && (
            <div
              role="tabpanel"
              id="team-members-panel"
              aria-labelledby="team-members-tab"
            >
              <TeamMemberList
                members={filteredAndSortedMembers}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onViewMember={(member) => console.log('View member:', member)}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            </div>
          )}

          {activeTab === 'performance' && (
            <div
              role="tabpanel"
              id="performance-panel"
              aria-labelledby="performance-tab"
            >
              <CoachMetrics 
                metrics={summaryMetrics} 
                coach={coach}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

