import { Layers3, GitBranch } from 'lucide-react';
import SectionCard from './SectionCard';

export function CodebaseOverviewSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="codebase-overview"
      icon={Layers3}
      title="Codebase Overview"
      description="How the app stays tidy, testable, and ready for Azure chores."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div data-testid="build-overview-structure">
          <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
            Architectural Layers
          </h3>
          <ul className="space-y-3" role="list">
            {data.structure.map((section) => (
              <li
                key={section.title}
                role="listitem"
                className="bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-professional-gray-900">{section.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-professional-gray-600 list-disc list-inside">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <div data-testid="build-overview-shared-systems" className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
              Shared Systems
            </h3>
            <ul className="space-y-2" role="list">
              {data.sharedSystems.map((item) => (
                <li
                  key={item.label}
                  role="listitem"
                  className="flex items-start gap-3 bg-professional-gray-50 border border-professional-gray-200 rounded-xl p-4 text-sm text-professional-gray-700"
                >
                  <span className="font-semibold text-professional-gray-900">{item.label}</span>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
          <div data-testid="build-overview-tooling">
            <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
              Tooling Backbone
            </h3>
            <ul className="space-y-2" role="list">
              {data.tooling.map((tool) => (
                <li
                  key={tool}
                  role="listitem"
                  className="bg-white border border-professional-gray-200 rounded-xl px-4 py-2 shadow-sm text-sm text-professional-gray-700"
                >
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function CodingStandardsSection({ data }) {
  if (!data) {
    return null;
  }

  return (
    <SectionCard
      sectionId="coding-standards"
      icon={GitBranch}
      title="Coding Standards Alignment"
      description="Everyday guardrails that keep shipping calm and consistent."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StandardsColumn
          title="Definition of Done"
          items={data.dod}
          testId="build-overview-dod"
        />
        <StandardsColumn
          title="Accessibility & Testing"
          items={data.accessibility}
          testId="build-overview-accessibility"
        />
        <StandardsColumn
          title="Cursor Rules"
          items={data.cursorRules}
          testId="build-overview-cursor-rules"
        />
      </div>
    </SectionCard>
  );
}

function StandardsColumn({ title, items, testId }) {
  return (
    <div data-testid={testId}>
      <h3 className="text-sm font-semibold text-professional-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <ul className="space-y-3" role="list">
        {items.map((item) => (
          <li
            key={item}
            role="listitem"
            className="bg-white border border-professional-gray-200 rounded-xl p-4 shadow-sm text-sm text-professional-gray-700"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

