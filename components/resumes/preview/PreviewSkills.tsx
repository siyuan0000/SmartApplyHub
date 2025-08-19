interface PreviewSkillsProps {
  skills: string[]
  sectionTitle?: string
}

export function PreviewSkills({ skills, sectionTitle = 'Skills' }: PreviewSkillsProps) {
  if (!skills || skills.length === 0) return null

  return (
    <section className="mb-4">
      <h2 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">
        {sectionTitle}
      </h2>
      <div className="flex flex-wrap gap-1">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium"
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  )
}