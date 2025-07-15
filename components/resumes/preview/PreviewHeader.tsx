import { ResumeContact } from '@/lib/resume/parser'

interface PreviewHeaderProps {
  contact: ResumeContact
}

export function PreviewHeader({ contact }: PreviewHeaderProps) {
  return (
    <header className="text-center border-b border-gray-200 pb-6 mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {contact.name || 'Your Name'}
      </h1>
      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
        {contact.email && (
          <div className="flex items-center gap-1">
            <span>📧</span>
            <span>{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-1">
            <span>📞</span>
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.location && (
          <div className="flex items-center gap-1">
            <span>📍</span>
            <span>{contact.location}</span>
          </div>
        )}
        {contact.linkedin && (
          <div className="flex items-center gap-1">
            <span>🔗</span>
            <span className="text-blue-600 hover:underline">
              {contact.linkedin}
            </span>
          </div>
        )}
        {contact.github && (
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span className="text-blue-600 hover:underline">
              {contact.github}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}