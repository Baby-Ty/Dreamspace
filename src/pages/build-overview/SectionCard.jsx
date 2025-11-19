// DoD: no fetch in UI; <400 lines; early return for loading/error; a11y roles/labels; minimal props; data-testid for key nodes.

export default function SectionCard({ sectionId, icon: Icon, title, description, children }) {
  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-title`}
      className="bg-white border border-professional-gray-200 rounded-2xl p-8 shadow-sm"
      data-testid={`build-overview-${sectionId}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-start gap-3">
          {Icon ? <Icon className="w-6 h-6 text-netsurit-red mt-0.5" aria-hidden="true" /> : null}
          <div>
            <h2 id={`${sectionId}-title`} className="text-xl font-semibold text-professional-gray-900">
              {title}
            </h2>
            <p className="text-sm text-professional-gray-600">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}



