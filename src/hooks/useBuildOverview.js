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
        releaseTrain: 'Q1 2026 launch path',
        snapshotDate: 'November 9, 2025',
        sponsors: [
          { role: 'Executive Sponsor', name: 'Lindy Jacobs' },
          { role: 'Product Owner', name: 'Thabo Nkosi' },
          { role: 'Technology Sponsor', name: 'Alicia Chen' }
        ],
        valueHeadline: 'One home for dreams, coaching, and progress updates your execs can skim over coffee.',
        callsToAction: [
          { label: 'Grab the Project Brief', href: '/docs/build-overview-brief.pdf' },
          { label: 'Watch the 7‑min Tour', href: 'https://contoso.wistia.com/medias/dreamspace-walkthrough' }
        ]
      },
      stakeholderSnapshot: {
        cadence: [
          { label: 'Steering Committee', frequency: 'Every second Monday, 30 minutes' },
          { label: 'Product Demos', frequency: 'Thursdays 14:00 SAST, show-and-tell style' },
          { label: 'Retro & Planning', frequency: 'Alternating Fridays, 45 minutes' }
        ],
        roles: [
          { title: 'Executive Sponsor', owner: 'Lindy Jacobs', availability: 'Tuesdays 10:00-12:00' },
          { title: 'Product Owner', owner: 'Thabo Nkosi', availability: 'Daily stand-up 09:15' },
          { title: 'Tech Lead', owner: 'Alicia Chen', availability: 'Mon-Thu 13:00-16:00' }
        ]
      },
      businessOutcomes: {
        objectives: [
          {
            title: 'Increase Coaching Engagement',
            metric: '8 in 10 users paired with a coach',
            status: 'on-track',
            mitigation: 'Weekly adoption pulse shared with managers'
          },
          {
            title: 'Improve Goal Completion',
            metric: '+25% weekly goal completion lift',
            status: 'at-risk',
            mitigation: 'Add Teams nudges + subtle in-app reminders'
          },
          {
            title: 'Executive Visibility',
            metric: 'All regional VPs using the leadership dashboard',
            status: 'on-track',
            mitigation: 'Pilot insights in January leadership forum'
          }
        ]
      },
      scope: {
        v1Highlights: [
          'Dream Book refresh with timeline and context in one place',
          'Coach workspace showing sentiment, actions, and quick wins',
          'People dashboard for HR with export-ready snapshots',
          'Automated scoring engine wired into Application Insights'
        ],
        milestoneRoadmap: [
          { phase: 'Discovery & UX Validation', window: 'Sep–Oct 2025', focus: 'Journey maps, persona alignment, prototype walkthroughs' },
          { phase: 'Build & Hardening', window: 'Nov–Dec 2025', focus: 'Feature wrap-up, performance polish, accessibility pass' },
          { phase: 'Pilot Launch', window: 'Jan 2026', focus: 'Invite-only cohort with concierge onboarding' },
          { phase: 'General Availability', window: 'Mar 2026', focus: 'Tenant-wide rollout with training kits and support scripts' }
        ]
      },
      experienceGallery: {
        screenshots: [
          { title: 'Dream Dashboard', caption: 'Quick pulse of adoption, alerts, and momentum by region', asset: '/assets/dream-dashboard.png' },
          { title: 'Coach Workspace', caption: 'Alerts, sentiment, and one-click actions for every team', asset: '/assets/coach-workspace.png' },
          { title: 'Dream Book', caption: 'Story view with timeline, milestones, and score impact in context', asset: '/assets/dream-book.png' }
        ],
        recording: {
          title: 'End-to-end tour (narrated)',
          duration: '07:32 min',
          href: 'https://contoso.wistia.com/medias/dreamspace-e2e'
        }
      },
      architecture: {
        overview: [
          {
            title: 'Clients',
            details: ['React 18 SPA', 'Routes guarded by MSAL', 'Tailwind-first responsive layout']
          },
          {
            title: 'Services',
            details: ['Azure Functions on Node 20', 'Microsoft Graph tap-in for people data', 'Application Insights for logs and traces']
          },
          {
            title: 'Data',
            details: ['Cosmos DB six-container layout', 'Blob storage for dream and profile images', 'Azure Queue for async clean-up jobs']
          }
        ],
        stack: [
          { label: 'Frontend', value: 'React 18 + Vite + Tailwind' },
          { label: 'Backend', value: 'Azure Functions + lightweight Express middleware' },
          { label: 'Auth', value: 'Microsoft Entra ID via MSAL' },
          { label: 'Observability', value: 'Application Insights + Azure Monitor' }
        ]
      },
      dataStrategy: {
        models: [
          { title: 'Users', description: 'Profile basics only, single document per userId (no bulky arrays)' },
          { title: 'Dreams', description: 'Dream Book + weekly goal templates bundled per user document' },
          { title: 'Weeks', description: 'Year-specific docs storing ISO week history and completions' }
        ],
        caching: [
          'Static assets fronted by Azure Front Door edge cache',
          'Hook-level memoization today, React Query ready for future drop-in',
          'Azure Functions responses cached for the chatty read endpoints'
        ]
      },
      codebase: {
        structure: [
          {
            title: 'Frontend Layers',
            points: [
              'Pages are tiny wrappers that just hand off to feature layouts',
              'Layouts juggle UI pieces and lean on hooks for brains',
              'Hooks own data fetching, memoization, and any crunching'
            ]
          },
          {
            title: 'Service Contracts',
            points: [
              'Services wrap Azure Functions and always return ok()/fail() payloads',
              'Hooks validate responses with Zod before the UI ever sees them',
              'Logger helper keeps telemetry clean for Application Insights'
            ]
          }
        ],
        sharedSystems: [
          { label: 'State', detail: 'React Context + useReducer, dev mode still falls back to localStorage' },
          { label: 'Styling', detail: 'Tailwind with Netsurit palette tokens and sensible defaults' },
          { label: 'Auth', detail: 'MSAL wiring feeds the AuthContext and role helpers' }
        ],
        tooling: [
          'Vite for dev/build (port 5173) and lightning HMR',
          'Vitest + React Testing Library for fast feedback loops',
          'ESLint + Prettier tuned to the DreamSpace rule set'
        ]
      },
      codingStandards: {
        dod: [
          'Every file starts with the DoD banner and stays under 400 lines',
          'UI never calls fetch directly—hooks and services do the heavy lifting',
          'Loading and error states short-circuit early with friendly copy'
        ],
        accessibility: [
          'ARIA roles/labels on anything clickable plus proper semantic wrappers',
          'Key elements carry data-testid so tests stay stable',
          'Modals trap focus, keyboard paths are checked before sign-off'
        ],
        cursorRules: [
          'Keep changes tight and incremental—full rewrites need a nod',
          'Don’t add new files or reshuffle folders without sign-off',
          'Azure + Cosmos DB facts must be spot-on, partition keys included every time'
        ]
      },
      security: {
        highlights: [
          'Role-based access enforced at API layer (user, coach, admin)',
          'Secret rotation managed via Azure Key Vault with quarterly review',
          'Threat modeling completed with latest SDL checklist'
        ],
        compliance: [
          { label: 'SOC 2 Type II', status: 'In progress – evidence collection' },
          { label: 'GDPR', status: 'Compliant – DPA signed' },
          { label: 'POPIA', status: 'Compliant – data residency assured' }
        ]
      },
      operations: {
        releasePipeline: [
          'Dev → QA → Pre-prod → Production with automated smoke tests',
          'Feature flags for progressive exposure via Azure App Configuration',
          'Rollback via deployment slots with 10-minute cutover plan'
        ],
        monitoring: [
          'Application Insights dashboards with SLO tracking',
          'PagerDuty integration for P1/P2 alerts',
          'Weekly ops review with Tech Lead and SRE partner'
        ]
      },
      futureRoadmap: {
        priorities: [
          { item: 'Personalized Nudges', target: 'Q2 2026', notes: 'Teams and email digests powered by scoring trends' },
          { item: 'AI Story Insights', target: 'Q3 2026', notes: 'Narrative summaries of Dream Book progress' },
          { item: 'Coach Marketplace', target: 'Q4 2026', notes: 'Match employees to certified coaches across regions' }
        ],
        experiments: [
          'In-app pulse surveys with adaptive question bank',
          'OKR alignment module for leadership initiatives',
          'Auto-transcription of coaching sessions (opt-in)'
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


