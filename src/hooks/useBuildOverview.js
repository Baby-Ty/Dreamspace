// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { useMemo } from 'react';

/**
 * Provides structured content for the Build Overview stakeholder page.
 * Currently returns curated static data but can be swapped for service-driven content later.
 */
export function useBuildOverview() {
  const overview = useMemo(
    () => ({
      hero: {
        projectName: 'DreamSpace Platform',
        releaseTrain: 'Q1 2026 launch',
        snapshotDate: 'November 9, 2025',
        sponsors: [
          { role: 'Executive Sponsor', name: 'Lindy Jacobs' },
          { role: 'Product Owner', name: 'Thabo Nkosi' },
          { role: 'Tech Lead', name: 'Alicia Chen' }
        ],
        valueHeadline: 'Dream tracking, coaching, and progress updates in one spot. Perfect for exec coffee reviews.',
        callsToAction: [
          { label: 'Quick Project Brief', href: '/docs/build-overview-brief.pdf' },
          { label: '7-min Video Tour', href: 'https://contoso.wistia.com/medias/dreamspace-walkthrough' }
        ]
      },
      stakeholderSnapshot: {
        cadence: [
          { label: 'Steering Committee', frequency: '2nd Monday each month, 30 min' },
          { label: 'Product Demos', frequency: 'Thursdays 2 PM SAST' },
          { label: 'Retro & Planning', frequency: 'Alt Fridays, 45 min' }
        ],
        roles: [
          { title: 'Executive Sponsor', owner: 'Lindy Jacobs', availability: 'Tuesdays 10-12' },
          { title: 'Product Owner', owner: 'Thabo Nkosi', availability: 'Daily at 9:15 AM' },
          { title: 'Tech Lead', owner: 'Alicia Chen', availability: 'Mon-Thu 1-4 PM' }
        ]
      },
      businessOutcomes: {
        objectives: [
          {
            title: 'Coaching Engagement',
            metric: '8/10 users with coaches',
            status: 'on-track'
          },
          {
            title: 'Goal Completion',
            metric: '+25% weekly goals done',
            status: 'at-risk'
          },
          {
            title: 'Executive Visibility',
            metric: 'All VPs using dashboard',
            status: 'on-track'
          }
        ]
      },
      scope: {
        v1Highlights: [
          'Dream Book with timelines and context',
          'Coach dashboard with insights and quick actions',
          'People dashboard for HR exports',
          'Automated scoring with analytics'
        ],
        milestoneRoadmap: [
          { phase: 'Discovery & UX', window: 'Sep–Oct 2025', focus: 'User research and prototypes' },
          { phase: 'Build & Polish', window: 'Nov–Dec 2025', focus: 'Core features and performance' },
          { phase: 'Pilot Launch', window: 'Jan 2026', focus: 'Limited release with support' },
          { phase: 'Full Launch', window: 'Mar 2026', focus: 'Company-wide rollout' }
        ]
      },
      experienceGallery: {
        screenshots: [
          { title: 'Dashboard', caption: 'Quick view of usage, alerts, and progress', asset: '/assets/dream-dashboard.png' },
          { title: 'Coach Tools', caption: 'Team alerts and easy actions', asset: '/assets/coach-workspace.png' },
          { title: 'Dream Book', caption: 'Personal story with timeline and milestones', asset: '/assets/dream-book.png' }
        ],
        recording: {
          title: 'Full walkthrough',
          duration: '7 min',
          href: 'https://contoso.wistia.com/medias/dreamspace-e2e'
        }
      },
      architecture: {
        overview: [
          {
            title: 'Frontend',
            details: ['React app with responsive design', 'Microsoft login integration', 'Clean, accessible UI']
          },
          {
            title: 'Backend',
            details: ['Azure cloud functions', 'Office 365 data integration', 'Built-in monitoring and logs']
          },
          {
            title: 'Database',
            details: ['Cosmos DB for fast queries', 'File storage for images', 'Background job processing']
          }
        ],
        stack: [
          { label: 'Frontend', value: 'React + Tailwind CSS' },
          { label: 'Backend', value: 'Azure Functions' },
          { label: 'Auth', value: 'Microsoft 365 login' },
          { label: 'Monitoring', value: 'Azure insights' }
        ]
      },
      dataStrategy: {
        models: [
          { title: 'Users', description: 'Basic profiles, one doc per person' },
          { title: 'Dreams', description: 'Dream Book + goals bundled together' },
          { title: 'Weeks', description: 'Yearly docs tracking progress' }
        ],
        caching: [
          'Fast global content delivery',
          'Smart data reuse in the app',
          'API responses cached for speed'
        ]
      },
      codebase: {
        structure: [
          {
            title: 'Clean Architecture',
            points: [
              'Simple page wrappers that delegate to layouts',
              'Layouts handle UI, hooks handle data',
              'Everything separated by responsibility'
            ]
          },
          {
            title: 'Reliable APIs',
            points: [
              'Services handle all external calls',
              'Data validation before UI updates',
              'Clean logging and error handling'
            ]
          }
        ],
        sharedSystems: [
          { label: 'State', detail: 'React Context with localStorage backup' },
          { label: 'Styling', detail: 'Tailwind with company colors' },
          { label: 'Auth', detail: 'Microsoft 365 integration' }
        ],
        tooling: [
          'Fast dev server with hot reload',
          'Automated testing setup',
          'Code quality tools and formatting'
        ]
      },
      codingStandards: {
        dod: [
          'Files stay small (<400 lines) and follow patterns',
          'No direct API calls in UI components',
          'Early handling of loading and errors'
        ],
        accessibility: [
          'Screen reader friendly with proper labels',
          'Testable components with data attributes',
          'Keyboard navigation works everywhere'
        ],
        cursorRules: [
          'Keep changes tight and incremental—full rewrites need a nod',
          'Don’t add new files or reshuffle folders without sign-off',
          'Azure + Cosmos DB facts must be spot-on, partition keys included every time'
        ]
      },
      security: {
        highlights: [
          'Role-based access (user, coach, admin)',
          'Regular security reviews and updates',
          'Security planning completed'
        ],
        compliance: [
          { label: 'SOC 2', status: 'In progress' },
          { label: 'GDPR', status: 'Compliant' },
          { label: 'POPIA', status: 'Compliant' }
        ]
      },
      operations: {
        releasePipeline: [
          'Automated testing through dev/staging/prod',
          'Feature flags for safe rollouts',
          'Quick rollback capability'
        ],
        monitoring: [
          'Performance dashboards and alerts',
          'Incident response integration',
          'Weekly operations reviews'
        ]
      },
      futureRoadmap: {
        priorities: [
          { item: 'Smart Notifications', target: 'Q2 2026', notes: 'Teams alerts based on progress' },
          { item: 'AI Progress Summaries', target: 'Q3 2026', notes: 'Automated dream insights' }
        ],
        experiments: [
          'Quick feedback surveys',
          'Goal alignment features'
        ]
      },
      resources: [
        { label: 'Product Brief', href: '/docs/product-brief.pdf' },
        { label: 'Architecture Deck', href: '/docs/architecture-overview.pdf' },
        { label: 'Analytics Dashboard', href: 'https://app.powerbi.com/groups/dreamspace-analytics' },
        { label: 'Support Playbook', href: '/docs/support-playbook.pdf' },
        { label: 'Teams Channel', href: 'https://teams.microsoft.com/l/channel/dreamspace-build' }
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


