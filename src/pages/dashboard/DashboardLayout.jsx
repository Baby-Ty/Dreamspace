// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import DashboardHeader from './DashboardHeader';
import WeekGoalsWidget from './WeekGoalsWidget';
import DashboardDreamCard from './DashboardDreamCard';
import DreamTrackerModal from '../../components/DreamTrackerModal';
import GuideModal from '../../components/GuideModal';
import UserMigrationButton from '../../components/UserMigrationButton';

/**
 * Dashboard Layout Component
 * Orchestrates the dashboard page with header, week goals, and dream overview
 */
export default function DashboardLayout() {
  const { currentUser } = useApp();
  const {
    isLoadingWeekGoals,
    currentWeekGoals,
    stats,
    weeklyProgress,
    showAddGoal,
    setShowAddGoal,
    newGoal,
    setNewGoal,
    handleToggleGoal,
    handleAddGoal,
    loadCurrentWeekGoals,
    getCurrentWeekRange,
  } = useDashboardData();

  // Local UI state
  const [selectedDream, setSelectedDream] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  // Early return for loading
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netsurit-red mx-auto mb-4"></div>
          <p className="text-professional-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const handleCancelAddGoal = useCallback(() => {
    setShowAddGoal(false);
    setNewGoal({ title: '', description: '', dreamId: '' });
  }, [setShowAddGoal, setNewGoal]);

  const handleOpenDream = useCallback((dream) => {
    setSelectedDream(dream);
  }, []);

  const handleDreamUpdate = useCallback(() => {
    // Refresh dashboard data when dream is updated
    console.log('🔄 Dream updated, refreshing dashboard...');
    // Force refresh of current week goals
    loadCurrentWeekGoals();
  }, [loadCurrentWeekGoals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-4 sm:space-y-5" data-testid="dashboard-layout">
      {/* Header Section */}
      <DashboardHeader
        userName={currentUser.name.split(' ')[0]}
        stats={stats}
        onShowGuide={() => setShowGuide(true)}
      />

      {/* V1 to V3 Migration Banner - Only show for v1 users */}
      {currentUser.dataStructureVersion && currentUser.dataStructureVersion < 3 && (
        <UserMigrationButton userId={currentUser.id} />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
        {/* Left Column - Current Week Goals */}
        <WeekGoalsWidget
          currentWeekGoals={currentWeekGoals}
          weeklyProgress={weeklyProgress}
          weekRange={getCurrentWeekRange()}
          showAddGoal={showAddGoal}
          newGoal={newGoal}
          dreamBook={currentUser.dreamBook}
          isLoading={isLoadingWeekGoals}
          onToggleGoal={handleToggleGoal}
          onShowAddGoal={() => setShowAddGoal(true)}
          onHideAddGoal={handleCancelAddGoal}
          onAddGoal={handleAddGoal}
          onNewGoalChange={setNewGoal}
        />

        {/* Right Column - Dreams Overview */}
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between px-4 py-3 border-b border-professional-gray-200 bg-gradient-to-r from-professional-gray-50 to-white">
            <h2 className="text-xl font-bold text-professional-gray-900">My Dreams</h2>
            <Link 
              to="/dream-book"
              className="text-sm bg-gradient-to-r from-professional-gray-600 to-professional-gray-700 text-white px-4 py-2 rounded-lg hover:from-professional-gray-700 hover:to-professional-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-professional-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              View Dreams
            </Link>
          </div>

          <div className="p-4">
            {currentUser.dreamBook.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-professional-gray-300 mx-auto mb-4" />
                <p className="text-xl font-bold text-professional-gray-800 mb-2">No dreams yet!</p>
                <p className="text-professional-gray-600 mb-6">Create your first dream to get started.</p>
                <Link
                  to="/dream-book"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create Dream
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Grid of Dream Cards - 2 columns, up to 2 rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="dreams-grid">
                  {/* Existing Dreams (show up to 3) */}
                  {currentUser.dreamBook.slice(0, 3).map((dream) => (
                    <DashboardDreamCard
                      key={dream.id}
                      dream={dream}
                      onClick={() => handleOpenDream(dream)}
                    />
                  ))}

                  {/* Add Dream Card */}
                  <Link
                    to="/dream-book"
                    className="group relative flex flex-col items-center justify-center h-full bg-white rounded-xl border-2 border-dashed border-netsurit-red/30 hover:border-netsurit-red/60 hover:bg-gradient-to-br hover:from-netsurit-red/5 hover:to-netsurit-coral/5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] min-h-[280px]"
                    data-testid="add-dream-button"
                    aria-label="Add new dream"
                  >
                    <div className="text-center p-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-netsurit-red/10 group-hover:bg-netsurit-red/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                        <Plus className="w-8 h-8 text-netsurit-red group-hover:text-netsurit-coral transition-colors duration-300" aria-hidden="true" />
                      </div>
                      <p className="text-xl font-bold text-netsurit-red group-hover:text-netsurit-coral transition-colors duration-300 mb-2">Add Dream</p>
                      <p className="text-sm text-professional-gray-600 group-hover:text-professional-gray-700 transition-colors duration-300">Create a new dream entry</p>
                    </div>
                  </Link>
                </div>

                {/* Show link to view more if there are more than 3 dreams */}
                {currentUser.dreamBook.length > 3 && (
                  <Link
                    to="/dream-book"
                    className="block text-center py-3 text-netsurit-red hover:text-netsurit-coral font-semibold transition-colors"
                    data-testid="view-more-dreams"
                  >
                    View {currentUser.dreamBook.length - 3} more dreams →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dream Detail Modal */}
      {selectedDream && (
        <DreamTrackerModal
          dream={selectedDream}
          onClose={() => setSelectedDream(null)}
          onUpdate={handleDreamUpdate}
        />
      )}

      {/* Guide Modal */}
      {showGuide && (
        <GuideModal onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}

