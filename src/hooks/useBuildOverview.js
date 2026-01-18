import { useMemo } from 'react';

/**
 * Provides structured content for the Build Overview stakeholder page.
 * Currently returns curated static data but can be swapped for service-driven content later.
 */
export function useBuildOverview() {
  const overview = useMemo(
    () => ({
      hero: {
        projectName: 'DreamsApp',
        releaseTrain: 'Netsurit Dreams Program',
        snapshotDate: 'January 2026',
        sponsors: [
          { role: 'Owner', name: 'Netsurit' },
          { role: 'Built For', name: 'All Netsurit Team Members' }
        ],
        valueHeadline: 'A place for everyone at Netsurit to document personal dreams, set weekly goals, connect with colleagues, and get coaching support. Because work is better when you\'re chasing dreams.',
        callsToAction: [
          { label: 'Go to Dashboard', href: '/' },
          { label: 'View Health Status', href: '/health' }
        ]
      },
      stakeholderSnapshot: {
        cadence: [
          { label: 'Dream Connects', frequency: 'Team members meet to discuss shared dreams' },
          { label: 'Coaching Sessions', frequency: 'Coaches check in with their team regularly' },
          { label: 'Weekly Goals', frequency: 'Everyone sets and tracks goals each week' }
        ],
        roles: [
          { title: 'Regular Users', owner: 'All team members', availability: 'Create dreams, set goals, connect' },
          { title: 'Coaches', owner: 'Team leads & managers', availability: 'Track team progress, provide support' },
          { title: 'Admins', owner: 'HR & IT', availability: 'User management, system config' }
        ]
      },
      businessOutcomes: {
        objectives: [
          {
            title: 'Dream Engagement',
            metric: 'Team members actively creating and tracking dreams',
            status: 'on-track'
          },
          {
            title: 'Weekly Goals',
            metric: 'Consistent goal-setting and completion across teams',
            status: 'on-track'
          },
          {
            title: 'Team Connections',
            metric: 'Colleagues connecting over shared interests',
            status: 'on-track'
          },
          {
            title: 'Coaching Adoption',
            metric: 'Managers using coaching tools to support teams',
            status: 'on-track'
          }
        ]
      },
      scope: {
        v1Highlights: [
          'Dream Book – up to 10 personal dreams with images, progress, and milestones',
          'Weekly Goals – set, track, and complete goals linked to your dreams',
          'Dream Connect – find colleagues with similar dreams and schedule meetups',
          'Scorecard – earn points for dreams, goals, and connections',
          'Dream Team – coaches see team progress and provide support',
          'People Dashboard – browse all team members and their dreams',
          'Admin Tools – user management and system oversight'
        ],
        milestoneRoadmap: [
          { phase: 'Core Features', window: 'Live', focus: 'Dream Book, Weekly Goals, Scorecard' },
          { phase: 'Connections', window: 'Live', focus: 'Dream Connect, Team Browsing' },
          { phase: 'Coaching', window: 'Live', focus: 'Dream Team, Coach Dashboard' },
          { phase: 'Admin', window: 'Live', focus: 'User Management, Health Monitoring' }
        ]
      },
      experienceGallery: {
        screenshots: [
          { title: 'Dashboard', caption: 'Your home base – dreams, goals, and quick stats', asset: '/assets/dashboard.png' },
          { title: 'Dream Book', caption: 'Create and manage up to 10 personal dreams', asset: '/assets/dream-book.png' },
          { title: 'Dream Connect', caption: 'Find and connect with like-minded colleagues', asset: '/assets/dream-connect.png' }
        ],
        recording: {
          title: 'Quick tour of the app',
          duration: '5 min',
          href: '#'
        }
      },
      architecture: {
        overview: [
          {
            title: 'What You See (Frontend)',
            details: [
              'React 18 app – fast, modern, works on any device',
              'Tailwind CSS – clean Netsurit-branded look',
              'Azure Static Web Apps – globally distributed for speed'
            ]
          },
          {
            title: 'Behind the Scenes (Backend)',
            details: [
              '30+ Azure Functions handling all the logic',
              'Node.js 20 – reliable and well-supported',
              'Microsoft Graph for profile photos and org data'
            ]
          },
          {
            title: 'Where Data Lives (Database)',
            details: [
              'Azure Cosmos DB – fast NoSQL database',
              'Azure Blob Storage – for profile and dream images',
              'Smart partitioning so your data loads quickly'
            ]
          }
        ],
        stack: [
          { label: 'Frontend', value: 'React 18, Vite, Tailwind CSS' },
          { label: 'Backend', value: 'Azure Functions (Node.js 20)' },
          { label: 'Database', value: 'Azure Cosmos DB (NoSQL)' },
          { label: 'Auth', value: 'Azure AD / Microsoft 365 SSO' },
          { label: 'Hosting', value: 'Azure Static Web Apps' },
          { label: 'Monitoring', value: 'Azure Application Insights' }
        ]
      },
      dataStrategy: {
        models: [
          { title: 'Users', description: 'Profile info – name, email, office, role' },
          { title: 'Dreams', description: 'Your dream book and weekly goal templates' },
          { title: 'Connects', description: 'Records of colleague connections and meetups' },
          { title: 'Scoring', description: 'Points earned for activity, by year' },
          { title: 'Teams', description: 'Coaching relationships and team assignments' },
          { title: 'Weeks', description: 'Weekly goals organized by year' }
        ],
        caching: [
          'Azure CDN for static assets worldwide',
          'Smart client-side caching to reduce API calls',
          'Background data refresh keeps things snappy'
        ]
      },
      codebase: {
        structure: [
          {
            title: '3-Layer Pattern',
            points: [
              'Pages are thin wrappers (just a few lines)',
              'Layouts handle the UI and compose components',
              'Hooks manage data fetching and state',
              'Services handle API calls'
            ]
          },
          {
            title: 'Quality Standards',
            points: [
              'No API calls in UI components – data comes from hooks',
              'Files stay under 400 lines – easy to read',
              'Zod schemas validate all data',
              'Error handling built into every service'
            ]
          }
        ],
        sharedSystems: [
          { label: 'State Management', detail: 'React Context + useReducer pattern' },
          { label: 'Styling', detail: 'Tailwind CSS with Netsurit brand colors' },
          { label: 'Validation', detail: 'Zod schemas for type-safe data' },
          { label: 'Error Handling', detail: 'Centralized ok/fail pattern in services' }
        ],
        tooling: [
          'Vite – super fast dev server with hot reload',
          'Vitest – testing framework with React Testing Library',
          'ESLint – keeps code consistent',
          'GitHub Actions – automated builds and deploys'
        ]
      },
      codingStandards: {
        dod: [
          'No fetch calls in UI – hooks handle data',
          'Files under 400 lines',
          'Early return for loading and error states',
          'Accessibility labels on interactive elements',
          'data-testid attributes for testing'
        ],
        accessibility: [
          'Screen reader friendly with ARIA labels',
          'Keyboard navigation throughout',
          'Color contrast meets WCAG standards',
          'Focus indicators on all interactive elements'
        ],
        cursorRules: [
          'Incremental changes preferred – no big rewrites',
          'New files or restructuring needs sign-off',
          'Azure and Cosmos patterns must be followed exactly',
          'All API calls include partition keys'
        ]
      },
      security: {
        highlights: [
          'Microsoft 365 SSO – no separate passwords',
          'Role-based access – user, coach, and admin levels',
          'HTTPS everywhere – all data encrypted in transit',
          'Data partitioned by user – you only see your stuff',
          'Azure AD groups control admin and coach access'
        ],
        compliance: [
          { label: 'Authentication', status: 'Azure AD / MSAL' },
          { label: 'Data Encryption', status: 'At rest and in transit' },
          { label: 'POPIA', status: 'Compliant' },
          { label: 'GDPR', status: 'Compliant' },
          { label: 'Audit Logging', status: 'Application Insights' }
        ]
      },
      operations: {
        releasePipeline: [
          'Push to main → automatic build and deploy',
          'Azure Static Web Apps handles hosting',
          'Azure Functions deploy from same repo',
          'Rollback by reverting the commit'
        ],
        monitoring: [
          'Application Insights tracks errors and performance',
          'Health check page shows all API endpoints status',
          'Alerts for failed requests or slow responses',
          'Real-time usage metrics available'
        ]
      },
      futureRoadmap: {
        priorities: [
          { item: 'Teams Notifications', target: 'Future', notes: 'Reminders and updates in Microsoft Teams' },
          { item: 'AI Summaries', target: 'Future', notes: 'Smart progress insights and suggestions' },
          { item: 'Mobile App', target: 'Future', notes: 'React Native version for phones' },
          { item: 'Group Challenges', target: 'Future', notes: 'Team-based dream competitions' }
        ],
        experiments: [
          'Offline mode for when you\'re disconnected',
          'Video call integration for virtual connects',
          'Advanced analytics and reporting'
        ]
      },
      resources: [
        { label: 'Dashboard', href: '/' },
        { label: 'Dream Book', href: '/dream-book' },
        { label: 'Scorecard', href: '/scorecard' },
        { label: 'Health Check', href: '/health' },
        { label: 'Admin Dashboard', href: '/admin' }
      ]
    }),
    []
  );

  return {
    overview,
    loading: false,
    error: null
  };
}