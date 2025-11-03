import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  ArrowLeft,
  X,
  Target,
  Calendar,
  Repeat,
  Plus,
  Minus,
  Edit3,
  Heart,
  TrendingUp,
  Zap,
  Shield,
  Compass,
  Star,
  Mountain,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const VisionBuilderDemo = () => {
  const navigate = useNavigate();
  const { addDream, addWeeklyGoal, currentUser } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    vibe: null,
    themes: [],
    aspirations: [],
    dreams: [],
    focusDreams: [],
    milestones: {},
    weeklyRituals: {},
    cadence: {}
  });
  const [showQuickSheet, setShowQuickSheet] = useState(null);
  const [quickSheetData, setQuickSheetData] = useState({});
  const scrollContainerRef = useRef(null);

  // Step configuration
  const totalSteps = 7;
  const stepTitles = [
    "Welcome",
    "Your Vibe",
    "Key Themes",
    "Aspirations",
    "Dream Templates",
    "Milestones",
    "Review"
  ];

  // Data for options
  const vibeOptions = [
    { id: 'reset', label: 'Reset', icon: Shield, color: 'blue' },
    { id: 'grow', label: 'Grow', icon: TrendingUp, color: 'green' },
    { id: 'launch', label: 'Launch', icon: Zap, color: 'red' },
    { id: 'explore', label: 'Explore', icon: Compass, color: 'purple' },
    { id: 'level-up', label: 'Level Up', icon: Mountain, color: 'orange' }
  ];

  const themeOptions = [
    { id: 'health', label: 'Health', emoji: '💪' },
    { id: 'learning', label: 'Learning', emoji: '📚' },
    { id: 'career', label: 'Career', emoji: '💼' },
    { id: 'creative', label: 'Creative', emoji: '🎨' },
    { id: 'financial', label: 'Financial', emoji: '💰' },
    { id: 'relationships', label: 'Relationships', emoji: '❤️' },
    { id: 'adventure', label: 'Adventure', emoji: '⚡' },
    { id: 'community', label: 'Community', emoji: '🤝' },
    { id: 'spiritual', label: 'Spiritual', emoji: '🙏' }
  ];

  const aspirationOptions = [
    { id: 'get-fit', label: 'Get Fit', emoji: '💪', type: 'health' },
    { id: 'start-business', label: 'Start a Business', emoji: '🚀', type: 'career' },
    { id: 'learn-language', label: 'Learn a Language', emoji: '🗣️', type: 'learning' },
    { id: 'get-promotion', label: 'Get a Promotion', emoji: '📈', type: 'career' },
    { id: 'master-skill', label: 'Master a New Skill', emoji: '🎯', type: 'learning' },
    { id: 'travel-more', label: 'Travel More', emoji: '✈️', type: 'adventure' },
    { id: 'build-network', label: 'Build My Network', emoji: '🤝', type: 'relationships' },
    { id: 'creative-project', label: 'Complete Creative Project', emoji: '🎨', type: 'creative' },
    { id: 'financial-freedom', label: 'Build Financial Freedom', emoji: '💰', type: 'financial' },
    { id: 'better-health', label: 'Improve My Health', emoji: '🏃', type: 'health' }
  ];

  const dreamTemplates = {
    'get-fit': [
      { id: 'h1', title: 'Stick to gym routine', why: '3x/week strength & cardio', category: 'Health', aspiration: 'get-fit', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=60&auto=format&fit=crop' },
      { id: 'h2', title: '2 hikes a month', why: 'Outdoor fitness & fresh air', category: 'Health', aspiration: 'get-fit', image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1200&q=60&auto=format&fit=crop' },
      { id: 'h3', title: 'Run 5 5Ks this year', why: 'Build running endurance', category: 'Health', aspiration: 'get-fit', image: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=1200&q=60&auto=format&fit=crop' },
      { id: 'h4', title: 'Lose 20 lbs by summer', why: 'Feel confident and energized', category: 'Health', aspiration: 'get-fit', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=60&auto=format&fit=crop' }
    ],
    'start-business': [
      { id: 'b1', title: 'Launch side hustle', why: 'Test business idea this quarter', category: 'Career', aspiration: 'start-business', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=60&auto=format&fit=crop' },
      { id: 'b2', title: 'Get first 10 customers', why: 'Validate the market', category: 'Career', aspiration: 'start-business', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=60&auto=format&fit=crop' },
      { id: 'b3', title: 'Build MVP in 12 weeks', why: 'Ship something people will pay for', category: 'Career', aspiration: 'start-business', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=60&auto=format&fit=crop' }
    ],
    'learn-language': [
      { id: 'l1', title: 'Conversational Spanish', why: 'Travel & connect with more people', category: 'Learning', aspiration: 'learn-language', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=60&auto=format&fit=crop' },
      { id: 'l2', title: 'Duolingo 30-day streak', why: 'Daily practice habit', category: 'Learning', aspiration: 'learn-language', image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&q=60&auto=format&fit=crop' },
      { id: 'l3', title: '3 native speaker convos/month', why: 'Real-world practice', category: 'Learning', aspiration: 'learn-language', image: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=1200&q=60&auto=format&fit=crop' }
    ],
    'get-promotion': [
      { id: 'c1', title: 'Lead a high-impact project', why: 'Prove leadership capability', category: 'Career', aspiration: 'get-promotion', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=60&auto=format&fit=crop' },
      { id: 'c2', title: 'Earn certification/credential', why: 'Show expertise & commitment', category: 'Career', aspiration: 'get-promotion', image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=60&auto=format&fit=crop' },
      { id: 'c3', title: 'Mentor 2 junior team members', why: 'Demonstrate senior-level skills', category: 'Career', aspiration: 'get-promotion', image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200&q=60&auto=format&fit=crop' }
    ],
    'master-skill': [
      { id: 's1', title: 'Master React & TypeScript', why: 'Level up technical skills', category: 'Learning', aspiration: 'master-skill', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=60&auto=format&fit=crop' },
      { id: 's2', title: 'Complete advanced course', why: 'Deep dive into expertise', category: 'Learning', aspiration: 'master-skill', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=60&auto=format&fit=crop' },
      { id: 's3', title: 'Build 3 portfolio projects', why: 'Prove real-world competence', category: 'Learning', aspiration: 'master-skill', image: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=1200&q=60&auto=format&fit=crop' }
    ],
    'travel-more': [
      { id: 't1', title: 'Visit 3 new countries', why: 'Expand horizons & create memories', category: 'Travel', aspiration: 'travel-more', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=60&auto=format&fit=crop' },
      { id: 't2', title: 'Weekend getaway monthly', why: 'Regular adventure & relaxation', category: 'Travel', aspiration: 'travel-more', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=60&auto=format&fit=crop' }
    ],
    'build-network': [
      { id: 'n1', title: 'Attend 12 industry events', why: 'Meet peers & grow connections', category: 'Career', aspiration: 'build-network', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=60&auto=format&fit=crop' },
      { id: 'n2', title: 'Coffee chat with 2 people/month', why: 'Build meaningful relationships', category: 'Career', aspiration: 'build-network', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=60&auto=format&fit=crop' }
    ],
    'creative-project': [
      { id: 'cr1', title: 'Complete photography series', why: 'Express creativity & build portfolio', category: 'Creative', aspiration: 'creative-project', image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&q=60&auto=format&fit=crop' },
      { id: 'cr2', title: 'Write and publish 12 blog posts', why: 'Share knowledge & build audience', category: 'Creative', aspiration: 'creative-project', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=60&auto=format&fit=crop' }
    ],
    'financial-freedom': [
      { id: 'f1', title: 'Save $10k emergency fund', why: 'Financial security & peace of mind', category: 'Finance', aspiration: 'financial-freedom', image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=60&auto=format&fit=crop' },
      { id: 'f2', title: 'Start investing 15% income', why: 'Build long-term wealth', category: 'Finance', aspiration: 'financial-freedom', image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&q=60&auto=format&fit=crop' }
    ],
    'better-health': [
      { id: 'bh1', title: 'Meal prep every Sunday', why: 'Consistent healthy eating', category: 'Health', aspiration: 'better-health', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=60&auto=format&fit=crop' },
      { id: 'bh2', title: 'Reduce stress through meditation', why: 'Mental health & balance', category: 'Health', aspiration: 'better-health', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=60&auto=format&fit=crop' }
    ],
    health: [
      { id: 'h5', title: 'Sleep 7.5h average', why: 'Better focus and recovery', category: 'Health', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=1200&q=60&auto=format&fit=crop' }
    ],
    learning: [
      { id: 'l4', title: 'Read 24 books this year', why: 'Expand knowledge', category: 'Learning', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=60&auto=format&fit=crop' }
    ],
    career: [
      { id: 'c4', title: 'Build professional network', why: 'Open new opportunities', category: 'Career', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=60&auto=format&fit=crop' }
    ]
  };

  const milestonePatterns = [
    { id: 'consistency', label: 'Consistency (12 weeks)', icon: Repeat, description: 'Build a habit over time' },
    { id: 'deadline', label: 'Deadline (pick a date)', icon: Calendar, description: 'Target a specific date' },
    { id: 'general', label: 'General (done when done)', icon: Target, description: 'Flexible completion' }
  ];

  const weeklyRitualOptions = {
    h1: [
      { id: 'r1', title: 'Gym 3x/week, 45 min', count: 3, period: 'week', duration: 45 },
      { id: 'r2', title: 'Gym 2x/week, 30 min', count: 2, period: 'week', duration: 30 }
    ],
    h2: [
      { id: 'r3', title: '2 hikes/month, 2-3 hrs', count: 2, period: 'month', duration: 120 },
      { id: 'r4', title: '1 hike/month, 2 hrs', count: 1, period: 'month', duration: 120 }
    ],
    h3: [
      { id: 'r5', title: 'Run 3x/week, 30 min', count: 3, period: 'week', duration: 30 },
      { id: 'r6', title: 'Run 2x/week, 20 min', count: 2, period: 'week', duration: 20 }
    ],
    h4: [
      { id: 'r7', title: 'Track meals daily, 5 min', count: 7, period: 'week', duration: 5 },
      { id: 'r8', title: 'Meal prep Sundays, 90 min', count: 1, period: 'week', duration: 90 }
    ],
    b1: [
      { id: 'r9', title: 'Work on business 3x/week, 1 hr', count: 3, period: 'week', duration: 60 },
      { id: 'r10', title: 'Work on business 5x/week, 30 min', count: 5, period: 'week', duration: 30 }
    ],
    b2: [
      { id: 'r11', title: 'Reach out to 3 prospects/week', count: 3, period: 'week', duration: 30 },
      { id: 'r12', title: 'Post value content 2x/week', count: 2, period: 'week', duration: 15 }
    ],
    b3: [
      { id: 'r13', title: 'Code MVP 4x/week, 2 hrs', count: 4, period: 'week', duration: 120 },
      { id: 'r14', title: 'Code MVP 3x/week, 90 min', count: 3, period: 'week', duration: 90 }
    ],
    l1: [
      { id: 'r15', title: 'Practice Spanish 5x/week, 20 min', count: 5, period: 'week', duration: 20 },
      { id: 'r16', title: 'Duolingo daily, 10 min', count: 7, period: 'week', duration: 10 }
    ],
    l2: [
      { id: 'r17', title: 'Duolingo daily, 10 min', count: 7, period: 'week', duration: 10 },
      { id: 'r18', title: 'Practice 5x/week, 15 min', count: 5, period: 'week', duration: 15 }
    ],
    l3: [
      { id: 'r19', title: '1 conversation/week, 30 min', count: 1, period: 'week', duration: 30 },
      { id: 'r20', title: '2 conversations/month', count: 2, period: 'month', duration: 30 }
    ],
    c1: [
      { id: 'r21', title: 'Lead project work 3x/week, 1 hr', count: 3, period: 'week', duration: 60 },
      { id: 'r22', title: 'Document progress weekly, 30 min', count: 1, period: 'week', duration: 30 }
    ],
    c2: [
      { id: 'r23', title: 'Study for cert 4x/week, 45 min', count: 4, period: 'week', duration: 45 },
      { id: 'r24', title: 'Study 3x/week, 30 min', count: 3, period: 'week', duration: 30 }
    ],
    c3: [
      { id: 'r25', title: 'Mentor session 2x/week, 30 min', count: 2, period: 'week', duration: 30 },
      { id: 'r26', title: 'Mentor check-in weekly, 20 min', count: 1, period: 'week', duration: 20 }
    ],
    s1: [
      { id: 'r27', title: 'Code practice 4x/week, 45 min', count: 4, period: 'week', duration: 45 },
      { id: 'r28', title: 'Build projects 3x/week, 1 hr', count: 3, period: 'week', duration: 60 }
    ],
    s2: [
      { id: 'r29', title: 'Course lessons 3x/week, 1 hr', count: 3, period: 'week', duration: 60 },
      { id: 'r30', title: 'Study 5x/week, 30 min', count: 5, period: 'week', duration: 30 }
    ],
    s3: [
      { id: 'r31', title: 'Build project 3x/week, 90 min', count: 3, period: 'week', duration: 90 },
      { id: 'r32', title: 'Code 4x/week, 45 min', count: 4, period: 'week', duration: 45 }
    ],
    l4: [
      { id: 'r33', title: 'Read 30 min daily', count: 7, period: 'week', duration: 30 },
      { id: 'r34', title: 'Read 2 books/month, 20 min daily', count: 7, period: 'week', duration: 20 }
    ]
  };

  // Handlers
  const handleSelectVibe = (vibeId) => {
    setSelections({ ...selections, vibe: vibeId });
    setTimeout(() => setCurrentStep(2), 500);
  };

  const toggleTheme = (themeId) => {
    const themes = selections.themes.includes(themeId)
      ? selections.themes.filter(t => t !== themeId)
      : [...selections.themes, themeId];
    setSelections({ ...selections, themes });
  };

  const toggleAspiration = (aspirationId) => {
    const aspirations = selections.aspirations.includes(aspirationId)
      ? selections.aspirations.filter(a => a !== aspirationId)
      : [...selections.aspirations, aspirationId];
    setSelections({ ...selections, aspirations });
  };

  const toggleDream = (dream) => {
    const isSelected = selections.dreams.find(d => d.id === dream.id);
    if (isSelected) {
      // Remove the dream
      setSelections({ ...selections, dreams: selections.dreams.filter(d => d.id !== dream.id) });
    } else if (selections.dreams.length < 3) {
      // Add the dream if less than 3
      setSelections({ ...selections, dreams: [...selections.dreams, dream] });
    }
  };

  const toggleFocusDream = (dreamId) => {
    if (selections.focusDreams.includes(dreamId)) {
      setSelections({ 
        ...selections, 
        focusDreams: selections.focusDreams.filter(id => id !== dreamId) 
      });
    } else if (selections.focusDreams.length < 3) {
      setSelections({ 
        ...selections, 
        focusDreams: [...selections.focusDreams, dreamId] 
      });
    }
  };

  const handleMilestonePattern = (dreamId, pattern) => {
    setSelections({
      ...selections,
      milestones: { ...selections.milestones, [dreamId]: pattern }
    });
  };

  const handleWeeklyRitual = (dreamId, ritual) => {
    setSelections({
      ...selections,
      weeklyRituals: { ...selections.weeklyRituals, [dreamId]: ritual }
    });
  };

  const openQuickSheet = (dreamId, initialData) => {
    setShowQuickSheet(dreamId);
    setQuickSheetData(initialData);
  };

  const saveQuickSheet = () => {
    if (currentStep === 6) {
      handleMilestonePattern(showQuickSheet, { 
        ...selections.milestones[showQuickSheet], 
        ...quickSheetData 
      });
    } else if (currentStep === 7) {
      handleWeeklyRitual(showQuickSheet, quickSheetData);
    }
    setShowQuickSheet(null);
    setQuickSheetData({});
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1: return selections.vibe !== null;
      case 2: return selections.themes.length >= 2;
      case 3: return selections.aspirations.length >= 2;
      case 4: return selections.dreams.length === 3;
      case 5: return selections.dreams.every(d => selections.milestones[d.id]);
      default: return true;
    }
  };

  // Render functions for each step
  const renderWelcome = () => (
    <div className="text-center max-w-2xl mx-auto py-12">
      <div className="mb-8">
        <Sparkles className="h-20 w-20 text-netsurit-red mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-professional-gray-900 mb-4">
          Build Your Best Year
        </h1>
        <p className="text-lg text-professional-gray-600">
          Let's create your vision and turn it into achievable Dreams, Milestones, and Weekly Goals in just a few minutes.
        </p>
      </div>
      <button
        onClick={() => setCurrentStep(1)}
        className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center space-x-2"
      >
        <span>Let's Go</span>
        <Sparkles className="h-5 w-5" />
      </button>
    </div>
  );

  const renderVibeCards = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-professional-gray-900 mb-2 text-center">
        What's the vibe for your best year?
      </h2>
      <p className="text-professional-gray-600 mb-8 text-center">
        Pick the one that resonates most
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {vibeOptions.map((vibe) => {
          const Icon = vibe.icon;
          const isSelected = selections.vibe === vibe.id;
          return (
            <button
              key={vibe.id}
              onClick={() => handleSelectVibe(vibe.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                isSelected
                  ? 'border-netsurit-red bg-gradient-to-br from-netsurit-light-coral/10 to-white shadow-lg scale-105'
                  : 'border-professional-gray-200 hover:border-netsurit-coral hover:shadow-lg'
              }`}
            >
              <Icon className={`h-12 w-12 mx-auto mb-3 ${isSelected ? 'text-netsurit-red' : 'text-professional-gray-400'}`} />
              <p className="font-medium text-professional-gray-900">{vibe.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderThemeChips = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-professional-gray-900 mb-2 text-center">
        Which themes matter most right now?
      </h2>
      <p className="text-professional-gray-600 mb-4 text-center">
        Pick 2-5 areas to focus on
      </p>
      <div className="mb-4 text-center">
        <span className="text-sm font-medium text-netsurit-red">
          {selections.themes.length} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {themeOptions.map((theme) => {
          const isSelected = selections.themes.includes(theme.id);
          return (
            <button
              key={theme.id}
              onClick={() => toggleTheme(theme.id)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white border-netsurit-red shadow-md'
                  : 'border-professional-gray-300 text-professional-gray-700 hover:border-netsurit-coral'
              }`}
            >
              <span className="mr-2">{theme.emoji}</span>
              {theme.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderAspirations = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-professional-gray-900 mb-2 text-center">
        What do you want to achieve this year?
      </h2>
      <p className="text-professional-gray-600 mb-4 text-center">
        Pick 2-4 big aspirations – we'll turn these into specific Dreams
      </p>
      <div className="mb-4 text-center">
        <span className={`text-sm font-medium ${selections.aspirations.length >= 2 ? 'text-netsurit-red' : 'text-professional-gray-500'}`}>
          {selections.aspirations.length} selected {selections.aspirations.length >= 2 && '✓'}
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {aspirationOptions.map((aspiration) => {
          const isSelected = selections.aspirations.includes(aspiration.id);
          return (
            <button
              key={aspiration.id}
              onClick={() => toggleAspiration(aspiration.id)}
              className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-netsurit-red bg-gradient-to-br from-netsurit-light-coral/10 to-white shadow-lg scale-105'
                  : 'border-professional-gray-200 hover:border-netsurit-coral hover:shadow-md'
              }`}
            >
              <div className="text-3xl mb-2">{aspiration.emoji}</div>
              <h3 className="font-semibold text-professional-gray-900">{aspiration.label}</h3>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDreamTemplates = () => {
    const availableTemplates = [];
    
    // First add aspiration-specific dreams
    selections.aspirations.forEach(aspiration => {
      if (dreamTemplates[aspiration]) {
        availableTemplates.push(...dreamTemplates[aspiration]);
      }
    });
    
    // Then add theme-based dreams
    selections.themes.forEach(theme => {
      if (dreamTemplates[theme]) {
        availableTemplates.push(...dreamTemplates[theme]);
      }
    });

    // Show message if no aspirations/themes selected
    if (availableTemplates.length === 0) {
      return (
        <div className="max-w-2xl mx-auto text-center py-12">
          <Target className="h-16 w-16 text-professional-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-professional-gray-900 mb-2">
            Let's add some aspirations first!
          </h3>
          <p className="text-professional-gray-600 mb-6">
            Go back and tell us what you want to achieve, and we'll suggest specific Dreams.
          </p>
          <button
            onClick={() => setCurrentStep(3)}
            className="px-6 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Pick Aspirations
          </button>
        </div>
      );
    }

    const scroll = (direction) => {
      if (scrollContainerRef.current) {
        const scrollAmount = 400;
        scrollContainerRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
      }
    };

    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-professional-gray-900 mb-2 text-center">
          Pick your top 3 Dreams
        </h2>
        <p className="text-professional-gray-600 mb-4 text-center">
          Choose 3 Dreams to focus on this year – scroll to see more options
        </p>
        <div className="mb-6 text-center">
          <span className={`text-sm font-medium ${selections.dreams.length === 3 ? 'text-netsurit-red' : 'text-professional-gray-500'}`}>
            {selections.dreams.length} of 3 selected {selections.dreams.length === 3 && '✓'}
          </span>
          <p className="text-xs text-professional-gray-500 mt-1">
            💡 Don't worry, you can add more Dreams later!
          </p>
        </div>

        {/* Scrollable container with navigation */}
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-professional-gray-200 hover:border-netsurit-red transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6 text-professional-gray-700" />
          </button>

          {/* Scrollable cards */}
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto hide-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-4 px-12 py-2">
              {availableTemplates.map((dream) => {
                const isSelected = selections.dreams.find(d => d.id === dream.id);
                return (
                  <button
                    key={dream.id}
                    onClick={() => toggleDream(dream)}
                    disabled={!isSelected && selections.dreams.length >= 3}
                    className={`flex-shrink-0 w-80 rounded-xl border-2 text-left transition-all duration-200 relative snap-start overflow-hidden ${
                      isSelected
                        ? 'border-netsurit-red bg-white shadow-lg'
                        : !isSelected && selections.dreams.length >= 3
                        ? 'border-professional-gray-200 opacity-50 cursor-not-allowed'
                        : 'border-professional-gray-200 hover:border-netsurit-coral hover:shadow-md'
                    }`}
                  >
                    {dream.image && (
                      <div className="relative h-32 w-full overflow-hidden">
                        <img 
                          src={dream.image} 
                          alt={dream.title}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-br from-netsurit-red/20 to-netsurit-coral/20" />
                        )}
                      </div>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="absolute top-3 right-3 h-6 w-6 text-white drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                    )}
                    <div className="p-5">
                      <h3 className="font-semibold text-professional-gray-900 mb-1 pr-8">
                        {dream.title}
                      </h3>
                      <p className="text-sm text-professional-gray-600 mb-2">{dream.why}</p>
                      <span className="text-xs text-professional-gray-500">{dream.category}</span>
                    </div>
                  </button>
                );
              })}
              <button
                className="flex-shrink-0 w-80 p-5 rounded-xl border-2 border-dashed border-professional-gray-300 hover:border-netsurit-coral transition-all duration-200 flex flex-col items-center justify-center min-h-[120px] snap-start"
              >
                <Plus className="h-8 w-8 text-professional-gray-400 mb-2" />
                <span className="text-sm font-medium text-professional-gray-600">Add Custom Dream</span>
              </button>
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-professional-gray-200 hover:border-netsurit-red transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6 text-professional-gray-700" />
          </button>
        </div>

        {/* Helper text */}
        <p className="text-center text-xs text-professional-gray-500 mt-4">
          💡 Tip: Use arrow buttons or swipe to see more Dreams
        </p>
      </div>
    );
  };

  const renderFocusDreams = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-professional-gray-900 mb-2 text-center">
        Star your top 3 Dreams
      </h2>
      <p className="text-professional-gray-600 mb-8 text-center">
        These will be your big rocks for the year
      </p>
      <div className="space-y-3">
        {selections.dreams.map((dream) => {
          const isFocused = selections.focusDreams.includes(dream.id);
          const focusIndex = selections.focusDreams.indexOf(dream.id);
          return (
            <button
              key={dream.id}
              onClick={() => toggleFocusDream(dream.id)}
              disabled={!isFocused && selections.focusDreams.length >= 3}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center space-x-4 ${
                isFocused
                  ? 'border-netsurit-red bg-gradient-to-r from-netsurit-light-coral/10 to-white shadow-md'
                  : selections.focusDreams.length >= 3
                  ? 'border-professional-gray-200 opacity-50 cursor-not-allowed'
                  : 'border-professional-gray-200 hover:border-netsurit-coral hover:shadow-md'
              }`}
            >
              <div className="flex-shrink-0">
                {isFocused ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-netsurit-red to-netsurit-coral flex items-center justify-center text-white font-bold">
                    {focusIndex + 1}
                  </div>
                ) : (
                  <Star className="h-10 w-10 text-professional-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-professional-gray-900">{dream.title}</h3>
                <p className="text-sm text-professional-gray-600">{dream.why}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderMilestones = () => {
    // Show all 3 dreams at once with their milestone selections
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-professional-gray-900 mb-2 text-center">
          How will you track progress?
        </h2>
        <p className="text-professional-gray-600 mb-8 text-center">
          Choose a milestone pattern for each Dream
        </p>

        <div className="space-y-6">
          {selections.dreams.map((dream, index) => {
            const selectedMilestone = selections.milestones[dream.id];
            
            if (!dream) return null;

            return (
              <div key={dream.id} className="bg-white rounded-2xl border-2 border-professional-gray-200 p-6 shadow-sm">
                {/* Dream header */}
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-netsurit-red to-netsurit-coral flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-professional-gray-900 text-lg mb-1">{dream.title}</h3>
                    <p className="text-sm text-professional-gray-600">{dream.why}</p>
                  </div>
                  {selectedMilestone && (
                    <CheckCircle2 className="h-6 w-6 text-netsurit-red flex-shrink-0" />
                  )}
                </div>

                {/* Milestone options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {milestonePatterns.map((pattern) => {
                    const Icon = pattern.icon;
                    const isSelected = selectedMilestone?.type === pattern.id;
                    return (
                      <button
                        key={pattern.id}
                        onClick={() => handleMilestonePattern(dream.id, { 
                          type: pattern.id, 
                          targetWeeks: 12,
                          frequency: 1,
                          period: 'week'
                        })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? 'border-netsurit-red bg-gradient-to-br from-netsurit-light-coral/10 to-white shadow-md'
                            : 'border-professional-gray-200 hover:border-netsurit-coral hover:shadow-sm'
                        }`}
                      >
                        <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-netsurit-red' : 'text-professional-gray-400'}`} />
                        <h4 className="font-semibold text-sm text-professional-gray-900 mb-1">{pattern.label.split(' (')[0]}</h4>
                        <p className="text-xs text-professional-gray-600">{pattern.description}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Expanded options when milestone is selected */}
                {selectedMilestone && (
                  <div className="mt-4 p-4 bg-professional-gray-50 rounded-xl border border-professional-gray-200">
                    {selectedMilestone.type === 'consistency' && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-professional-gray-900 mb-3">Consistency Settings</p>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-professional-gray-700">Track</span>
                          <button
                            onClick={() => {
                              const current = selectedMilestone.frequency || 1;
                              handleMilestonePattern(dream.id, { ...selectedMilestone, frequency: Math.max(1, current - 1) });
                            }}
                            className="w-8 h-8 rounded-full bg-white border-2 border-professional-gray-300 hover:border-netsurit-red flex items-center justify-center"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-lg font-bold text-netsurit-red min-w-[2rem] text-center">
                            {selectedMilestone.frequency || 1}
                          </span>
                          <button
                            onClick={() => {
                              const current = selectedMilestone.frequency || 1;
                              handleMilestonePattern(dream.id, { ...selectedMilestone, frequency: current + 1 });
                            }}
                            className="w-8 h-8 rounded-full bg-white border-2 border-professional-gray-300 hover:border-netsurit-red flex items-center justify-center"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <span className="text-sm text-professional-gray-700">times per</span>
                          <select
                            value={selectedMilestone.period || 'week'}
                            onChange={(e) => handleMilestonePattern(dream.id, { ...selectedMilestone, period: e.target.value })}
                            className="px-3 py-2 rounded-lg border-2 border-professional-gray-300 focus:border-netsurit-red focus:outline-none"
                          >
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                          </select>
                        </div>
                        <p className="text-xs text-professional-gray-500 mt-2">
                          Track for {selectedMilestone.targetWeeks || 12} weeks
                        </p>
                      </div>
                    )}

                    {selectedMilestone.type === 'deadline' && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-professional-gray-900 mb-3">Deadline Settings</p>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-professional-gray-700">Milestone every</span>
                          <button
                            onClick={() => {
                              const current = selectedMilestone.frequency || 1;
                              handleMilestonePattern(dream.id, { ...selectedMilestone, frequency: Math.max(1, current - 1) });
                            }}
                            className="w-8 h-8 rounded-full bg-white border-2 border-professional-gray-300 hover:border-netsurit-red flex items-center justify-center"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-lg font-bold text-netsurit-red min-w-[2rem] text-center">
                            {selectedMilestone.frequency || 1}
                          </span>
                          <button
                            onClick={() => {
                              const current = selectedMilestone.frequency || 1;
                              handleMilestonePattern(dream.id, { ...selectedMilestone, frequency: current + 1 });
                            }}
                            className="w-8 h-8 rounded-full bg-white border-2 border-professional-gray-300 hover:border-netsurit-red flex items-center justify-center"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <select
                            value={selectedMilestone.period || 'week'}
                            onChange={(e) => handleMilestonePattern(dream.id, { ...selectedMilestone, period: e.target.value })}
                            className="px-3 py-2 rounded-lg border-2 border-professional-gray-300 focus:border-netsurit-red focus:outline-none"
                          >
                            <option value="day">Days</option>
                            <option value="week">Weeks</option>
                            <option value="month">Months</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-3 mt-3">
                          <span className="text-sm text-professional-gray-700">Target date:</span>
                          <input
                            type="date"
                            value={selectedMilestone.targetDate || ''}
                            onChange={(e) => handleMilestonePattern(dream.id, { ...selectedMilestone, targetDate: e.target.value })}
                            className="px-3 py-2 rounded-lg border-2 border-professional-gray-300 focus:border-netsurit-red focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {selectedMilestone.type === 'general' && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-professional-gray-900 mb-2">General Milestone</p>
                        <p className="text-xs text-professional-gray-600">
                          You'll manually mark this as complete when you're satisfied with your progress.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeeklyRituals = () => {
    // Show all 3 dreams at once with their ritual selections
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-professional-gray-900 mb-2 text-center">
          Pick your weekly rituals
        </h2>
        <p className="text-professional-gray-600 mb-8 text-center">
          Choose one small, repeatable action for each Dream
        </p>

        <div className="space-y-6">
          {selections.focusDreams.map((dreamId, index) => {
            const dream = selections.dreams.find(d => d.id === dreamId);
            const selectedRitual = selections.weeklyRituals[dreamId];
            const ritualOptions = weeklyRitualOptions[dreamId] || [];
            
            if (!dream) return null;

            return (
              <div key={dreamId} className="bg-white rounded-2xl border-2 border-professional-gray-200 p-6 shadow-sm">
                {/* Dream header */}
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-netsurit-red to-netsurit-coral flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-professional-gray-900 text-lg mb-1">{dream.title}</h3>
                    <p className="text-sm text-professional-gray-600">{dream.why}</p>
                  </div>
                  {selectedRitual && (
                    <CheckCircle2 className="h-6 w-6 text-netsurit-red flex-shrink-0" />
                  )}
                </div>

                {/* Ritual options */}
                {ritualOptions.length > 0 ? (
                  <div className="space-y-2">
                    {ritualOptions.map((ritual) => {
                      const isSelected = selectedRitual?.id === ritual.id;
                      return (
                        <button
                          key={ritual.id}
                          onClick={() => handleWeeklyRitual(dreamId, ritual)}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            isSelected
                              ? 'border-netsurit-red bg-gradient-to-br from-netsurit-light-coral/10 to-white shadow-md'
                              : 'border-professional-gray-200 hover:border-netsurit-coral hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-professional-gray-900 mb-1">{ritual.title}</h4>
                              <p className="text-xs text-professional-gray-600">
                                {ritual.count}x per {ritual.period} • {ritual.duration} min each
                              </p>
                            </div>
                            {isSelected ? (
                              <CheckCircle2 className="h-5 w-5 text-netsurit-red flex-shrink-0 ml-3" />
                            ) : (
                              <Circle className="h-5 w-5 text-professional-gray-300 flex-shrink-0 ml-3" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-professional-gray-500">
                    <p className="text-sm">No ritual suggestions available for this dream</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Convert vision builder selections to app-compatible Dreams
  const generateDreamsForApp = () => {
    const now = new Date().toISOString();
    const baseTimestamp = Date.now();
    
    console.log('🔍 Generating dreams from selections:', selections);
    
    return selections.dreams.map((dream, index) => {
      const goalPattern = selections.milestones[dream.id];
      const goals = [];
      
      console.log(`🔍 Dream "${dream.title}" - goalPattern:`, goalPattern);
      
      if (goalPattern) {
        // Create goal based on the pattern selected
        const goalData = {
          id: `goal_${baseTimestamp}_${index}`,
          title: dream.title, // Use dream title as goal text
          description: goalPattern.type === 'consistency' 
            ? `Track ${goalPattern.frequency || 1}x per ${goalPattern.period || 'week'} for ${goalPattern.targetWeeks || 12} weeks`
            : goalPattern.type === 'deadline'
            ? `Complete by ${goalPattern.targetDate || 'target date'}`
            : 'Complete when ready',
          type: goalPattern.type,
          active: true,
          completed: false,
          createdAt: now
        };

        // Add type-specific fields
        if (goalPattern.type === 'consistency') {
          goalData.recurrence = goalPattern.period === 'month' ? 'monthly' : 'weekly';
          goalData.startDate = now;
          // Set targetWeeks or targetMonths based on period
          if (goalPattern.period === 'month') {
            goalData.targetMonths = goalPattern.targetWeeks || 6; // Convert to months if needed
          } else {
            goalData.targetWeeks = goalPattern.targetWeeks || 12;
          }
        } else if (goalPattern.type === 'deadline') {
          goalData.targetDate = goalPattern.targetDate || '';
        }
        
        goals.push(goalData);
        console.log(`✅ Created goal for "${dream.title}":`, goalData);
      } else {
        console.log(`⚠️ No goal pattern found for "${dream.title}"`);
      }
      
      const dreamData = {
        id: `dream_${baseTimestamp}_${index}`,
        title: dream.title,
        category: dream.category,
        description: dream.why || '',
        image: dream.image || '', // Include the image from the template
        progress: 0,
        goals: goals,
        notes: [],
        history: [],
        createdAt: now,
        updatedAt: now
      };
      
      console.log(`📦 Final dream data for "${dream.title}":`, { id: dreamData.id, goalsCount: dreamData.goals.length });
      
      return dreamData;
    });
  };

  // Generate vision bio for user profile
  const generateVisionBio = () => {
    const vibe = selections.vibe ? vibeOptions.find(v => v.id === selections.vibe) : null;
    const themes = selections.themes.slice(0, 3).map(t => 
      themeOptions.find(theme => theme.id === t)?.label
    ).filter(Boolean);

    const vibeDescriptions = {
      'reset': "hitting refresh and taking back control",
      'grow': "all about growth and leveling up",
      'launch': "launching something new and going all in",
      'explore': "stepping out of my comfort zone to explore new territory",
      'level-up': "taking things to the next level"
    };

    const vibeText = vibe ? vibeDescriptions[vibe.id] : "making this year different";
    
    if (themes.length > 0) {
      const themeList = themes.length === 1 
        ? themes[0].toLowerCase()
        : themes.length === 2 
        ? `${themes[0].toLowerCase()} and ${themes[1].toLowerCase()}`
        : `${themes[0].toLowerCase()}, ${themes[1].toLowerCase()}, and ${themes[2].toLowerCase()}`;
      return `This year, I'm ${vibeText}. My focus? ${themeList}.`;
    }
    
    return `This year, I'm ${vibeText}.`;
  };

  // Generate a casual dream story based on selections
  const generateDreamStory = () => {
    const vibe = selections.vibe ? vibeOptions.find(v => v.id === selections.vibe) : null;
    const themes = selections.themes.slice(0, 3).map(t => 
      themeOptions.find(theme => theme.id === t)?.label
    ).filter(Boolean);
    const dreamTitles = selections.dreams.slice(0, 3).map(d => d.title.toLowerCase());

    // Create a casual, personalized story
    const vibeIntros = {
      'reset': "This year, I'm hitting refresh and taking back control.",
      'grow': "This year, I'm all about growth and leveling up.",
      'launch': "This year, I'm launching something new and going all in.",
      'explore': "This year, I'm stepping out of my comfort zone to explore new territory.",
      'level-up': "This year, I'm taking things to the next level."
    };

    const intro = vibe ? vibeIntros[vibe.id] : "This year is going to be different.";
    
    // Build the middle part with themes
    let middle = "";
    if (themes.length > 0) {
      const themeList = themes.length === 1 
        ? themes[0].toLowerCase()
        : themes.length === 2 
        ? `${themes[0].toLowerCase()} and ${themes[1].toLowerCase()}`
        : `${themes[0].toLowerCase()}, ${themes[1].toLowerCase()}, and ${themes[2].toLowerCase()}`;
      middle = ` My focus? ${themeList}.`;
    }

    // Build the ending with dreams
    let ending = "";
    if (dreamTitles.length > 0) {
      ending = ` I'm committed to ${dreamTitles[0]}`;
      if (dreamTitles.length > 1) {
        ending += `, ${dreamTitles[1]}`;
      }
      if (dreamTitles.length > 2) {
        ending += `, and ${dreamTitles[2]}`;
      }
      ending += ". Let's make it happen.";
    }

    return intro + middle + ending;
  };

  const renderReview = () => {
    const selectedVibeLabel = selections.vibe ? vibeOptions.find(v => v.id === selections.vibe)?.label || 'Level up' : 'Level up';
    const themeLabels = selections.themes.slice(0, 3).map(t => 
      themeOptions.find(theme => theme.id === t)?.label
    ).filter(Boolean).join(', ') || 'your passions';
    const dreamStory = generateDreamStory();

    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-professional-gray-900 mb-2 text-center">
          Your Year is Ready! 🎉
        </h2>
        <p className="text-professional-gray-600 mb-8 text-center">
          Review and start your journey
        </p>
        
        {/* Vision Bio Card */}
        <div className="bg-gradient-to-r from-netsurit-red to-netsurit-coral rounded-xl p-6 text-white mb-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold">Your Dream Story</h3>
            <button className="text-white/80 hover:text-white" aria-label="Edit vision">
              <Edit3 className="h-5 w-5" />
            </button>
          </div>
          <p className="text-white/95 leading-relaxed italic">
            "{dreamStory}"
          </p>
        </div>

        {/* Dreams Summary */}
        <div className="space-y-4 mb-8">
          {selections.dreams.map((dream, index) => {
            const milestone = selections.milestones[dream.id];
            
            if (!dream) return null;
            
            return (
              <div key={dream.id} className="bg-white rounded-xl border-2 border-professional-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  {dream.image && (
                    <div className="flex-shrink-0 w-32 h-24 relative">
                      <img 
                        src={dream.image} 
                        alt={dream.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gradient-to-r from-netsurit-red to-netsurit-coral flex items-center justify-center text-white font-bold text-xs">
                        {index + 1}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 p-5">
                    {!dream.image && (
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-netsurit-red to-netsurit-coral flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-professional-gray-900 mb-1">{dream.title}</h3>
                      <p className="text-sm text-professional-gray-600 mb-2">{dream.why}</p>
                      {milestone && (
                        <div className="flex items-center space-x-2 text-xs text-professional-gray-700">
                          <Repeat className="h-3 w-3 text-netsurit-coral" />
                          <span>
                            {milestone.type === 'consistency' && `Track ${milestone.frequency || 1}x per ${milestone.period || 'week'} for ${milestone.targetWeeks || 12} weeks`}
                            {milestone.type === 'deadline' && `Milestone every ${milestone.frequency || 1} ${milestone.period || 'week'}${milestone.frequency > 1 ? 's' : ''}`}
                            {milestone.type === 'general' && 'General milestone - mark complete when satisfied'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={async () => {
              // Generate app-compatible data
              const dreamsForApp = generateDreamsForApp();
              const visionBio = generateVisionBio();
              
              // Log the data structure for reference
              console.log('=== VISION BUILDER OUTPUT ===');
              console.log('Vision Bio:', visionBio);
              console.log('Dreams:', dreamsForApp);
              console.log('Raw Selections:', selections);
              console.log('============================');
              
              // Save Dreams to DreamBook
              try {
                const userId = currentUser?.id;
                if (!userId) {
                  console.error('❌ No user ID found');
                  alert('⚠️ You must be logged in to save dreams');
                  return;
                }
                
                console.log('💾 Starting save process...', { userId, dreamsCount: dreamsForApp.length });
                
                // Create weekly goal templates for consistency goals
                // These are needed for Week Ahead view to show weekly checkboxes
                const templates = [];
                for (const dream of dreamsForApp) {
                  if (!dream.goals || dream.goals.length === 0) {
                    console.log(`ℹ️ Dream "${dream.title}" has no goals, skipping templates`);
                    continue;
                  }
                  
                  for (const goal of dream.goals) {
                    if (goal.type === 'consistency') {
                      console.log('📋 Creating weekly template for consistency goal:', goal.title);
                      
                      const template = {
                        id: `template_${goal.id}`,
                        title: goal.title,
                        description: goal.description || '',
                        dreamId: dream.id,
                        dreamTitle: dream.title,
                        dreamCategory: dream.category,
                        goalId: goal.id, // Link back to the dream goal
                        recurrence: goal.recurrence || 'weekly',
                        durationType: goal.recurrence === 'monthly' ? 'months' : 'weeks',
                        durationWeeks: goal.targetWeeks || (goal.targetMonths ? goal.targetMonths * 4 : 12),
                        durationMonths: goal.targetMonths,
                        startDate: goal.startDate,
                        active: true,
                        createdAt: new Date().toISOString()
                      };
                      
                      templates.push(template);
                      console.log(`✅ Created weekly template: ${goal.title}`);
                    }
                  }
                }
                
                // Save dreams with embedded goals AND weekly templates
                // Dreams = track overall progress, Templates = generate weekly checkboxes
                console.log('💾 Saving dreams + templates to Cosmos DB...', { 
                  dreamsCount: dreamsForApp.length, 
                  templatesCount: templates.length 
                });
                
                // Import itemService dynamically
                const itemService = (await import('../services/itemService')).default;
                
                // Get existing dreams from currentUser
                const existingDreams = currentUser?.dreamBook || [];
                
                // Combine existing + new dreams
                const allDreams = [...existingDreams, ...dreamsForApp];
                
                // Save to dreams container with templates
                const result = await itemService.saveDreams(userId, allDreams, templates);
                
                if (!result.success) {
                  throw new Error(result.error || 'Failed to save dreams to database');
                }
                
                console.log('✅ All dreams and templates saved successfully to Cosmos DB!');
                
                // Bulk instantiate templates across all 52 weeks
                if (templates.length > 0) {
                  console.log('🔄 Bulk instantiating templates across 52 weeks...');
                  const weekService = (await import('../services/weekService')).default;
                  const currentYear = new Date().getFullYear();
                  
                  const bulkResult = await weekService.bulkInstantiateTemplates(
                    userId,
                    currentYear,
                    templates
                  );
                  
                  if (bulkResult.success) {
                    console.log(`✅ Created instances for ${bulkResult.data.weeksCreated} weeks (${bulkResult.data.instancesCreated} total instances)`);
                  } else {
                    console.warn('⚠️ Bulk instantiation failed, but dreams were saved:', bulkResult.error);
                    // Don't throw - allow user to continue even if bulk instantiation fails
                  }
                }
                
                // Reload page to fetch fresh data from Cosmos DB
                // This ensures the dreams and templates are loaded into local state
                console.log('✅ Complete! Reloading to display your dreams...');
                window.location.href = '/';
                
              } catch (error) {
                console.error('❌ Error saving dreams:', error);
                console.error('❌ Error stack:', error.stack);
                alert(`⚠️ There was an error saving your Dreams: ${error.message}\n\nPlease check the console for details.`);
              }
            }}
            className="bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center space-x-2 text-lg transform hover:scale-105"
          >
            <span>Start My Year</span>
            <Sparkles className="h-6 w-6" />
          </button>
          <p className="text-sm text-professional-gray-500 mt-4">
            Ready to make this year unforgettable? 🌟
          </p>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderWelcome();
      case 1: return renderVibeCards();
      case 2: return renderThemeChips();
      case 3: return renderAspirations();
      case 4: return renderDreamTemplates();
      case 5: return renderMilestones();
      case 6: return renderReview();
      default: return renderWelcome();
    }
  };

  return (
    <div className="fixed inset-0 bg-professional-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-professional-gray-50 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        {currentStep > 0 && (
          <div className="bg-white border-b border-professional-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-netsurit-red" />
              <span className="font-semibold text-professional-gray-900">
                {stepTitles[currentStep]}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {/* Progress dots */}
              <div className="hidden sm:flex items-center space-x-1.5">
                {Array.from({ length: totalSteps - 1 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      i + 1 === currentStep
                        ? 'bg-netsurit-red w-6'
                        : i + 1 < currentStep
                        ? 'bg-netsurit-coral'
                        : 'bg-professional-gray-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  if (confirm('Exit vision builder? Progress will be lost.')) {
                    window.location.href = '/';
                  }
                }}
                className="text-professional-gray-400 hover:text-professional-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {renderCurrentStep()}
        </div>

        {/* Footer Navigation */}
        {currentStep > 0 && currentStep < 6 && (
          <div className="bg-white border-t border-professional-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              className="px-4 py-2 rounded-lg text-professional-gray-700 hover:bg-professional-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <span className="text-sm text-professional-gray-500">
              Step {currentStep} of {totalSteps - 1}
            </span>
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canContinue()}
              className={`px-6 py-2 rounded-lg font-medium inline-flex items-center space-x-2 transition-all ${
                canContinue()
                  ? 'bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white shadow-md hover:shadow-lg'
                  : 'bg-professional-gray-200 text-professional-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionBuilderDemo;

