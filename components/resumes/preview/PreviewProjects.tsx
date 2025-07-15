import { ResumeProject } from '@/lib/resume/parser'

interface PreviewProjectsProps {
  projects?: ResumeProject[]
}

export function PreviewProjects({ projects }: PreviewProjectsProps) {
  if (!projects || projects.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">
        Projects
      </h2>
      <div className="space-y-4">
        {projects.map((project, index) => (
          <div key={index} className="border-l-2 border-purple-200 pl-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {project.name || 'Project Name'}
                </h3>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {project.url}
                  </a>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1 sm:mt-0">
                {project.startDate && (
                  <span>
                    {project.startDate}
                    {project.endDate && ` - ${project.endDate}`}
                  </span>
                )}
              </div>
            </div>
            {project.description && (
              <p className="text-gray-700 mb-2 text-sm">
                {project.description}
              </p>
            )}
            {project.details && project.details.length > 0 && (
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mb-2">
                {project.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            )}
            {project.technologies && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.technologies.map((tech, idx) => (
                  <span
                    key={idx}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}