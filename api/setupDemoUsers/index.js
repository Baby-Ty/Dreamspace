const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client only if environment variables are present
let client, database, container;
if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  database = client.database('dreamspace');
  container = database.container('users');
}

module.exports = async function (context, req) {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers };
    return;
  }

  context.log('Setting up demo users for production...');

  // Check if Cosmos DB is configured
  if (!container) {
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Database not configured', 
        details: 'COSMOS_ENDPOINT and COSMOS_KEY environment variables are required' 
      }),
      headers
    };
    return;
  }

  try {
    // Define the 4 demo users with complete profiles
    const demoUsers = [
      {
        id: "sarah.johnson@netsurit.com",
        userId: "sarah.johnson@netsurit.com", 
        name: "Sarah Johnson",
        email: "sarah.johnson@netsurit.com",
        office: "Cape Town",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
        jobTitle: "Senior Development Manager",
        department: "Engineering",
        role: "coach",
        dreamCategories: ["Learning", "Career", "Health", "Leadership"],
        dreamBook: [
          {
            id: 1,
            title: "Master Team Leadership",
            category: "Career",
            description: "Develop advanced leadership skills to effectively manage and inspire development teams across multiple projects.",
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
              { id: 2, text: "Build demo project with Next.js 14", completed: false, createdAt: "2024-01-15T10:00:00Z" }
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
              { id: 2, text: "Complete first 10K training run", completed: true, createdAt: "2024-01-15T10:00:00Z" }
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
            description: "Spearhead the company's digital transformation, modernizing legacy systems",
            progress: 85,
            targetDate: "2024-06-30",
            status: "In Progress"
          }
        ],
        score: 142,
        dreamsCount: 3,
        connectsCount: 8,
        lastUpdated: new Date().toISOString()
      },
      {
        id: "mike.chen@netsurit.com",
        userId: "mike.chen@netsurit.com",
        name: "Mike Chen",
        email: "mike.chen@netsurit.com",
        office: "Cape Town",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format&q=80",
        jobTitle: "Frontend Developer",
        department: "Engineering",
        role: "employee",
        coachId: "sarah.johnson@netsurit.com",
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
              { id: 2, text: "Learn TypeScript generics", completed: true, createdAt: "2024-01-15T10:00:00Z" }
            ],
            notes: [
              { id: 1, text: "React Suspense and concurrent features are fascinating!", timestamp: "2024-01-10T14:00:00Z" }
            ],
            history: [
              { id: 1, type: "progress", action: "Progress updated to 65%", timestamp: "2024-01-16T09:00:00Z", oldValue: 50, newValue: 65 }
            ]
          }
        ],
        score: 89,
        dreamsCount: 2,
        connectsCount: 4,
        lastUpdated: new Date().toISOString()
      },
      {
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
              { id: 1, text: "Complete technical architecture course", completed: true, createdAt: "2024-01-05T10:00:00Z" }
            ],
            notes: [
              { id: 1, text: "Architecture course gave me great insights into system design.", timestamp: "2024-01-12T15:00:00Z" }
            ],
            history: [
              { id: 1, type: "progress", action: "Progress updated to 55%", timestamp: "2024-01-18T09:00:00Z", oldValue: 40, newValue: 55 }
            ]
          }
        ],
        score: 98,
        dreamsCount: 2,
        connectsCount: 3,
        lastUpdated: new Date().toISOString()
      },
      {
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
              { id: 2, text: "Build 3 portfolio projects", completed: true, createdAt: "2024-01-18T10:00:00Z" }
            ],
            notes: [
              { id: 1, text: "Async/await patterns finally clicked for me!", timestamp: "2024-01-12T16:00:00Z" }
            ],
            history: [
              { id: 1, type: "progress", action: "Progress updated to 70%", timestamp: "2024-01-19T09:00:00Z", oldValue: 55, newValue: 70 }
            ]
          }
        ],
        score: 67,
        dreamsCount: 2,
        connectsCount: 2,
        lastUpdated: new Date().toISOString()
      }
    ];

    // If GET request, return setup page HTML
    if (req.method === 'GET') {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Setup Demo Users</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                .btn { background: #007bff; color: white; border: none; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 10px 0; }
                .btn:hover { background: #0056b3; }
                .success { color: green; font-weight: bold; }
                .error { color: red; font-weight: bold; }
                .user-list { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>🚀 Setup Demo Users for DreamSpace</h1>
            <p>This will create 4 demo users in your production Cosmos DB:</p>
            <div class="user-list">
                <h3>Demo Users to be Created:</h3>
                <ul>
                    <li><strong>Sarah Johnson</strong> - Senior Development Manager (Coach)</li>
                    <li><strong>Mike Chen</strong> - Frontend Developer (Team Member)</li>
                    <li><strong>Jennifer Smith</strong> - Full Stack Developer (Team Member)</li>
                    <li><strong>Alex Rodriguez</strong> - Junior Developer (Team Member)</li>
                </ul>
            </div>
            <button class="btn" onclick="setupUsers()">Create Demo Users</button>
            <div id="result"></div>
            
            <script>
                async function setupUsers() {
                    const btn = document.querySelector('.btn');
                    const result = document.getElementById('result');
                    
                    btn.disabled = true;
                    btn.textContent = 'Creating users...';
                    result.innerHTML = '';
                    
                    try {
                        const response = await fetch('/api/setupDemoUsers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            result.innerHTML = \`<div class="success">✅ \${data.message}<br>Users created: \${data.created.join(', ')}<br><br>You can now test the demo login with Sarah Johnson's account!</div>\`;
                        } else {
                            result.innerHTML = \`<div class="error">❌ Error: \${data.error}</div>\`;
                        }
                    } catch (error) {
                        result.innerHTML = \`<div class="error">❌ Network error: \${error.message}</div>\`;
                    }
                    
                    btn.disabled = false;
                    btn.textContent = 'Create Demo Users';
                }
            </script>
        </body>
        </html>
      `;
      
      context.res = {
        status: 200,
        body: html,
        headers: {
          'Content-Type': 'text/html'
        }
      };
      return;
    }

    // POST request - actually create the users
    const results = [];
    const errors = [];
    
    for (const user of demoUsers) {
      try {
        context.log(`Creating user: ${user.name} (${user.email})`);
        
        const document = {
          ...user,
          lastUpdated: new Date().toISOString()
        };

        const { resource } = await container.items.upsert(document);
        results.push(user.name);
        context.log(`✅ Successfully created user: ${user.name}`);
      } catch (error) {
        context.log.error(`❌ Failed to create user ${user.name}:`, error);
        errors.push({ user: user.name, error: error.message });
      }
    }
    
    if (errors.length === 0) {
      context.res = {
        status: 200,
        body: JSON.stringify({ 
          success: true,
          message: 'All demo users created successfully!',
          created: results
        }),
        headers
      };
    } else {
      context.res = {
        status: 207, // Multi-status
        body: JSON.stringify({ 
          success: false,
          message: 'Some users failed to create',
          created: results,
          errors: errors
        }),
        headers
      };
    }
    
  } catch (error) {
    context.log.error('Error in setupDemoUsers function:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      headers
    };
  }
};
