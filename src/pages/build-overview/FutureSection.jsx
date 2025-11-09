// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Sparkles, FileText, ArrowUpRight } from 'lucide-react';
import SectionCard from './SectionCard';

export function FutureRoadmapSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="future-roadmap"
      icon={Sparkles}
      title="Future Roadmap & Innovation"
      description="What’s next on the roadmap and ideas we’re nurturing."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div data-testid="build-overview-future-priorities">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Prioritized Backlog
          </h3>
          <ul className="space-y-3" role="list">
            {data.priorities.map((priority) => (
              <li
                key={priority.item}
                role="listitem"
                className="bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm text-sm text-professional-gray-700"
              >
                <p className="font-semibold text-professional-gray-900">{priority.item}</p>
                <p className="text-professional-gray-600">Target: {priority.target}</p>
                <p className="text-professional-gray-500 mt-1">{priority.notes}</p>
              </li>
            ))}
          </ul>
        </div>
        <div data-testid="build-overview-experiments">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Experiment Pipeline
          </h3>
          <ul className="space-y-3" role="list">
            {data.experiments.map((experiment) => (
              <li
                key={experiment}
                role="listitem"
                className="flex items-start gap-3 bg-professional-gray-50 border border-professional-gray-200 rounded-xl p-4"
              >
                <Sparkles className="w-5 h-5 text-netsurit-coral mt-0.5" aria-hidden="true" />
                <p className="text-sm text-professional-gray-700">{experiment}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

export function ResourcesSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="resources"
      icon={FileText}
      title="Stakeholder Resources"
      description="Shortcut links when you need more detail fast."
    >
      <ul
        className="grid gap-3 sm:grid-cols-2"
        role="list"
        data-testid="build-overview-resources"
      >
        {data.map((resource) => (
          <li
            key={resource.label}
            role="listitem"
            className="bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between text-sm text-professional-gray-700"
          >
            <span className="font-medium">{resource.label}</span>
            <a
              href={resource.href}
              className="inline-flex items-center gap-2 text-netsurit-red hover:text-netsurit-orange transition-colors duration-200"
            >
              Open
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}


