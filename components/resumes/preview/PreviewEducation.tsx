import { ResumeEducation } from '@/lib/resume/parser'

interface PreviewEducationProps {
  education: ResumeEducation[]
}

export function PreviewEducation({ education }: PreviewEducationProps) {
  if (!education || education.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">
        Education
      </h2>
      <div className="space-y-3">
        {education.map((edu, index) => (
          <div key={index} className="border-l-2 border-green-200 pl-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {edu.degree || 'Degree'}
                </h3>
                <p className="text-gray-700 font-medium">
                  {edu.school || 'School Name'}
                </p>
                {edu.gpa && (
                  <p className="text-sm text-gray-600">
                    GPA: {edu.gpa}
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1 sm:mt-0">
                {edu.graduationDate && <span>{edu.graduationDate}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}