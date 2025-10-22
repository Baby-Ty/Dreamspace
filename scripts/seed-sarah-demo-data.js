/**
 * Seed Sarah Johnson's demo account data to Cosmos DB
 * This ensures the demo login has persistent, realistic data
 * 
 * Usage:
 * 1. Ensure your Azure Functions API is running locally OR deployed
 * 2. Run: node scripts/seed-sarah-demo-data.js [API_URL]
 * 
 * Example:
 *   node scripts/seed-sarah-demo-data.js http://localhost:7071/api
 *   node scripts/seed-sarah-demo-data.js https://your-function-app.azurewebsites.net/api
 */

const sarahJohnsonData = {
  id: "sarah.johnson@netsurit.com",
  userId: "sarah.johnson@netsurit.com",
  name: "Sarah Johnson",
  email: "sarah.johnson@netsurit.com",
  office: "Cape Town",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
  jobTitle: "Senior Development Manager",
  department: "Engineering",
  role: "coach",
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

async function seedSarahData(apiBaseUrl) {
  const userId = "sarah.johnson@netsurit.com";
  const url = `${apiBaseUrl}/saveUserData/${userId}`;

  console.log('\n🌱 Seeding Sarah Johnson demo data...');
  console.log(`📍 API URL: ${url}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`📚 Dreams: ${sarahJohnsonData.dreamBook.length}`);
  console.log(`🎯 Career Goals: ${sarahJohnsonData.careerGoals.length}`);
  console.log(`📈 Development Plans: ${sarahJohnsonData.developmentPlan.length}`);
  console.log(`🤝 Connects: ${sarahJohnsonData.connects.length}`);
  console.log('');

  // Wrap the data in the expected format
  const dataToSave = {
    isAuthenticated: true,
    currentUser: sarahJohnsonData,
    weeklyGoals: sarahJohnsonData.weeklyGoals || [],
    scoringHistory: sarahJohnsonData.scoringHistory || []
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSave)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Sarah Johnson data seeded successfully!');
    console.log('📦 Result:', JSON.stringify(result, null, 2));
    
    if (result.format === 'split') {
      console.log(`\n🎉 Data migrated to 3-container format with ${result.itemCount} items`);
    }
    
    console.log('\n✨ Demo account is now ready!');
    console.log('🔑 Login as: sarah.johnson@netsurit.com (Demo mode)');
    console.log('');

    return true;
  } catch (error) {
    console.error('\n❌ Failed to seed Sarah Johnson data:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure your Azure Functions API is running');
    console.error('2. Check that COSMOS_ENDPOINT and COSMOS_KEY are set');
    console.error('3. Verify the API URL is correct');
    console.error('');
    return false;
  }
}

// Main execution
async function main() {
  // Get API URL from command line or use default
  const apiBaseUrl = process.argv[2] || 'http://localhost:7071/api';
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Sarah Johnson Demo Data Seeding Script                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  const success = await seedSarahData(apiBaseUrl);
  
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Auto-run when executed directly
main();

export { sarahJohnsonData, seedSarahData };

