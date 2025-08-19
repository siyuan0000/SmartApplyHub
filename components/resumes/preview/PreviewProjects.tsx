import { ResumeProject } from '@/lib/resume/parser'

interface PreviewProjectsProps {
  projects?: ResumeProject[]
  sectionTitle?: string
}

export function PreviewProjects({ projects, sectionTitle = 'Projects' }: PreviewProjectsProps) {
  if (!projects || projects.length === 0) return null

  return (
    <section className="mb-4">
      <h2 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">
        {sectionTitle}
      </h2>
      <div className="space-y-4">
        {projects.map((project, index) => (
          <div key={index} className="border-l-2 border-purple-200 pl-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {project.name || 'Project Name'}
                </h3>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    {project.url}
                  </a>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1 sm:mt-0">
                {project.startDate && (
                  <span>
                    {project.startDate}
                    {project.endDate && ` - ${project.endDate}`}
                  </span>
                )}
              </div>
            </div>
            {project.description && (
              <p className="text-gray-700 mb-1 text-xs">
                {project.description}
              </p>
            )}
            {project.details && project.details.length > 0 && (
              <ul className="list-disc list-inside text-gray-700 text-xs space-y-0.5 mb-1">
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
                    className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs"
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