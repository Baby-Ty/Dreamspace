// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.
import { Layers, Target, BarChart3 } from 'lucide-react';
import SectionCard from './SectionCard';
import StatusPill from './StatusPill';

export function BusinessOutcomesSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="business-outcomes"
      icon={Target}
      title="Business Outcomes & Metrics"
      description="What success looks like and how we’re tracking."
    >
      <div className="grid gap-4 md:grid-cols-2" data-testid="build-overview-outcomes" role="list">
        {data.objectives.map((objective) => (
          <article
            key={objective.title}
            role="listitem"
            className="bg-white border border-professional-gray-200 rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-professional-gray-900">
                {objective.title}
              </h3>
              <StatusPill status={objective.status} />
            </div>
            <p className="text-sm text-professional-gray-600 mt-2">
              KPI: {objective.metric}
            </p>
            <p className="text-sm text-professional-gray-500 mt-3">
              Mitigation: {objective.mitigation}
            </p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

export function ScopeRoadmapSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="scope-roadmap"
      icon={Layers}
      title="V1 Scope & Delivery Roadmap"
      description="What ships in v1 and the road we’re taking to get there."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div data-testid="build-overview-scope-highlights">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            V1 Highlights
          </h3>
          <ul className="space-y-3" role="list">
            {data.v1Highlights.map((item) => (
              <li
                key={item}
                role="listitem"
                className="flex items-start gap-3 bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm"
              >
                <BarChart3 className="w-5 h-5 text-netsurit-red mt-0.5" aria-hidden="true" />
                <p className="text-sm text-professional-gray-700">{item}</p>
              </li>
            ))}
          </ul>
        </div>
        <div data-testid="build-overview-roadmap" className="space-y-4" role="list">
          {data.milestoneRoadmap.map((milestone) => (
            <div
              key={milestone.phase}
              role="listitem"
              className="bg-professional-gray-50 border border-professional-gray-200 rounded-xl p-4"
            >
              <p className="text-xs uppercase tracking-wide text-professional-gray-500">
                {milestone.window}
              </p>
              <h3 className="text-sm font-semibold text-professional-gray-900 mt-1">
                {milestone.phase}
              </h3>
              <p className="text-sm text-professional-gray-600 mt-2">{milestone.focus}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}


