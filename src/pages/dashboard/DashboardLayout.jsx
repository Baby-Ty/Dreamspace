// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { usePastWeeks } from '../../hooks/usePastWeeks';
import { useWeekRollover } from '../../hooks/useWeekRollover';
import { testWeekRollover } from '../../services/testService';
import DashboardHeader from './DashboardHeader';
import WeekGoalsWidget from './WeekGoalsWidget';
import DashboardDreamCard from './DashboardDreamCard';
import DreamTrackerModal from '../../components/DreamTrackerModal';
import GuideModal from '../../components/GuideModal';
import PastWeeksModal from '../../components/PastWeeksModal';
import UserMigrationButton from '../../components/UserMigrationButton';
import AIImageGenerator from '../../components/AIImageGenerator';
import { showToast } from '../../utils/toast';

/**
 * Dashboard Layout Component
 * Orchestrates the dashboard page with header, week goals, and dream overview
 */
export default function DashboardLayout() {
  const { currentUser, updateDream } = useApp();
  
  // Week rollover check (fallback - primary is server-side timer)
  useWeekRollover();
  
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
    handleDecrementGoal,
    handleSkipGoal,
    handleAddGoal,
    handleUpdateGoalBackground,
    loadCurrentWeekGoals,
    getCurrentWeekRange,
  } = useDashboardData();

  // Fetch past weeks data
  const { weeks: pastWeeks, isLoading: isLoadingPastWeeks, refresh: refreshPastWeeks } = usePastWeeks(currentUser?.id, 24);

  // Local UI state
  const [selectedDream, setSelectedDream] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showPastWeeks, setShowPastWeeks] = useState(false);
  const [isRollingOver, setIsRollingOver] = useState(false);
  
  // AI Background Generator state
  const [showAIBackgroundGenerator, setShowAIBackgroundGenerator] = useState(false);
  const [selectedGoalForBackground, setSelectedGoalForBackground] = useState(null);
  
  // Refresh past weeks when modal opens
  const handleShowPastWeeks = useCallback(() => {
    setShowPastWeeks(true);
    refreshPastWeeks(); // Refresh data when modal opens
  }, [refreshPastWeeks]);

  // Listen for week rollover events and refresh dashboard data
  useEffect(() => {
    const handleWeekRollover = async (event) => {
      const { fromWeek, toWeek, stats } = event.detail;
      console.log('🔄 Week rollover event received:', { fromWeek, toWeek });
      
      // Wait a moment for Cosmos DB eventual consistency
      setTimeout(async () => {
        // Refresh current week goals (will auto-instantiate new goals)
        await loadCurrentWeekGoals();
        // Refresh past weeks to show the newly archived week
        refreshPastWeeks();
        console.log('✅ Dashboard refreshed after week rollover');
      }, 1000);
    };

    window.addEventListener('week-rolled-over', handleWeekRollover);
    return () => {
      window.removeEventListener('week-rolled-over', handleWeekRollover);
    };
  }, [loadCurrentWeekGoals, refreshPastWeeks]);
  
  // Test week rollover handler
  const handleTestRollover = useCallback(async () => {
    if (!currentUser?.id) return;
    
    const confirmed = window.confirm(
      '🧪 TEST MODE: Simulate week rollover?\n\n' +
      'This will:\n' +
      '• Archive current week to pastWeeks\n' +
      '• Decrement remaining weeks on goals (-1)\n' +
      '• Create new week with goals from templates\n\n' +
      'Continue?'
    );
    
    if (!confirmed) return;
    
    setIsRollingOver(true);
    try {
      const result = await testWeekRollover(currentUser.id, true); // Force rollover
      
      if (result.success) {
        if (result.rolled) {
          alert(`✅ Week rollover successful!\n\n` +
            `From: ${result.fromWeek}\n` +
            `To: ${result.toWeek}\n` +
            `Goals: ${result.goalsCount}\n\n` +
            `Refreshing dashboard...`);
          
          // ⏱️ Wait for Cosmos DB eventual consistency before loading goals
          // Use event-driven refresh instead of page reload to prevent reload loop
          setTimeout(async () => {
            await loadCurrentWeekGoals();
            refreshPastWeeks();
            console.log('✅ Dashboard refreshed after test rollover');
          }, 2000); // Wait 2 seconds to allow for eventual consistency
        } else {
          alert(`ℹ️ ${result.message || 'No rollover needed'}`);
        }
      } else {
        alert(`❌ Rollover failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Test rollover error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsRollingOver(false);
    }
  }, [currentUser?.id, loadCurrentWeekGoals, refreshPastWeeks]);

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
    setNewGoal({ title: '', description: '', dreamId: '', consistency: 'weekly', targetWeeks: 12, targetMonths: 6, frequency: 1, targetDate: '' });
  }, [setShowAddGoal, setNewGoal]);

  const handleOpenDream = useCallback((dream) => {
    setSelectedDream(dream);
  }, []);

  const handleDreamUpdate = useCallback(async (updatedDream) => {
    // Refresh dashboard data when dream is updated
    console.log('🔄 Dream updated, refreshing dashboard...');
    
    // Update dream in AppContext if provided
    if (updatedDream) {
      await updateDream(updatedDream);
    }
    
    // Force refresh of current week goals
    await loadCurrentWeekGoals();
    
    // Dispatch events to ensure all components refresh
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('dreams-updated'));
      window.dispatchEvent(new CustomEvent('goals-updated'));
    }, 300);
  }, [loadCurrentWeekGoals, updateDream]);

  // AI Background Generator handlers
  const handleOpenAIBackgroundGenerator = useCallback((goal) => {
    setSelectedGoalForBackground(goal);
    setShowAIBackgroundGenerator(true);
  }, []);

  const handleSelectAIBackground = useCallback(async (imageUrl) => {
    if (!selectedGoalForBackground) return;

    try {
      const result = await handleUpdateGoalBackground(
        selectedGoalForBackground.id,
        imageUrl
      );

      if (result.success) {
        console.log('✅ Goal background updated successfully');
        showToast('Background image updated successfully', 'success');
        setShowAIBackgroundGenerator(false);
        setSelectedGoalForBackground(null);
      } else {
        showToast(`Failed to update background: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating goal background:', error);
      showToast('Failed to update background image', 'error');
    }
  }, [selectedGoalForBackground, handleUpdateGoalBackground]);

  const handleCloseAIBackgroundGenerator = useCallback(() => {
    setShowAIBackgroundGenerator(false);
    setSelectedGoalForBackground(null);
  }, []);

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
          onDecrementGoal={handleDecrementGoal}
          onSkipGoal={handleSkipGoal}
          onShowAddGoal={() => setShowAddGoal(true)}
          onHideAddGoal={handleCancelAddGoal}
          onAddGoal={handleAddGoal}
          onNewGoalChange={setNewGoal}
          onShowPastWeeks={handleShowPastWeeks}
          onTestRollover={currentUser?.id ? handleTestRollover : undefined}
          isRollingOver={isRollingOver}
        />

        {/* Right Column - Dreams Overview */}
        <div className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between px-4 py-3 border-b border-professional-gray-200 bg-gradient-to-r from-professional-gray-50/80 to-white">
            <div>
              <h2 className="text-xl font-bold text-professional-gray-900 inline-block">
                My Dreams
                <span className="block h-0.5 mt-1 bg-gradient-to-r from-netsurit-coral to-netsurit-orange rounded-full"></span>
              </h2>
              <p className="text-xs text-professional-gray-600 mt-1">Your personal and professional aspirations</p>
            </div>
            <Link 
              to="/dream-book"
              className="text-sm bg-netsurit-red text-white px-4 py-2 rounded-lg hover:bg-netsurit-red font-semibold focus:outline-none focus:ring-2 focus:ring-netsurit-red focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              View All
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

      {/* Past Weeks Modal */}
      <PastWeeksModal
        isOpen={showPastWeeks}
        onClose={() => setShowPastWeeks(false)}
        weeks={pastWeeks || []}
        isLoading={isLoadingPastWeeks}
      />

      {/* AI Background Generator Modal */}
      {showAIBackgroundGenerator && (
        <AIImageGenerator
          onSelectImage={handleSelectAIBackground}
          onClose={handleCloseAIBackgroundGenerator}
        />
      )}
    </div>
  );
}

