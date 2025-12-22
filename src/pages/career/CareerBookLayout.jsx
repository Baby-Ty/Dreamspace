// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useState, lazy, Suspense } from 'react';
import { Briefcase, User, Target, TrendingUp, Award } from 'lucide-react';
import { useCareerData } from '../../hooks/useCareerData';
import CareerTrackerModal from '../../components/CareerTrackerModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import HelpTooltip from '../../components/HelpTooltip';

// Lazy load tab components with named chunks
const MyCareerTab = lazy(() => import(/* webpackChunkName: "career-my-career" */ './MyCareerTab'));
const CareerGoalsTab = lazy(() => import(/* webpackChunkName: "career-goals" */ './CareerGoalsTab'));
const DevelopmentPlanTab = lazy(() => import(/* webpackChunkName: "career-development" */ './DevelopmentPlanTab'));
const MySkillsTab = lazy(() => import(/* webpackChunkName: "career-skills" */ './MySkillsTab'));

export default function CareerBookLayout() {
  const { updateCareerGoal, updateDevelopmentPlan, isLoading } = useCareerData();
  
  const [activeTab, setActiveTab] = useState('my-career');
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingType, setViewingType] = useState(null);

  const tabs = [
    { id: 'my-career', name: 'My Career', icon: User },
    { id: 'career-goals', name: 'Career Goals', icon: Target },
    { id: 'development-plan', name: 'Development Plan', icon: TrendingUp },
    { id: 'my-skills', name: 'My Skills', icon: Award },
  ];

  const handleViewItem = (item, type) => {
    setViewingItem(item);
    setViewingType(type);
  };

  const handleCloseModal = () => {
    setViewingItem(null);
    setViewingType(null);
  };

  const handleUpdateItem = (updatedItem, type) => {
    if (type === 'goal') {
      updateCareerGoal(updatedItem);
    } else {
      updateDevelopmentPlan(updatedItem);
    }
    setViewingItem(null);
    setViewingType(null);
  };

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netsurit-red mx-auto mb-4"></div>
          <p className="text-professional-gray-600">Loading Career Book...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 xl:px-16 py-2 space-y-3 sm:space-y-3">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-3 mb-2">
              <Briefcase className="h-8 w-8 text-netsurit-red" />
              <h1 className="text-3xl font-bold text-professional-gray-900">
                Career Book
              </h1>
              <HelpTooltip 
                title="Career Book Guide"
                content="Manage your professional development journey. Track career goals, create a development plan, document your skills and experiences. Use tabs to navigate between different sections and update your progress regularly."
              />
            </div>
            <p className="text-professional-gray-600">
              Track your career journey, goals, and professional development
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation & Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-professional-gray-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-professional-gray-200">
          <nav className="flex space-x-0" aria-label="Career Book Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white shadow-lg'
                      : 'text-professional-gray-600 hover:text-professional-gray-900 hover:bg-professional-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content with Suspense */}
        <div className="p-4 sm:p-5">
          <Suspense fallback={<LoadingSpinner />}>
            {activeTab === 'my-career' && <MyCareerTab />}
            {activeTab === 'career-goals' && <CareerGoalsTab onViewItem={handleViewItem} />}
            {activeTab === 'development-plan' && <DevelopmentPlanTab onViewItem={handleViewItem} />}
            {activeTab === 'my-skills' && <MySkillsTab />}
          </Suspense>
        </div>
      </div>

      {/* Career Tracker Modal */}
      {viewingItem && (
        <CareerTrackerModal
          careerItem={viewingItem}
          type={viewingType}
          onClose={handleCloseModal}
          onUpdate={handleUpdateItem}
        />
      )}
    </div>
  );
}

