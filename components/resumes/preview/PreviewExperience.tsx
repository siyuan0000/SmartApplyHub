import { ResumeExperience } from '@/lib/resume/parser'

interface PreviewExperienceProps {
  experience: ResumeExperience[]
}

export function PreviewExperience({ experience }: PreviewExperienceProps) {
  if (!experience || experience.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">
        Work Experience
      </h2>
      <div className="space-y-4">
        {experience.map((exp, index) => (
          <div key={index} className="border-l-2 border-blue-200 pl-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {exp.title || 'Job Title'}
                </h3>
                <p className="text-gray-700 font-medium">
                  {exp.company || 'Company Name'}
                </p>
              </div>
              <div className="text-sm text-gray-600 mt-1 sm:mt-0">
                {exp.startDate && (
                  <span>
                    {exp.startDate}
                    {exp.endDate && ` - ${exp.endDate}`}
                    {exp.current && ' - Present'}
                  </span>
                )}
              </div>
            </div>
            {exp.description && (
              <p className="text-gray-700 mb-2 text-sm">
                {exp.description}
              </p>
            )}
            {exp.achievements && exp.achievements.length > 0 && (
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                {exp.achievements.map((achievement, idx) => (
                  <li key={idx}>{achievement}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}