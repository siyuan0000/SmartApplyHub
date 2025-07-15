interface PreviewSkillsProps {
  skills: string[]
}

export function PreviewSkills({ skills }: PreviewSkillsProps) {
  if (!skills || skills.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">
        Skills
      </h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  )
}