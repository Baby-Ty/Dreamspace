// Setup script to create Sarah Johnson and her team in Cosmos DB for demo purposes

const sarahJohnsonData = {
  id: "sarah.johnson@netsurit.com",
  userId: "sarah.johnson@netsurit.com", 
  name: "Sarah Johnson",
  email: "sarah.johnson@netsurit.com",
  office: "Cape Town",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
  jobTitle: "Senior Development Manager",
  department: "Engineering",
  role: "coach", // This will make her a coach
  dreamCategories: ["Learning", "Travel", "Health", "Career"],
  dreamBook: [
    {
      id: 1,
      title: "Master Team Leadership",
      category: "Career",
      description: "Develop advanced leadership skills to effectively manage and inspire development teams.",
      progress: 75,
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=60&auto=format&fit=crop",
      milestones: [
        { id: 1, text: "Complete leadership training program", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Implement weekly 1:1s with all team members", completed: true, createdAt: "2024-01-15T10:00:00Z" },
        { id: 3, text: "Launch team mentorship program", completed: false, createdAt: "2024-02-01T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Started implementing new team structure with clear roles and responsibilities.", timestamp: "2024-01-06T12:00:00Z" },
        { id: 2, text: "Team feedback has been very positive on the new 1:1 format.", timestamp: "2024-01-20T14:30:00Z" }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 75%", timestamp: "2024-01-20T09:00:00Z", oldValue: 60, newValue: 75 }
      ]
    },
    {
      id: 2,
      title: "Complete Advanced React Certification",
      category: "Learning",
      description: "Stay current with the latest React patterns and advanced techniques to guide team development.",
      progress: 45,
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=60&auto=format&fit=crop",
      milestones: [
        { id: 1, text: "Complete React 18 new features course", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Build demo project with Next.js 14", completed: false, createdAt: "2024-01-15T10:00:00Z" },
        { id: 3, text: "Pass certification exam", completed: false, createdAt: "2024-02-01T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "React 18 concurrent features are game-changing for performance.", timestamp: "2024-01-10T11:00:00Z" }
      ],
      history: [
        { id: 1, type: "milestone", action: "Completed milestone: React 18 course", timestamp: "2024-01-10T11:05:00Z" }
      ]
    },
    {
      id: 3,
      title: "Run Cape Town Marathon",
      category: "Health",
      description: "Train for and complete the Cape Town Marathon to maintain physical and mental health.",
      progress: 30,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=60&auto=format&fit=crop",
      milestones: [
        { id: 1, text: "Create 16-week training plan", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Complete first 10K training run", completed: true, createdAt: "2024-01-15T10:00:00Z" },
        { id: 3, text: "Register for marathon", completed: false, createdAt: "2024-02-01T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Training is going well, running 3x per week consistently.", timestamp: "2024-01-20T07:00:00Z" }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 30%", timestamp: "2024-01-20T07:05:00Z", oldValue: 15, newValue: 30 }
      ]
    }
  ],
  careerGoals: [
    {
      id: 1,
      title: "Lead Digital Transformation Initiative",
      description: "Spearhead the company's digital transformation, modernizing legacy systems and processes",
      progress: 85,
      targetDate: "2024-06-30",
      status: "In Progress"
    },
    {
      id: 2,
      title: "Expand Team to 12 Developers",
      description: "Grow the development team from 6 to 12 developers while maintaining code quality and team culture",
      progress: 60,
      targetDate: "2024-08-31",
      status: "In Progress"
    }
  ],
  developmentPlan: [
    {
      id: 1,
      skill: "Strategic Leadership",
      currentLevel: "Proficient",
      targetLevel: "Expert",
      priority: "High",
      actions: ["Executive MBA program", "Cross-functional project leadership", "Board presentation experience"],
      timeline: "6 months"
    },
    {
      id: 2,
      skill: "Cloud Architecture",
      currentLevel: "Intermediate",
      targetLevel: "Advanced",
      priority: "Medium",
      actions: ["AWS Solutions Architect certification", "Lead cloud migration project", "Architecture review board participation"],
      timeline: "4 months"
    }
  ],
  careerProfile: {
    currentRole: {
      jobTitle: "Senior Development Manager",
      department: "Engineering",
      startDate: "2022-03-15",
      location: "Cape Town, South Africa"
    },
    aspirations: {
      desiredJobTitle: "VP of Engineering",
      preferredDepartment: "Engineering Leadership",
      interestedInRelocation: false,
      preferredGeography: "Cape Town"
    },
    preferences: {
      wantToDo: ["Team Leadership", "Strategic Planning", "Mentoring", "Technology Innovation"],
      dontWantToDo: ["Individual Contributor Work", "Travel >50%", "Legacy System Maintenance"],
      motivators: ["Team Growth", "Technical Excellence", "Innovation", "Work-Life Balance"]
    },
    careerHighlights: [
      "Led successful migration from monolith to microservices architecture",
      "Grew development team from 3 to 8 members",
      "Implemented DevOps practices reducing deployment time by 80%",
      "Mentored 5 junior developers to mid-level positions"
    ],
    skills: {
      technical: ["React", "Node.js", "AWS", "Docker", "Kubernetes", "TypeScript", "GraphQL"],
      soft: ["Team Leadership", "Strategic Thinking", "Communication", "Problem Solving", "Mentoring"]
    }
  },
  score: 142,
  dreamsCount: 3,
  connectsCount: 8,
  connects: [
    {
      id: 1,
      fromUserId: "sarah.johnson@netsurit.com",
      toUserId: "mike.chen@netsurit.com",
      type: "support",
      message: "Great progress on your React learning goals! Keep it up!",
      timestamp: "2024-01-20T14:30:00Z"
    },
    {
      id: 2,
      fromUserId: "sarah.johnson@netsurit.com", 
      toUserId: "jennifer.smith@netsurit.com",
      type: "encouragement",
      message: "Your leadership potential is really showing in team meetings.",
      timestamp: "2024-01-18T11:20:00Z"
    }
  ],
  weeklyGoals: [
    {
      id: 1,
      title: "Complete team performance reviews",
      category: "Career",
      completed: false,
      dueDate: "2024-01-26T17:00:00Z"
    },
    {
      id: 2, 
      title: "Run 15km training run",
      category: "Health",
      completed: true,
      dueDate: "2024-01-21T09:00:00Z"
    }
  ],
  scoringHistory: [
    { date: "2024-01-20", score: 142, change: +8 },
    { date: "2024-01-19", score: 134, change: +5 },
    { date: "2024-01-18", score: 129, change: +3 }
  ],
  lastUpdated: new Date().toISOString()
};

// Team Member 1: Mike Chen - Frontend Developer
const mikeChenData = {
  id: "mike.chen@netsurit.com",
  userId: "mike.chen@netsurit.com",
  name: "Mike Chen",
  email: "mike.chen@netsurit.com",
  office: "Cape Town",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
  jobTitle: "Frontend Developer",
  department: "Engineering",
  role: "employee",
  coachId: "sarah.johnson@netsurit.com", // Sarah is his coach
  dreamCategories: ["Learning", "Career", "Technology"],
  dreamBook: [
    {
      id: 1,
      title: "Master React and TypeScript",
      category: "Learning",
      description: "Become proficient in React 18 features and advanced TypeScript patterns.",
      progress: 65,
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=60&auto=format&fit=crop",
      milestones: [
        { id: 1, text: "Complete React Hooks mastery", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Learn TypeScript generics", completed: true, createdAt: "2024-01-15T10:00:00Z" },
        { id: 3, text: "Build full-stack project", completed: false, createdAt: "2024-02-01T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "React Suspense and concurrent features are fascinating!", timestamp: "2024-01-10T14:00:00Z" },
        {
          id: 2,
          dreamId: 1,
          teamMemberId: "mike.chen@netsurit.com",
          coachId: "sarah.johnson@netsurit.com",
          coachName: "Sarah Johnson",
          note: "Excellent progress on TypeScript! Consider applying these patterns to our current project.",
          type: "encouragement",
          createdAt: "2024-01-16T10:30:00Z",
          isCoachNote: true
        }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 65%", timestamp: "2024-01-16T09:00:00Z", oldValue: 50, newValue: 65 }
      ]
    },
    {
      id: 2,
      title: "Get Promoted to Senior Developer",
      category: "Career", 
      description: "Achieve senior developer role by demonstrating leadership and technical expertise.",
      progress: 40,
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=60&auto=format&fit=crop",
      milestones: [
        { id: 1, text: "Lead code review sessions", completed: true, createdAt: "2024-01-08T10:00:00Z" },
        { id: 2, text: "Mentor junior developer", completed: false, createdAt: "2024-01-20T10:00:00Z" },
        { id: 3, text: "Present at engineering meeting", completed: false, createdAt: "2024-02-05T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Starting to mentor Alex on React patterns.", timestamp: "2024-01-18T11:00:00Z" }
      ],
      history: [
        { id: 1, type: "milestone", action: "Completed: Lead code review sessions", timestamp: "2024-01-18T11:05:00Z" }
      ]
    }
  ],
  careerGoals: [
    {
      id: 1,
      title: "Senior Frontend Developer Promotion",
      description: "Advance to senior level by demonstrating technical leadership and mentoring abilities",
      progress: 45,
      targetDate: "2024-07-31",
      status: "In Progress"
    }
  ],
  score: 89,
  dreamsCount: 2,
  connectsCount: 4,
  lastUpdated: new Date().toISOString()
};

// Team Member 2: Jennifer Smith - Full Stack Developer  
const jenniferSmithData = {
  id: "jennifer.smith@netsurit.com",
  userId: "jennifer.smith@netsurit.com",
  name: "Jennifer Smith", 
  email: "jennifer.smith@netsurit.com",
  office: "Cape Town",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
  jobTitle: "Full Stack Developer",
  department: "Engineering", 
  role: "employee",
  coachId: "sarah.johnson@netsurit.com",
  dreamCategories: ["Career", "Learning", "Leadership"],
  dreamBook: [
    {
      id: 1,
      title: "Become a Tech Lead",
      category: "Career",
      description: "Develop the technical and people skills necessary to lead engineering projects.",
      progress: 55,
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=60&auto=format&fit=crop",
      milestones: [
        { id: 1, text: "Complete technical architecture course", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Lead a cross-team project", completed: false, createdAt: "2024-01-20T10:00:00Z" },
        { id: 3, text: "Get positive leadership feedback", completed: false, createdAt: "2024-02-15T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Architecture course gave me great insights into system design.", timestamp: "2024-01-12T15:00:00Z" },
        {
          id: 2,
          dreamId: 1,
          teamMemberId: "jennifer.smith@netsurit.com", 
          coachId: "sarah.johnson@netsurit.com",
          coachName: "Sarah Johnson",
          note: "Your natural leadership abilities are already showing. Consider volunteering for the upcoming integration project.",
          type: "encouragement",
          createdAt: "2024-01-18T11:20:00Z",
          isCoachNote: true
        }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 55%", timestamp: "2024-01-18T09:00:00Z", oldValue: 40, newValue: 55 }
      ]
    },
    {
      id: 2,
      title: "Master Cloud Technologies",
      category: "Learning",
      description: "Gain expertise in AWS services and cloud-native development practices.",
      progress: 30,
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=60&auto=format&fit=crop",
      milestones: [
        { id: 1, text: "Complete AWS fundamentals course", completed: true, createdAt: "2024-01-08T10:00:00Z" },
        { id: 2, text: "Deploy personal project to AWS", completed: false, createdAt: "2024-01-25T10:00:00Z" },
        { id: 3, text: "Get AWS certification", completed: false, createdAt: "2024-03-01T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "AWS Lambda and DynamoDB are perfect for our use case.", timestamp: "2024-01-15T13:00:00Z" }
      ],
      history: [
        { id: 1, type: "milestone", action: "Completed: AWS fundamentals course", timestamp: "2024-01-15T13:05:00Z" }
      ]
    }
  ],
  careerGoals: [
    {
      id: 1,
      title: "Technical Lead Position", 
      description: "Transition into technical leadership role leading a team of 4-6 developers",
      progress: 50,
      targetDate: "2024-09-30",
      status: "In Progress"
    }
  ],
  score: 98,
  dreamsCount: 2,
  connectsCount: 3,
  lastUpdated: new Date().toISOString()
};

// Team Member 3: Alex Rodriguez - Junior Developer
const alexRodriguezData = {
  id: "alex.rodriguez@netsurit.com",
  userId: "alex.rodriguez@netsurit.com",
  name: "Alex Rodriguez",
  email: "alex.rodriguez@netsurit.com", 
  office: "Cape Town",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
  jobTitle: "Junior Developer",
  department: "Engineering",
  role: "employee", 
  coachId: "sarah.johnson@netsurit.com",
  dreamCategories: ["Learning", "Career", "Skills"],
  dreamBook: [
    {
      id: 1,
      title: "Master JavaScript Fundamentals",
      category: "Learning",
      description: "Build a strong foundation in JavaScript, ES6+, and modern development practices.",
      progress: 70,
      image: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&q=60&auto=format&fit=crop",
      milestones: [
        { id: 1, text: "Complete JavaScript course", completed: true, createdAt: "2024-01-05T10:00:00Z" },
        { id: 2, text: "Build 3 portfolio projects", completed: true, createdAt: "2024-01-18T10:00:00Z" },
        { id: 3, text: "Contribute to team project", completed: false, createdAt: "2024-02-01T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Async/await patterns finally clicked for me!", timestamp: "2024-01-12T16:00:00Z" },
        {
          id: 2,
          dreamId: 1, 
          teamMemberId: "alex.rodriguez@netsurit.com",
          coachId: "sarah.johnson@netsurit.com",
          coachName: "Sarah Johnson", 
          note: "Fantastic progress! Your code quality has improved dramatically. Ready for your first feature assignment.",
          type: "encouragement",
          createdAt: "2024-01-19T14:15:00Z",
          isCoachNote: true
        }
      ],
      history: [
        { id: 1, type: "progress", action: "Progress updated to 70%", timestamp: "2024-01-19T09:00:00Z", oldValue: 55, newValue: 70 }
      ]
    },
    {
      id: 2,
      title: "Become a Mid-Level Developer",
      category: "Career",
      description: "Advance from junior to mid-level developer within 18 months through skill development.",
      progress: 25,
      image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600&q=60&auto=format&fit=crop",
      milestones: [
        { id: 1, text: "Complete onboarding program", completed: true, createdAt: "2024-01-03T10:00:00Z" },
        { id: 2, text: "Ship first major feature", completed: false, createdAt: "2024-02-15T10:00:00Z" },
        { id: 3, text: "Get positive performance review", completed: false, createdAt: "2024-06-30T10:00:00Z" }
      ],
      notes: [
        { id: 1, text: "Excited to work on the user dashboard feature next!", timestamp: "2024-01-20T10:00:00Z" }
      ],
      history: [
        { id: 1, type: "milestone", action: "Completed: Onboarding program", timestamp: "2024-01-20T10:05:00Z" }
      ]
    }
  ],
  careerGoals: [
    {
      id: 1,
      title: "Mid-Level Developer Promotion",
      description: "Progress to mid-level developer role through consistent skill development and delivery",
      progress: 30,
      targetDate: "2025-06-30", 
      status: "In Progress"
    }
  ],
  score: 67,
  dreamsCount: 2,
  connectsCount: 2,
  lastUpdated: new Date().toISOString()
};

console.log('Demo Users Data Created:');
console.log('1. Sarah Johnson (Coach):', JSON.stringify(sarahJohnsonData, null, 2));
console.log('\n2. Mike Chen (Team Member):', JSON.stringify(mikeChenData, null, 2));  
console.log('\n3. Jennifer Smith (Team Member):', JSON.stringify(jenniferSmithData, null, 2));
console.log('\n4. Alex Rodriguez (Team Member):', JSON.stringify(alexRodriguezData, null, 2));

// Export the data for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sarahJohnsonData,
    mikeChenData, 
    jenniferSmithData,
    alexRodriguezData
  };
}
