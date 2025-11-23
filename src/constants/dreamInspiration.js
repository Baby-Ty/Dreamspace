// DoD: no fetch in UI; <400 lines; early return for loading/error; 
//      a11y roles/labels; minimal props; data-testid for key nodes.

/**
 * Dream inspiration templates and helper functions
 * Provides pre-defined dream templates to help users get started
 */

// Mock inspiration dreams with images from Unsplash
export const mockDreams = [
  { id: 1, title: 'Backpack Through Patagonia', category: 'Travel & Adventure', owner: 'Maya', status: 'Active', image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1200&q=60&auto=format&fit=crop' },
  { id: 2, title: 'Read a Book a Month', category: 'Learning & Education', owner: 'James', status: 'Active', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=60&auto=format&fit=crop' },
  { id: 3, title: 'Get Fit — Gym 3x a Week', category: 'Health & Fitness', owner: 'Alex', status: 'Active', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=60&auto=format&fit=crop' },
  { id: 4, title: 'Launch a Photography Portfolio', category: 'Creative Projects', owner: 'Sofia', status: 'Active', image: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=1200&q=60&auto=format&fit=crop' },
  { id: 5, title: 'Finish My Degree', category: 'Career Growth', owner: 'Ethan', status: 'Active', image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=60&auto=format&fit=crop' },
  { id: 6, title: 'Cycle Across a Country', category: 'Travel & Adventure', owner: 'Aiden', status: 'Active', image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&q=60&auto=format&fit=crop' },
  { id: 7, title: 'Master Public Speaking', category: 'Personal Development', owner: 'Olivia', status: 'Active', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&q=60&auto=format&fit=crop' },
  { id: 8, title: 'Learn to Cook 10 Signature Dishes', category: 'Lifestyle & Skills', owner: 'Lucas', status: 'Active', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=60&auto=format&fit=crop' },
  { id: 9, title: 'Volunteer for a Community Project', category: 'Community & Giving', owner: 'Aisha', status: 'Completed', image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200&q=60&auto=format&fit=crop' },
  { id: 10, title: 'Run a Half Marathon', category: 'Health & Fitness', owner: 'David', status: 'Completed', image: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=1200&q=60&auto=format&fit=crop' },
  { id: 11, title: 'Learn a New Language', category: 'Learning & Education', owner: 'Kenji', status: 'Active', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=60&auto=format&fit=crop' },
  { id: 12, title: 'Spend a Month Working from a New Country', category: 'Travel & Adventure', owner: 'Rachel', status: 'Active', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=60&auto=format&fit=crop' }
];

// Available inspiration categories
export const inspirationCategories = [
  'All',
  'Health & Fitness',
  'Travel & Adventure',
  'Learning & Education',
  'Creative Projects',
  'Community & Giving'
];

/**
 * Maps inspiration category names to valid app category names
 * @param {string} category - Inspiration category
 * @returns {string} Mapped app category
 */
export const mapInspirationCategory = (category) => {
  switch (category) {
    case 'Travel & Adventure':
      return 'Travel';
    case 'Learning & Education':
      return 'Learning';
    case 'Health & Fitness':
      return 'Health';
    case 'Creative Projects':
      return 'Creative';
    case 'Community & Giving':
      return 'Community';
    case 'Personal Development':
      return 'Learning';
    default:
      return category;
  }
};

/**
 * Builds a starter template for a dream added from inspiration
 * @param {Object} item - Inspiration item
 * @returns {Object} Template with category, description, milestones, and notes
 */
export const buildTemplateFromInspiration = (item) => {
  const category = mapInspirationCategory(item.category);
  const nowIso = new Date().toISOString();

  // Generic template
  let description = `${item.title} — starter template. Customize goals, dates, and scope to fit your plan.`;
  
  // Create coach-managed consistency milestone (12 weeks by default)
  const baseId = Date.now();
  let milestones = [
    { 
      id: `milestone_${baseId}_1`, 
      text: item.title, 
      completed: false, 
      createdAt: nowIso,
      coachManaged: true,
      type: 'consistency',
      targetWeeks: 12,
      startDate: nowIso,
      endOnDreamComplete: false,
      streakWeeks: 0
    }
  ];
  let notes = [
    { id: `note_${baseId}_1`, text: 'You can change locations and details in this template.', timestamp: nowIso },
  ];

  // Specific richer template for Patagonia
  if (item.title === 'Backpack Through Patagonia') {
    description = 'Backpack through Patagonia (Chile & Argentina). Suggested route: Torres del Paine → El Calafate / Perito Moreno → El Chaltén → Bariloche. Tweak locations, dates, and budget to suit you.';
    milestones = [
      { id: `milestone_${baseId}_1`, text: 'Pick travel window and budget', completed: false, createdAt: nowIso },
      { id: `milestone_${baseId}_2`, text: 'Plan high-level route (Chile ↔ Argentina)', completed: false, createdAt: nowIso },
      { id: `milestone_${baseId}_3`, text: 'Book flights (e.g., Punta Arenas / El Calafate)', completed: false, createdAt: nowIso },
      { id: `milestone_${baseId}_4`, text: 'Reserve camps/hostels (Torres del Paine, etc.)', completed: false, createdAt: nowIso },
      { id: `milestone_${baseId}_5`, text: 'Gear checklist (backpack, layers, boots, rain gear)', completed: false, createdAt: nowIso },
      { id: `milestone_${baseId}_6`, text: 'Create packing list and emergency contacts', completed: false, createdAt: nowIso },
      { 
        id: `milestone_${baseId}_7`, 
        text: 'Physical prep - consistent cardio for 10 weeks', 
        completed: false, 
        createdAt: nowIso,
        coachManaged: true,
        type: 'consistency',
        targetWeeks: 10,
        startDate: nowIso,
        endOnDreamComplete: false,
        streakWeeks: 0
      },
    ];
    notes = [
      { id: `note_${baseId}_1`, text: 'Swap locations freely (e.g., add Ushuaia).', timestamp: nowIso },
      { id: `note_${baseId}_2`, text: 'Coach tip: Build endurance gradually. Start with 2-3 cardio sessions per week.', timestamp: nowIso, isCoachNote: true },
    ];
  }

  return { category, description, milestones, notes };
};









