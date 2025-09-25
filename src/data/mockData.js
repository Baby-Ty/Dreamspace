// Mock data for DreamSpace application

export const currentUser = {
  id: 8,
  name: "Bruce Banner",
  email: "bruce.banner@netsurit.com",
  office: "New York",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  dreamCategories: ["Learning", "Career", "Health"],
  dreamBook: [
    {
      id: 1,
      title: "Master React and TypeScript",
      category: "Learning",
      description: "Become expert in React 18, Next.js, and advanced TypeScript patterns for leading development teams.",
      progress: 85,
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
      milestones: [
        { id: 1, text: "Complete advanced React patterns course", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Build demo project with Next.js 14", completed: true, createdAt: "2024-01-15T10:00:00Z" },
        { id: 3, text: "Master TypeScript advanced patterns", completed: false, createdAt: "2024-02-01T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Signed up at the new gym near the office.", timestamp: "2024-01-06T12:00:00Z" },
        { 
          id: 2, 
          dreamId: 1,
          teamMemberId: 1,
          coachId: 1,
          coachName: "Sarah Johnson",
          note: "Great progress on establishing the gym routine! Consider setting specific weekly targets for consistency.",
          type: "encouragement",
          createdAt: "2024-01-10T14:30:00Z",
          isCoachNote: true
        }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 30%", timestamp: "2024-01-10T09:00:00Z", oldValue: 15, newValue: 30 }
      ]
    },
    {
      id: 2,
      title: "Lead Development Team",
      category: "Career",
      description: "Transition to engineering manager role and build high-performing development teams.",
      progress: 70,
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop",
      milestones: [
        { id: 1, text: "Complete leadership training program", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Start mentoring junior developers", completed: true, createdAt: "2024-01-15T10:00:00Z" },
        { id: 3, text: "Build team processes and culture", completed: false, createdAt: "2024-02-01T10:00:00Z" },
        { id: 4, text: "Establish team metrics and KPIs", completed: false, createdAt: "2024-02-10T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Focus on building trust first, then implementing processes gradually.", timestamp: "2024-01-15T11:00:00Z" },
        { 
          id: 2, 
          dreamId: 2,
          teamMemberId: 1,
          coachId: 1,
          coachName: "Sarah Johnson",
          note: "Excellent research on timing! Have you considered booking travel insurance early for better rates?",
          type: "suggestion",
          createdAt: "2024-01-16T09:15:00Z",
          isCoachNote: true
        }
      ],
      history: [
        { id: 1, type: "milestone", action: "Completed milestone: \"Research best time to visit\"", timestamp: "2024-01-15T11:05:00Z" },
        { id: 2, type: "progress", action: "Progress updated to 15%", timestamp: "2024-01-15T11:10:00Z", oldValue: 10, newValue: 15 }
      ]
    },
    {
      id: 3,
      title: "Read a Book a Month",
      category: "Learning",
      description: "Finish one book every month and keep short notes or highlights.",
      progress: 10,
      image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=200&fit=crop",
      milestones: [
        { id: 1, text: "Draft reading list (12 books)", completed: false, createdAt: "2024-01-03T10:00:00Z" },
        { id: 2, text: "Set daily 20-minute reading block", completed: true, createdAt: "2024-01-04T10:00:00Z" },
        { id: 3, text: "Finish first book", completed: false, createdAt: "2024-01-20T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Try alternating fiction and non-fiction.", timestamp: "2024-01-04T12:00:00Z" }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 10%", timestamp: "2024-01-07T09:00:00Z", oldValue: 0, newValue: 10 }
      ]
    },
    {
      id: 4,
      title: "YC Application – Fall 2025",
      category: "Career",
      description: "Prepare and submit the application for Y Combinator Fall 2025 batch.",
      progress: 100,
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop",
      milestones: [
        { id: 1, text: "Draft application answers", completed: true, createdAt: "2024-01-18T10:00:00Z" },
        { id: 2, text: "Record team video (1 minute)", completed: true, createdAt: "2024-01-20T10:00:00Z" },
        { id: 3, text: "Collect metrics and traction", completed: true, createdAt: "2024-01-22T10:00:00Z" },
        { id: 4, text: "Submit application", completed: true, createdAt: "2024-01-25T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Submitted! Waiting to hear back.", timestamp: "2024-01-25T12:00:00Z" }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 100%", timestamp: "2024-01-25T12:05:00Z", oldValue: 90, newValue: 100 },
        { id: 2, type: "milestone", action: "Completed milestone: \"Submit application\"", timestamp: "2024-01-25T12:00:00Z" }
      ]
    }
  ],
  weeklyGoals: [
    {
      id: 1,
      title: "Price flights to South America",
      description: "Compare options and note prices",
      completed: false,
      dreamId: 2,
      dreamTitle: "Visit Machu Picchu",
      dreamCategory: "Travel",
      createdAt: "2024-09-23T10:00:00Z"
    },
    {
      id: 2,
      title: "4 training sessions with PT",
      description: "Monday, Tuesday, Thursday, Friday",
      completed: false,
      dreamId: 1,
      dreamTitle: "Stick to a Gym Routine",
      dreamCategory: "Health",
      createdAt: "2024-09-23T10:00:00Z"
    },
    {
      id: 3,
      title: "Read every morning for 40mins with coffee",
      description: "Daily morning reading routine",
      completed: false,
      dreamId: 3,
      dreamTitle: "Read a Book a Month",
      dreamCategory: "Learning",
      createdAt: "2024-09-23T10:00:00Z"
    }
  ],
  careerGoals: [
    {
      id: 1,
      title: "Complete AWS Certification",
      description: "Obtain AWS Solutions Architect Associate certification to enhance cloud expertise",
      progress: 60,
      targetDate: "2024-12-31",
      status: "In Progress",
      milestones: [
        { id: 1, text: "Study AWS architecture fundamentals", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Complete practice exams", completed: true, createdAt: "2024-01-15T10:00:00Z" },
        { id: 3, text: "Schedule certification exam", completed: false, createdAt: "2024-01-20T10:00:00Z" },
        { id: 4, text: "Pass certification exam", completed: false, createdAt: "2024-01-25T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Registered for AWS training course. Going well so far.", timestamp: "2024-01-10T12:00:00Z" }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 60%", timestamp: "2024-01-20T09:00:00Z", oldValue: 40, newValue: 60 }
      ]
    },
    {
      id: 2,
      title: "Advance to Technical Lead Role",
      description: "Progress to a senior technical leadership position with team management responsibilities",
      progress: 25,
      targetDate: "2026-06-30",
      status: "Planned",
      milestones: [
        { id: 1, text: "Complete leadership training program", completed: false, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Lead a cross-functional project", completed: true, createdAt: "2024-01-08T10:00:00Z" },
        { id: 3, text: "Mentor junior developers", completed: false, createdAt: "2024-01-12T10:00:00Z" },
        { id: 4, text: "Apply for technical lead positions", completed: false, createdAt: "2024-01-15T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Started mentoring two junior developers this month.", timestamp: "2024-01-15T11:00:00Z" }
      ],
      history: [
        { id: 1, type: "milestone", action: "Completed milestone: \"Lead a cross-functional project\"", timestamp: "2024-01-15T11:05:00Z" },
        { id: 2, type: "progress", action: "Progress updated to 25%", timestamp: "2024-01-15T11:10:00Z", oldValue: 10, newValue: 25 }
      ]
    }
  ],
  developmentPlan: [
    {
      id: 1,
      title: "Cloud Architecture Course",
      description: "Advanced cloud solutions design patterns and best practices",
      progress: 75,
      targetDate: "2024-03-31",
      status: "In Progress",
      skills: ["AWS", "Cloud Architecture", "System Design", "DevOps"],
      milestones: [
        { id: 1, text: "Complete Module 1: Fundamentals", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Complete Module 2: Security", completed: true, createdAt: "2024-01-12T10:00:00Z" },
        { id: 3, text: "Complete Module 3: Scalability", completed: true, createdAt: "2024-01-18T10:00:00Z" },
        { id: 4, text: "Complete final project", completed: false, createdAt: "2024-01-25T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Really enjoying the security module. Great practical examples.", timestamp: "2024-01-14T12:00:00Z" }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 75%", timestamp: "2024-01-20T09:00:00Z", oldValue: 60, newValue: 75 }
      ]
    },
    {
      id: 2,
      title: "Leadership Fundamentals",
      description: "Core leadership and team management skills development",
      progress: 40,
      targetDate: "2024-05-31",
      status: "In Progress",
      skills: ["Leadership", "Team Management", "Communication", "Conflict Resolution"],
      milestones: [
        { id: 1, text: "Complete leadership assessment", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Attend leadership workshop", completed: false, createdAt: "2024-01-15T10:00:00Z" },
        { id: 3, text: "Practice coaching techniques", completed: false, createdAt: "2024-01-20T10:00:00Z" },
        { id: 4, text: "Lead team retrospectives", completed: false, createdAt: "2024-01-25T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Leadership assessment showed strengths in communication but need to work on delegation.", timestamp: "2024-01-08T12:00:00Z" }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 40%", timestamp: "2024-01-10T09:00:00Z", oldValue: 20, newValue: 40 }
      ]
    },
    {
      id: 3,
      title: "Machine Learning Specialization",
      description: "Stanford University online course series covering ML fundamentals and applications",
      progress: 0,
      targetDate: "2024-08-31",
      status: "Planned",
      skills: ["Machine Learning", "Python", "Data Analysis", "AI"],
      milestones: [
        { id: 1, text: "Enroll in course", completed: false, createdAt: "2024-01-30T10:00:00Z" },
        { id: 2, text: "Complete Course 1: ML Fundamentals", completed: false, createdAt: "2024-02-15T10:00:00Z" },
        { id: 3, text: "Complete Course 2: Advanced Algorithms", completed: false, createdAt: "2024-04-15T10:00:00Z" },
        { id: 4, text: "Complete final capstone project", completed: false, createdAt: "2024-08-15T10:00:00Z" }
      ],
      notes: [],
      history: []
    }
  ],
  careerProfile: {
    currentRole: {
      jobTitle: "Senior Software Developer",
      department: "Engineering",
      startDate: "2022-03-15",
      location: "Cape Town, South Africa"
    },
    aspirations: {
      desiredJobTitle: "Technical Lead / Engineering Manager",
      preferredDepartment: "Engineering / Product Development",
      interestedInRelocation: true,
      preferredGeography: "Europe, North America, Remote"
    },
    preferences: {
      wantToDo: [
        "Lead technical architecture decisions",
        "Mentor junior developers",
        "Work on innovative projects",
        "Collaborate with cross-functional teams",
        "Drive technical strategy and vision"
      ],
      dontWantToDo: [
        "Repetitive maintenance tasks",
        "Work in isolation without team interaction",
        "Focus solely on legacy system support",
        "Excessive overtime or weekend work",
        "Micromanagement responsibilities"
      ],
      motivators: [
        "Learning new technologies",
        "Solving complex problems",
        "Making a positive impact",
        "Recognition for good work",
        "Career growth opportunities",
        "Work-life balance"
      ]
    },
    careerHighlights: [
      {
        id: 1,
        title: "Led Team Migration Project",
        description: "Successfully migrated legacy systems to cloud infrastructure, improving performance by 40%",
        date: "2023-06-15"
      },
      {
        id: 2,
        title: "Mentorship Excellence Award",
        description: "Recognized for outstanding mentorship of junior developers",
        date: "2022-12-10"
      },
      {
        id: 3,
        title: "Innovation Champion",
        description: "Implemented automated testing framework, reducing deployment time by 60%",
        date: "2023-03-20"
      }
    ],
    skills: {
      technical: [
        { id: 1, name: "JavaScript/TypeScript", level: 90, category: "Programming" },
        { id: 2, name: "React/Vue.js", level: 85, category: "Frontend" },
        { id: 3, name: "Node.js", level: 80, category: "Backend" },
        { id: 4, name: "Python", level: 75, category: "Programming" },
        { id: 5, name: "AWS/Cloud", level: 70, category: "Infrastructure" },
        { id: 6, name: "Docker/Kubernetes", level: 65, category: "DevOps" }
      ],
      soft: [
        { id: 1, name: "Team Leadership", level: 80 },
        { id: 2, name: "Communication", level: 85 },
        { id: 3, name: "Problem Solving", level: 90 },
        { id: 4, name: "Project Management", level: 75 },
        { id: 5, name: "Mentoring", level: 80 },
        { id: 6, name: "Public Speaking", level: 60 }
      ]
    }
  },
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
  "Family & Friends",
  "Skills & Hobbies",
  "Growth & Learning",
  "Spirituality & Mind",
  "Adventure & Fun",
  "Love & Relationships",
  "Wellness & Fitness",
  "Money & Wealth",
  "Contribution & Giving Back"
];

export const allUsers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@netsurit.com",
    office: "Cape Town",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
    dreamCategories: ["Learning", "Travel", "Health"],
    latestDreamTitle: "Stick to a Gym Routine",
    sampleDreams: [
      { 
        id: 1,
        title: "Stick to a Gym Routine", 
        category: "Health", 
        description: "Maintain a consistent routine: 3× strength and 2× cardio each week.",
        progress: 30,
        image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=60&auto=format&fit=crop",
        milestones: [
          { id: 1, text: "Plan weekly split (Push/Pull/Legs + cardio)", completed: true, createdAt: "2024-01-05T10:00:00Z" },
          { id: 2, text: "Set schedule and alarms", completed: false, createdAt: "2024-01-07T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Started at the new gym near the office.", timestamp: "2024-01-06T12:00:00Z" },
          { 
            id: 2, 
            dreamId: 1,
            teamMemberId: 1,
            coachId: 1,
            coachName: "Sarah Johnson",
            note: "Great progress on establishing the gym routine! Consider setting specific weekly targets for consistency.",
            type: "encouragement",
            createdAt: "2024-01-10T14:30:00Z",
            isCoachNote: true
          }
        ],
        history: [
          { id: 1, type: "progress", action: "Progress updated to 30%", timestamp: "2024-01-10T09:00:00Z", oldValue: 15, newValue: 30 }
        ]
      },
      { 
        id: 2,
        title: "Visit Machu Picchu", 
        category: "Travel", 
        description: "Experience the ancient wonder of Machu Picchu and trek the Inca Trail.",
        progress: 15,
        image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&q=60&auto=format&fit=crop",
        milestones: [
          { id: 1, text: "Research best time to visit", completed: true, createdAt: "2024-01-05T10:00:00Z" },
          { id: 2, text: "Book flights to Peru", completed: false, createdAt: "2024-01-08T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Best time is dry season (May to September). Planning for June 2024.", timestamp: "2024-01-15T11:00:00Z" }
        ],
        history: [
          { id: 1, type: "milestone", action: "Completed milestone: \"Research best time to visit\"", timestamp: "2024-01-15T11:05:00Z" }
        ]
      },
      { 
        id: 3,
        title: "Read a Book a Month", 
        category: "Learning", 
        description: "Finish one book every month and keep short notes or highlights.",
        progress: 10,
        image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=60&auto=format&fit=crop",
        milestones: [
          { id: 1, text: "Draft reading list (12 books)", completed: false, createdAt: "2024-01-03T10:00:00Z" },
          { id: 2, text: "Set daily 20-minute reading block", completed: true, createdAt: "2024-01-04T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Try alternating fiction and non-fiction.", timestamp: "2024-01-04T12:00:00Z" }
        ],
        history: [
          { id: 1, type: "progress", action: "Progress updated to 10%", timestamp: "2024-01-07T09:00:00Z", oldValue: 0, newValue: 10 }
        ]
      },
      { 
        id: 4,
        title: "YC Application – Fall 2025", 
        category: "Career", 
        description: "Prepare and submit the application for Y Combinator Fall 2025 batch.",
        progress: 100,
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=60&auto=format&fit=crop",
        milestones: [
          { id: 1, text: "Draft application answers", completed: true, createdAt: "2024-01-18T10:00:00Z" },
          { id: 2, text: "Submit application", completed: true, createdAt: "2024-01-25T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Submitted! Waiting to hear back.", timestamp: "2024-01-25T12:00:00Z" }
        ],
        history: [
          { id: 1, type: "progress", action: "Progress updated to 100%", timestamp: "2024-01-25T12:05:00Z", oldValue: 90, newValue: 100 }
        ]
      }
    ],
    careerGoals: [
      {
        id: 1,
        title: "Complete AWS Certification",
        description: "Obtain AWS Solutions Architect Associate certification to enhance cloud expertise",
        progress: 60,
        targetDate: "2024-12-31",
        status: "In Progress",
        milestones: [
          { id: 1, text: "Study AWS architecture fundamentals", completed: true, createdAt: "2024-01-05T10:00:00Z" },
          { id: 2, text: "Complete practice exams", completed: true, createdAt: "2024-01-15T10:00:00Z" },
          { id: 3, text: "Schedule certification exam", completed: false, createdAt: "2024-01-20T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Registered for AWS training course. Going well so far.", timestamp: "2024-01-10T12:00:00Z" }
        ],
        history: [
          { id: 1, type: "progress", action: "Progress updated to 60%", timestamp: "2024-01-20T09:00:00Z", oldValue: 40, newValue: 60 }
        ]
      },
      {
        id: 2,
        title: "Advance to Technical Lead Role",
        description: "Progress to a senior technical leadership position with team management responsibilities",
        progress: 25,
        targetDate: "2026-06-30",
        status: "Planned",
        milestones: [
          { id: 1, text: "Complete leadership training program", completed: false, createdAt: "2024-01-05T10:00:00Z" },
          { id: 2, text: "Lead a cross-functional project", completed: true, createdAt: "2024-01-08T10:00:00Z" },
          { id: 3, text: "Mentor junior developers", completed: false, createdAt: "2024-01-12T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Started mentoring two junior developers this month.", timestamp: "2024-01-15T11:00:00Z" }
        ],
        history: [
          { id: 1, type: "milestone", action: "Completed milestone: \"Lead a cross-functional project\"", timestamp: "2024-01-15T11:05:00Z" },
          { id: 2, type: "progress", action: "Progress updated to 25%", timestamp: "2024-01-15T11:10:00Z", oldValue: 10, newValue: 25 }
        ]
      }
    ],
    developmentPlan: [
      {
        id: 1,
        title: "Cloud Architecture Course",
        description: "Advanced cloud solutions design patterns and best practices",
        progress: 75,
        targetDate: "2024-03-31",
        status: "In Progress",
        skills: ["AWS", "Cloud Architecture", "System Design", "DevOps"],
        milestones: [
          { id: 1, text: "Complete Module 1: Fundamentals", completed: true, createdAt: "2024-01-05T10:00:00Z" },
          { id: 2, text: "Complete Module 2: Security", completed: true, createdAt: "2024-01-12T10:00:00Z" },
          { id: 3, text: "Complete Module 3: Scalability", completed: true, createdAt: "2024-01-18T10:00:00Z" },
          { id: 4, text: "Complete final project", completed: false, createdAt: "2024-01-25T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Really enjoying the security module. Great practical examples.", timestamp: "2024-01-14T12:00:00Z" }
        ],
        history: [
          { id: 1, type: "progress", action: "Progress updated to 75%", timestamp: "2024-01-20T09:00:00Z", oldValue: 60, newValue: 75 }
        ]
      },
      {
        id: 2,
        title: "Leadership Fundamentals",
        description: "Core leadership and team management skills development",
        progress: 40,
        targetDate: "2024-05-31",
        status: "In Progress",
        skills: ["Leadership", "Team Management", "Communication", "Conflict Resolution"],
        milestones: [
          { id: 1, text: "Complete leadership assessment", completed: true, createdAt: "2024-01-05T10:00:00Z" },
          { id: 2, text: "Attend leadership workshop", completed: false, createdAt: "2024-01-15T10:00:00Z" },
          { id: 3, text: "Practice coaching techniques", completed: false, createdAt: "2024-01-20T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Leadership assessment showed strengths in communication but need to work on delegation.", timestamp: "2024-01-08T12:00:00Z" }
        ],
        history: [
          { id: 1, type: "progress", action: "Progress updated to 40%", timestamp: "2024-01-10T09:00:00Z", oldValue: 20, newValue: 40 }
        ]
      }
    ],
    connects: [
      {
        id: 1,
        withWhom: "Mike Chen",
        date: "2024-01-15",
        notes: "Great conversation about travel experiences in Asia",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
      }
    ],
    weeklyGoals: {
      weekNumber: 4,
      dateRange: "Sep 23 - Sep 30",
      year: 2025,
      totalGoals: 3,
      completedGoals: 0,
      progressPercentage: 0,
      goals: [
        {
          id: 1,
          title: "Price flights to South America",
          description: "Compare options and note prices",
          completed: false,
          dreamId: 2,
          dreamTitle: "Visit Machu Picchu",
          dreamCategory: "Travel",
          createdAt: "2024-09-23T10:00:00Z"
        },
        {
          id: 2,
          title: "4 training sessions with PT",
          description: "Monday, Tuesday, Thursday, Friday",
          completed: false,
          dreamId: 1,
          dreamTitle: "Stick to a Gym Routine",
          dreamCategory: "Health",
          createdAt: "2024-09-23T10:00:00Z"
        },
        {
          id: 3,
          title: "Read every morning for 40mins with coffee",
          description: "Daily morning reading routine",
          completed: false,
          dreamId: 3,
          dreamTitle: "Read a Book a Month",
          dreamCategory: "Learning",
          createdAt: "2024-09-23T10:00:00Z"
        }
      ]
    },
    score: 47,
    dreamsCount: 4,
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
      { 
        id: 1,
        title: "Explore Japan", 
        category: "Travel", 
        description: "Experience Japanese culture, visit temples, and try authentic cuisine",
        progress: 25,
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop&auto=format&q=80",
        milestones: [
          { id: 1, text: "Research destinations and create itinerary", completed: true, createdAt: "2024-01-05T10:00:00Z" },
          { id: 2, text: "Book flights and accommodation", completed: false, createdAt: "2024-01-08T10:00:00Z" },
          { id: 3, text: "Learn basic Japanese phrases", completed: false, createdAt: "2024-01-12T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Looking at cherry blossom season for the trip.", timestamp: "2024-01-06T12:00:00Z" },
          { 
            id: 2, 
            dreamId: 1,
            teamMemberId: 2,
            coachId: 1,
            coachName: "Sarah Johnson",
            note: "Great choice for timing! Consider connecting with Sarah who has travel experience in Asia.",
            type: "suggestion",
            createdAt: "2024-01-12T11:30:00Z",
            isCoachNote: true
          }
        ],
        history: [
          { id: 1, type: "progress", action: "Progress updated to 25%", timestamp: "2024-01-10T09:00:00Z", oldValue: 10, newValue: 25 }
        ]
      },
      { 
        id: 2,
        title: "Launch a Side Project", 
        category: "Creative", 
        description: "Build and launch a design tool for small businesses",
        progress: 40,
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=60&auto=format&fit=crop",
        milestones: [
          { id: 1, text: "Define project scope and features", completed: true, createdAt: "2024-01-03T10:00:00Z" },
          { id: 2, text: "Create wireframes and mockups", completed: true, createdAt: "2024-01-08T10:00:00Z" },
          { id: 3, text: "Build MVP", completed: false, createdAt: "2024-01-15T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Focusing on UI/UX tools for startups.", timestamp: "2024-01-08T12:00:00Z" },
          { 
            id: 2, 
            dreamId: 2,
            teamMemberId: 2,
            coachId: 1,
            coachName: "Sarah Johnson",
            note: "Impressive progress on the creative side! This aligns well with your career goals. Consider beta testing with our internal teams.",
            type: "encouragement",
            createdAt: "2024-01-14T15:45:00Z",
            isCoachNote: true
          }
        ],
        history: [
          { id: 1, type: "milestone", action: "Completed milestone: \"Create wireframes and mockups\"", timestamp: "2024-01-14T11:05:00Z" },
          { id: 2, type: "progress", action: "Progress updated to 40%", timestamp: "2024-01-14T11:10:00Z", oldValue: 25, newValue: 40 }
        ]
      },
      { 
        id: 3,
        title: "AWS Certification", 
        category: "Career", 
        description: "Obtain AWS Solutions Architect certification",
        progress: 60,
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=60&auto=format&fit=crop",
        milestones: [
          { id: 1, text: "Complete AWS training course", completed: true, createdAt: "2024-01-05T10:00:00Z" },
          { id: 2, text: "Take practice exams", completed: true, createdAt: "2024-01-12T10:00:00Z" },
          { id: 3, text: "Schedule certification exam", completed: false, createdAt: "2024-01-20T10:00:00Z" }
        ],
        notes: [
          { id: 1, text: "Scored 85% on latest practice exam.", timestamp: "2024-01-18T12:00:00Z" },
          { 
            id: 2, 
            dreamId: 3,
            teamMemberId: 2,
            coachId: 1,
            coachName: "Sarah Johnson",
            note: "Excellent practice exam scores! You're ready to schedule the real exam. This certification will be valuable for your solution architect goal.",
            type: "milestone",
            createdAt: "2024-01-19T10:20:00Z",
            isCoachNote: true
          }
        ],
        history: [
          { id: 1, type: "progress", action: "Progress updated to 60%", timestamp: "2024-01-18T09:00:00Z", oldValue: 45, newValue: 60 }
        ]
      }
    ],
    careerGoals: [
      {
        id: 1,
        title: "Launch Creative Side Business",
        description: "Start a design consultancy focusing on UI/UX for startups",
        progress: 35,
        targetDate: "2024-08-31",
        status: "In Progress"
      },
      {
        id: 2,
        title: "Become Solution Architect",
        description: "Advance to solution architect role with focus on enterprise clients",
        progress: 50,
        targetDate: "2025-03-31",
        status: "In Progress"
      }
    ],
    developmentPlan: [
      {
        id: 1,
        title: "UI/UX Design Masterclass",
        description: "Complete comprehensive design course to enhance creative skills",
        progress: 80,
        targetDate: "2024-02-28",
        status: "In Progress",
        skills: ["UI Design", "UX Research", "Figma", "Prototyping"]
      },
      {
        id: 2,
        title: "Business Development Skills",
        description: "Learn client management and business development strategies",
        progress: 20,
        targetDate: "2024-06-30",
        status: "Planned",
        skills: ["Client Relations", "Sales", "Business Strategy", "Negotiation"]
      }
    ],
    connects: [
      {
        id: 1,
        withWhom: "Sarah Johnson",
        date: "2024-01-15",
        notes: "Discussed travel plans and shared Japan travel tips",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 2,
        withWhom: "Emma Wilson",
        date: "2024-01-10",
        notes: "Talked about creative projects and collaboration opportunities",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 3,
        withWhom: "Lisa Park",
        date: "2024-01-05",
        notes: "Photography discussion and portfolio review",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
      }
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
    careerGoals: [
      {
        id: 1,
        title: "Become Team Lead",
        description: "Lead a cross-functional development team and mentor junior developers",
        progress: 45,
        targetDate: "2024-10-31",
        status: "In Progress"
      },
      {
        id: 2,
        title: "Master Data Science",
        description: "Transition into data science role with machine learning focus",
        progress: 15,
        targetDate: "2025-12-31",
        status: "Planned"
      }
    ],
    developmentPlan: [
      {
        id: 1,
        title: "Leadership & Management Training",
        description: "Comprehensive leadership program for technical managers",
        progress: 65,
        targetDate: "2024-04-30",
        status: "In Progress",
        skills: ["Team Leadership", "Project Management", "Conflict Resolution", "1-on-1 Coaching"]
      },
      {
        id: 2,
        title: "Data Science Bootcamp",
        description: "Machine learning and data analytics certification program",
        progress: 10,
        targetDate: "2024-09-30",
        status: "Planned",
        skills: ["Python", "Machine Learning", "Data Analysis", "Statistics"]
      }
    ],
    connects: [
      {
        id: 1,
        withWhom: "Mike Chen",
        date: "2024-01-10",
        notes: "Discussed leadership challenges and creative problem-solving approaches",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 2,
        withWhom: "James Rodriguez",
        date: "2024-01-03",
        notes: "Shared fitness goals and accountability partnership for running",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
      }
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
    careerGoals: [
      {
        id: 1,
        title: "Obtain PMP Certification",
        description: "Become a certified Project Management Professional to advance to senior PM roles",
        progress: 80,
        targetDate: "2024-05-31",
        status: "In Progress"
      },
      {
        id: 2,
        title: "Establish Mentorship Program",
        description: "Create and lead a formal mentorship program for junior developers",
        progress: 55,
        targetDate: "2024-07-31",
        status: "In Progress"
      }
    ],
    developmentPlan: [
      {
        id: 1,
        title: "Advanced Project Management",
        description: "PMP exam preparation and advanced project management methodologies",
        progress: 85,
        targetDate: "2024-04-30",
        status: "In Progress",
        skills: ["PMP", "Agile/Scrum", "Risk Management", "Stakeholder Management"]
      },
      {
        id: 2,
        title: "Financial Planning & Investment",
        description: "Personal finance and investment strategies for wealth building",
        progress: 30,
        targetDate: "2024-12-31",
        status: "In Progress",
        skills: ["Financial Planning", "Investment Strategy", "Real Estate", "Budgeting"]
      }
    ],
    connects: [
      {
        id: 1,
        withWhom: "Emma Wilson",
        date: "2024-01-03",
        notes: "Discussed mentorship approaches and shared running experiences",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 2,
        withWhom: "David Thompson",
        date: "2023-12-28",
        notes: "Adventure planning and project management techniques",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 3,
        withWhom: "Lisa Park",
        date: "2023-12-20",
        notes: "Creative project collaboration and financial goal setting",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 4,
        withWhom: "Noah Patel",
        date: "2023-12-15",
        notes: "Career development strategies and industry networking",
        avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop&crop=face"
      }
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
    careerGoals: [
      {
        id: 1,
        title: "Launch Photography Business",
        description: "Start freelance photography business specializing in corporate and event photography",
        progress: 25,
        targetDate: "2024-09-30",
        status: "Planned"
      },
      {
        id: 2,
        title: "Complete Visual Design Certification",
        description: "Get certified in advanced visual design and digital art techniques",
        progress: 40,
        targetDate: "2024-06-30",
        status: "In Progress"
      }
    ],
    developmentPlan: [
      {
        id: 1,
        title: "Advanced Photography Techniques",
        description: "Master professional photography lighting, composition and post-processing",
        progress: 60,
        targetDate: "2024-05-31",
        status: "In Progress",
        skills: ["Photography", "Lightroom", "Photoshop", "Composition"]
      },
      {
        id: 2,
        title: "Business & Marketing Fundamentals",
        description: "Learn essential business skills for creative entrepreneurship",
        progress: 15,
        targetDate: "2024-08-31",
        status: "Planned",
        skills: ["Marketing", "Business Strategy", "Client Relations", "Branding"]
      }
    ],
    connects: [
      {
        id: 1,
        withWhom: "Mike Chen",
        date: "2024-01-05",
        notes: "Portfolio review and creative collaboration discussion",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
      }
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
    careerGoals: [
      {
        id: 1,
        title: "Become DevOps Engineer",
        description: "Transition from development to DevOps with focus on cloud infrastructure and automation",
        progress: 65,
        targetDate: "2024-11-30",
        status: "In Progress"
      },
      {
        id: 2,
        title: "Complete Kubernetes Certification",
        description: "Achieve CKA (Certified Kubernetes Administrator) certification",
        progress: 40,
        targetDate: "2024-08-31",
        status: "In Progress"
      }
    ],
    developmentPlan: [
      {
        id: 1,
        title: "Cloud Infrastructure & DevOps",
        description: "Comprehensive training in cloud platforms and DevOps practices",
        progress: 70,
        targetDate: "2024-07-31",
        status: "In Progress",
        skills: ["AWS", "Docker", "Kubernetes", "CI/CD"]
      },
      {
        id: 2,
        title: "Infrastructure as Code",
        description: "Master Terraform and infrastructure automation tools",
        progress: 35,
        targetDate: "2024-09-30",
        status: "In Progress",
        skills: ["Terraform", "Ansible", "CloudFormation", "Infrastructure Automation"]
      }
    ],
    connects: [
      {
        id: 1,
        withWhom: "James Rodriguez",
        date: "2023-12-28",
        notes: "Shared adventure stories and discussed project automation techniques",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
      },
      {
        id: 2,
        withWhom: "Noah Patel",
        date: "2023-12-22",
        notes: "Technology trends discussion and infrastructure best practices",
        avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop&crop=face"
      }
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
    careerGoals: [
      {
        id: 1,
        title: "Build Personal Brand",
        description: "Establish thought leadership in design and technology through content creation and speaking",
        progress: 30,
        targetDate: "2024-12-31",
        status: "In Progress"
      },
      {
        id: 2,
        title: "Senior Product Designer Role",
        description: "Advance to senior product designer position at a leading tech company",
        progress: 50,
        targetDate: "2024-10-31",
        status: "In Progress"
      }
    ],
    developmentPlan: [
      {
        id: 1,
        title: "Advanced UX Research & Strategy",
        description: "Master user research methodologies and strategic design thinking",
        progress: 45,
        targetDate: "2024-06-30",
        status: "In Progress",
        skills: ["UX Research", "Design Strategy", "User Testing", "Data Analysis"]
      },
      {
        id: 2,
        title: "Content Creation & Public Speaking",
        description: "Develop skills in creating educational content and conference speaking",
        progress: 25,
        targetDate: "2024-09-30",
        status: "Planned",
        skills: ["Content Writing", "Public Speaking", "Video Production", "Social Media"]
      }
    ],
    connects: [
      {
        id: 1,
        withWhom: "David Thompson",
        date: "2023-12-22",
        notes: "Discussed design systems and infrastructure automation parallels",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
      }
    ],
    score: 44,
    dreamsCount: 3,
    connectsCount: 1
  },
  {
    id: 8,
    name: "Bruce Banner",
    email: "bruce.banner@netsurit.com",
    office: "New York",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    dreamCategories: ["Learning", "Career", "Health"],
    latestDreamTitle: "Master React and TypeScript",
    dreamBook: [
      {
        id: 1,
        title: "Master React and TypeScript",
        category: "Learning",
        description: "Become proficient in React hooks, context API, and advanced TypeScript patterns to build scalable frontend applications.",
        progress: 25,
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=60&auto=format&fit=crop"
      },
      {
        id: 2,
        title: "Lead Development Team",
        category: "Career",
        description: "Transition from senior developer to team lead role, managing a team of 5 developers and driving technical decisions.",
        progress: 40,
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=60&auto=format&fit=crop"
      },
      {
        id: 3,
        title: "Train for NYC Marathon",
        category: "Health",
        description: "Complete a comprehensive 16-week training program to successfully finish the New York City Marathon.",
        progress: 15,
        image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=600&q=60&auto=format&fit=crop"
      }
    ],
    sampleDreams: [
      { title: "Master React and TypeScript", category: "Learning", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=60&auto=format&fit=crop" },
      { title: "Lead Development Team", category: "Career", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=60&auto=format&fit=crop" },
      { title: "Train for NYC Marathon", category: "Health", image: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=600&q=60&auto=format&fit=crop" }
    ],
    careerGoals: [
      {
        id: 1,
        title: "Become Engineering Manager",
        description: "Transition from senior developer to engineering management role",
        progress: 75,
        targetDate: "2024-08-31",
        status: "In Progress"
      },
      {
        id: 2,
        title: "Complete Leadership Training",
        description: "Complete advanced leadership and management certification program",
        progress: 50,
        targetDate: "2024-10-31",
        status: "In Progress"
      }
    ],
    developmentPlan: [
      {
        id: 1,
        title: "Technical Leadership & Team Management",
        description: "Develop skills in technical leadership, team management, and strategic planning",
        progress: 80,
        targetDate: "2024-07-31",
        status: "In Progress",
        skills: ["Team Leadership", "Technical Strategy", "Performance Management", "Agile Coaching"]
      },
      {
        id: 2,
        title: "Advanced React & System Architecture",
        description: "Master advanced React patterns and system architecture design",
        progress: 90,
        targetDate: "2024-06-30",
        status: "In Progress",
        skills: ["React", "TypeScript", "System Design", "Architecture Patterns"]
      }
    ],
    connects: [
      { id: 1, name: "Sarah Johnson", category: "Learning", mutual: true },
      { id: 2, name: "Mike Chen", category: "Career", mutual: true },
      { id: 3, name: "Emma Wilson", category: "Health", mutual: false }
    ],
    score: 95,
    dreamsCount: 8,
    connectsCount: 5
  },
  {
    id: 9,
    name: "Clark Kent",
    email: "clark.kent@netsurit.com",
    office: "Metropolis",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    dreamCategories: ["Creative", "Learning", "Community"],
    latestDreamTitle: "Write and Publish Technical Blog",
    dreamBook: [
      {
        id: 1,
        title: "Write and Publish Technical Blog",
        category: "Creative",
        description: "Start a weekly blog about emerging technologies and their impact on business transformation.",
        progress: 60,
        image: "https://images.unsplash.com/photo-1486312338219-ce68e2c6b7d9?auto=format&fit=crop&w=600&q=60"
      },
      {
        id: 2,
        title: "Master Cloud Architecture Certification",
        category: "Learning",
        description: "Achieve AWS Solutions Architect Professional certification to lead cloud migration projects.",
        progress: 30,
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=60"
      },
      {
        id: 3,
        title: "Mentor Junior Developers",
        category: "Community",
        description: "Establish a formal mentorship program for new graduates joining our development teams.",
        progress: 50,
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=60"
      },
      {
        id: 4,
        title: "Learn Photojournalism",
        category: "Creative",
        description: "Take professional photography courses to enhance visual storytelling skills for content creation.",
        progress: 20,
        image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=60"
      }
    ],
    sampleDreams: [
      { title: "Write and Publish Technical Blog", category: "Creative", image: "https://images.unsplash.com/photo-1486312338219-ce68e2c6b7d9?auto=format&fit=crop&w=600&q=60" },
      { title: "Master Cloud Architecture Certification", category: "Learning", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=60" },
      { title: "Mentor Junior Developers", category: "Community", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=60" },
      { title: "Learn Photojournalism", category: "Creative", image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=60" }
    ],
    careerGoals: [
      {
        id: 1,
        title: "Become CTO",
        description: "Lead technology strategy and innovation across the organization",
        progress: 45,
        targetDate: "2025-12-31",
        status: "In Progress"
      },
      {
        id: 2,
        title: "Build World-Class Dev Team",
        description: "Recruit and develop a team of exceptional software engineers",
        progress: 70,
        targetDate: "2024-12-31",
        status: "In Progress"
      }
    ],
    developmentPlan: [
      {
        id: 1,
        title: "Executive Leadership & Strategic Thinking",
        description: "Develop executive presence and strategic planning capabilities",
        progress: 40,
        targetDate: "2024-10-31",
        status: "In Progress",
        skills: ["Executive Leadership", "Strategic Planning", "Innovation Management", "Team Building"]
      }
    ],
    connects: [
      { id: 1, name: "Bruce Banner", category: "Learning", mutual: true },
      { id: 2, name: "Diana Prince", category: "Community", mutual: true },
      { id: 3, name: "Tony Stark", category: "Creative", mutual: false }
    ],
    score: 120,
    dreamsCount: 4,
    connectsCount: 3
  }
];

export const offices = ["Cape Town", "Johannesburg", "Durban", "Pretoria", "New York"];

export const scoringRules = {
  dreamCompleted: 10,
  dreamConnect: 5,
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

// Team management data
export const teamRelationships = [
  {
    managerId: 1, // Sarah Johnson is a manager
    teamMembers: [2, 3, 4, 5, 6], // Mike, Emma, James, Lisa, David
    teamName: "Development Team Alpha",
    managerRole: "Dream Coach"
  },
  {
    managerId: 8, // Bruce Banner is a manager
    teamMembers: [7], // Noah Patel (New York team member)
    teamName: "New York Engineering Team",
    managerRole: "Dream Coach"
  }
];

// Coaching notes and interactions
export const coachingNotes = [
  {
    id: 1,
    managerId: 1,
    teamMemberId: 2,
    note: "Mike is making great progress on his creative goals. Suggested connecting with Lisa for photography collaboration.",
    type: "progress_update",
    createdAt: "2024-01-20T10:00:00Z",
    followUpDate: "2024-01-27T10:00:00Z"
  },
  {
    id: 2,
    managerId: 1,
    teamMemberId: 3,
    note: "Emma seems stuck on her half marathon goal. Recommended connecting with James for running accountability partner.",
    type: "intervention",
    createdAt: "2024-01-18T14:30:00Z",
    followUpDate: "2024-01-25T14:30:00Z"
  },
  {
    id: 3,
    managerId: 1,
    teamMemberId: 4,
    note: "James is excelling with his PMP certification. Great mentor potential for other team members.",
    type: "recognition",
    createdAt: "2024-01-15T09:15:00Z",
    followUpDate: null
  },
  {
    id: 4,
    managerId: 1,
    teamMemberId: 5,
    note: "Lisa hasn't updated her dreams in 2 weeks. Scheduled one-on-one to discuss any blockers.",
    type: "check_in",
    createdAt: "2024-01-22T11:45:00Z",
    followUpDate: "2024-01-24T15:00:00Z"
  }
];

// Team performance metrics
export const getTeamMetrics = (managerId) => {
  const team = teamRelationships.find(t => t.managerId === managerId);
  if (!team) return null;

  const teamMembers = allUsers.filter(u => team.teamMembers.includes(u.id));
  
  const totalDreams = teamMembers.reduce((sum, member) => sum + (member.dreamsCount || 0), 0);
  const totalConnects = teamMembers.reduce((sum, member) => sum + (member.connectsCount || 0), 0);
  const totalScore = teamMembers.reduce((sum, member) => sum + (member.score || 0), 0);
  const averageScore = Math.round(totalScore / teamMembers.length);
  
  const activeMembersCount = teamMembers.filter(member => {
    const hasRecentActivity = member.score > 0;
    return hasRecentActivity;
  }).length;
  
  const engagementRate = Math.round((activeMembersCount / teamMembers.length) * 100);
  
  return {
    teamSize: teamMembers.length,
    totalDreams,
    totalConnects,
    averageScore,
    engagementRate,
    activeMembersCount,
    teamMembers
  };
};

// Get coaching alerts for a manager
export const getCoachingAlerts = (managerId) => {
  const team = teamRelationships.find(t => t.managerId === managerId);
  if (!team) return [];

  const teamMembers = allUsers.filter(u => team.teamMembers.includes(u.id));
  const alerts = [];

  teamMembers.forEach(member => {
    // Low engagement alert
    if (member.score < 20) {
      alerts.push({
        id: `low-engagement-${member.id}`,
        type: 'low_engagement',
        priority: 'medium',
        memberId: member.id,
        memberName: member.name,
        message: `${member.name} has low engagement (${member.score} points)`,
        actionSuggestion: 'Schedule a one-on-one check-in'
      });
    }

    // High performer recognition
    if (member.score > 60) {
      alerts.push({
        id: `high-performer-${member.id}`,
        type: 'recognition',
        priority: 'low',
        memberId: member.id,
        memberName: member.name,
        message: `${member.name} is a high performer (${member.score} points)`,
        actionSuggestion: 'Consider for peer mentoring opportunities'
      });
    }

    // Few dreams alert
    if ((member.dreamsCount || 0) < 3) {
      alerts.push({
        id: `few-dreams-${member.id}`,
        type: 'goal_setting',
        priority: 'medium',
        memberId: member.id,
        memberName: member.name,
        message: `${member.name} has only ${member.dreamsCount || 0} dreams`,
        actionSuggestion: 'Help with dream brainstorming session'
      });
    }
  });

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// Weekly Goals Helper Functions
export const getWeeklyGoals = (userId = 1) => {
  const user = allUsers.find(u => u.id === userId) || currentUser;
  return user.weeklyGoals || null;
};

export const updateWeeklyGoalProgress = (userId, goalId, completed) => {
  const user = allUsers.find(u => u.id === userId);
  if (!user || !user.weeklyGoals) return false;
  
  const goal = user.weeklyGoals.goals.find(g => g.id === goalId);
  if (!goal) return false;
  
  goal.completed = completed;
  
  // Update overall progress
  const completedCount = user.weeklyGoals.goals.filter(g => g.completed).length;
  user.weeklyGoals.completedGoals = completedCount;
  user.weeklyGoals.progressPercentage = Math.round((completedCount / user.weeklyGoals.totalGoals) * 100);
  
  return true;
};

export const addWeeklyGoal = (userId, goalData) => {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return false;
  
  if (!user.weeklyGoals) {
    user.weeklyGoals = {
      weekNumber: 4,
      dateRange: "Sep 23 - Sep 30",
      year: 2025,
      totalGoals: 0,
      completedGoals: 0,
      progressPercentage: 0,
      goals: []
    };
  }
  
  const newGoal = {
    id: user.weeklyGoals.goals.length + 1,
    ...goalData,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  user.weeklyGoals.goals.push(newGoal);
  user.weeklyGoals.totalGoals = user.weeklyGoals.goals.length;
  
  return newGoal;
};