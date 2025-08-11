// Mock data for DreamSpace application

export const currentUser = {
  id: 1,
  name: "Sarah Johnson",
  email: "sarah.johnson@netsurit.com",
  office: "Cape Town",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
  dreamBook: [
    {
      id: 1,
      title: "Learn Portuguese",
      category: "Learning",
      description: "I want to become fluent in Portuguese to better connect with our Brazilian clients and explore the culture.",
      progress: 35,
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=200&fit=crop",
      milestones: [
        { id: 1, text: "Complete basic grammar course", completed: true, createdAt: "2024-01-10T10:00:00Z" },
        { id: 2, text: "Practice conversation with native speaker", completed: true, createdAt: "2024-01-15T10:00:00Z" },
        { id: 3, text: "Watch Portuguese movies without subtitles", completed: false, createdAt: "2024-01-20T10:00:00Z" },
        { id: 4, text: "Pass intermediate level exam", completed: false, createdAt: "2024-01-25T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Had a great conversation with Maria from the Brazil office today. Feeling more confident!", timestamp: "2024-01-22T14:30:00Z" },
        { id: 2, text: "Struggling with verb conjugations but making progress with vocabulary.", timestamp: "2024-01-18T09:15:00Z" }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 35%", timestamp: "2024-01-22T14:35:00Z", oldValue: 30, newValue: 35 },
        { id: 2, type: "milestone", action: "Completed milestone: \"Practice conversation with native speaker\"", timestamp: "2024-01-21T16:20:00Z" },
        { id: 3, type: "note", action: "Added new note", timestamp: "2024-01-18T09:15:00Z" }
      ]
    },
    {
      id: 2,
      title: "Visit Machu Picchu",
      category: "Travel",
      description: "Experience the ancient wonder of Machu Picchu and trek the Inca Trail.",
      progress: 15,
      image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=300&h=200&fit=crop",
      milestones: [
        { id: 1, text: "Research best time to visit", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Book flights to Peru", completed: false, createdAt: "2024-01-08T10:00:00Z" },
        { id: 3, text: "Get travel insurance", completed: false, createdAt: "2024-01-10T10:00:00Z" },
        { id: 4, text: "Buy hiking gear", completed: false, createdAt: "2024-01-12T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Found out the best time to visit is during dry season (May to September). Planning for June 2024.", timestamp: "2024-01-15T11:00:00Z" }
      ],
      history: [
        { id: 1, type: "milestone", action: "Completed milestone: \"Research best time to visit\"", timestamp: "2024-01-15T11:05:00Z" },
        { id: 2, type: "progress", action: "Progress updated to 15%", timestamp: "2024-01-15T11:10:00Z", oldValue: 10, newValue: 15 }
      ]
    },
    {
      id: 3,
      title: "Complete a Marathon",
      category: "Health",
      description: "Train for and complete the Two Oceans Marathon in Cape Town.",
      progress: 60,
      image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop",
      milestones: [
        { id: 1, text: "Run 5km without stopping", completed: true, createdAt: "2024-01-01T10:00:00Z" },
        { id: 2, text: "Run 10km without stopping", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 3, text: "Run half marathon (21km)", completed: true, createdAt: "2024-01-15T10:00:00Z" },
        { id: 4, text: "Complete 30km training run", completed: false, createdAt: "2024-01-20T10:00:00Z" },
        { id: 5, text: "Register for Two Oceans Marathon", completed: false, createdAt: "2024-01-25T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Completed my first half marathon today! Feeling strong and ready for the next phase of training.", timestamp: "2024-01-20T17:30:00Z" },
        { id: 2, text: "Had to take a rest day due to minor knee pain. Icing and stretching more.", timestamp: "2024-01-18T19:00:00Z" },
        { id: 3, text: "New running shoes are working great. Much better support for longer distances.", timestamp: "2024-01-16T08:30:00Z" }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 60%", timestamp: "2024-01-20T17:35:00Z", oldValue: 55, newValue: 60 },
        { id: 2, type: "milestone", action: "Completed milestone: \"Run half marathon (21km)\"", timestamp: "2024-01-20T17:32:00Z" },
        { id: 3, type: "note", action: "Added new note", timestamp: "2024-01-18T19:00:00Z" },
        { id: 4, type: "milestone", action: "Completed milestone: \"Run 10km without stopping\"", timestamp: "2024-01-15T08:45:00Z" }
      ]
    }
  ],
  score: 47,
  connects: [
    {
      id: 1,
      withWhom: "Mike Chen",
      date: "2024-01-15",
      notes: "Great conversation about travel experiences in Asia",
      selfieUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop"
    }
  ]
};

export const dreamCategories = [
  "Health",
  "Travel", 
  "Career",
  "Learning",
  "Creative",
  "Financial",
  "Relationships",
  "Adventure",
  "Spiritual",
  "Community"
];

export const allUsers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@netsurit.com",
    office: "Cape Town",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    dreamCategories: ["Learning", "Travel", "Health"],
    score: 47,
    dreamsCount: 3,
    connectsCount: 1
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike.chen@netsurit.com", 
    office: "Johannesburg",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    dreamCategories: ["Travel", "Career", "Creative"],
    latestDreamTitle: "Explore Japan",
    sampleDreams: [
      { title: "Explore Japan", category: "Travel", image: "https://images.unsplash.com/photo-1518544801976-3e723d4d3b8b?w=600&q=60&auto=format&fit=crop" },
      { title: "Launch a Side Project", category: "Creative", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=60&auto=format&fit=crop" },
      { title: "AWS Certification", category: "Career", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=60&auto=format&fit=crop" }
    ],
    score: 62,
    dreamsCount: 5,
    connectsCount: 3
  },
  {
    id: 3,
    name: "Emma Wilson",
    email: "emma.wilson@netsurit.com",
    office: "Cape Town", 
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    dreamCategories: ["Health", "Learning", "Adventure"],
    latestDreamTitle: "Run a Half Marathon",
    sampleDreams: [
      { title: "Run a Half Marathon", category: "Health", image: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&q=60&auto=format&fit=crop" },
      { title: "Learn Basic Italian", category: "Learning", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=60&auto=format&fit=crop" },
      { title: "Hike Drakensberg", category: "Adventure", image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&q=60&auto=format&fit=crop" }
    ],
    score: 38,
    dreamsCount: 4,
    connectsCount: 2
  },
  {
    id: 4,
    name: "James Rodriguez",
    email: "james.rodriguez@netsurit.com",
    office: "Durban",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", 
    dreamCategories: ["Financial", "Career", "Community"],
    latestDreamTitle: "Save for a Home Deposit",
    sampleDreams: [
      { title: "Save for a Home Deposit", category: "Financial", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=60&auto=format&fit=crop" },
      { title: "Mentor a Junior Dev", category: "Community", image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&q=60&auto=format&fit=crop" },
      { title: "PMP Certification", category: "Career", image: "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&q=60&auto=format&fit=crop" }
    ],
    score: 71,
    dreamsCount: 6,
    connectsCount: 4
  },
  {
    id: 5,
    name: "Lisa Park",
    email: "lisa.park@netsurit.com",
    office: "Cape Town",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    dreamCategories: ["Creative", "Learning", "Spiritual"],
    latestDreamTitle: "Photography Portfolio",
    sampleDreams: [
      { title: "Photography Portfolio", category: "Creative", image: "https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=600&q=60&auto=format&fit=crop" },
      { title: "Read 12 Books", category: "Learning", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=60&auto=format&fit=crop" },
      { title: "Meditation Habit", category: "Spiritual", image: "https://images.unsplash.com/photo-1431794062232-2a99a5431c6c?w=600&q=60&auto=format&fit=crop" }
    ],
    score: 29,
    dreamsCount: 2,
    connectsCount: 1
  },
  {
    id: 6,
    name: "David Thompson",
    email: "david.thompson@netsurit.com",
    office: "Johannesburg",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    dreamCategories: ["Adventure", "Travel", "Health"],
    latestDreamTitle: "Cycle the Garden Route",
    sampleDreams: [
      { title: "Cycle the Garden Route", category: "Adventure", image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=60&auto=format&fit=crop" },
      { title: "Visit Thailand", category: "Travel", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=60&auto=format&fit=crop" },
      { title: "Strength Training", category: "Health", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=60&auto=format&fit=crop" }
    ],
    score: 55,
    dreamsCount: 7,
    connectsCount: 2
  },
  {
    id: 7,
    name: "Noah Patel",
    email: "noah.patel@netsurit.com",
    office: "New York",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop&crop=face",
    dreamCategories: ["Creative", "Career"],
    latestDreamTitle: "Build a Personal Brand",
    sampleDreams: [
      { title: "Ship a Design Portfolio", category: "Creative", image: "https://images.unsplash.com/photo-1492138786289-d35ea832da43?w=600&q=60&auto=format&fit=crop" },
      { title: "AWS Solutions Architect", category: "Career", image: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=600&q=60&auto=format&fit=crop" }
    ],
    score: 44,
    dreamsCount: 3,
    connectsCount: 1
  }
];

export const offices = ["Cape Town", "Johannesburg", "Durban", "Pretoria", "New York"];

export const scoringRules = {
  dreamCompleted: 10,
  dreamConnect: 5,
  journalEntry: 2,
  groupAttendance: 3
};

// Helper functions
export const getSharedCategories = (user1Categories, user2Categories) => {
  return user1Categories.filter(cat => user2Categories.includes(cat));
};

export const getSuggestedConnections = (currentUserId) => {
  const currentUserData = allUsers.find(u => u.id === currentUserId);
  if (!currentUserData) return [];
  
  return allUsers
    .filter(user => user.id !== currentUserId)
    .map(user => ({
      ...user,
      sharedCategories: getSharedCategories(currentUserData.dreamCategories, user.dreamCategories)
    }))
    // Include all users, but prioritize those with more shared categories
    .sort((a, b) => {
      const diff = b.sharedCategories.length - a.sharedCategories.length;
      if (diff !== 0) return diff;
      return (b.score || 0) - (a.score || 0);
    });
};