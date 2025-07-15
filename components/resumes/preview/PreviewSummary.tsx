interface PreviewSummaryProps {
  summary?: string
}

export function PreviewSummary({ summary }: PreviewSummaryProps) {
  if (!summary) return null

  return (
    <section className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">
        Professional Summary
      </h2>
      <p className="text-gray-700 leading-relaxed">
        {summary}
      </p>
    </section>
  )
}