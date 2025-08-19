interface PreviewSummaryProps {
  summary?: string
  sectionTitle?: string
}

export function PreviewSummary({ summary, sectionTitle = 'Professional Summary' }: PreviewSummaryProps) {
  if (!summary) return null

  return (
    <section className="mb-4">
      <h2 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">
        {sectionTitle}
      </h2>
      <p className="text-gray-700 leading-relaxed text-sm">
        {summary}
      </p>
    </section>
  )
}