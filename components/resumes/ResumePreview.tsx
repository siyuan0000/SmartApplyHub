'use client'

import { useEffect, useMemo } from 'react'
import { useResumeEditor } from '@/hooks/useResumeEditor'
import { Skeleton } from '@/components/ui/skeleton'
import { PreviewHeader } from './preview/PreviewHeader'
import { PreviewSummary } from './preview/PreviewSummary'
import { PreviewExperience } from './preview/PreviewExperience'
import { PreviewEducation } from './preview/PreviewEducation'
import { PreviewSkills } from './preview/PreviewSkills'
import { PreviewProjects } from './preview/PreviewProjects'
import { TemplateService, TemplateContext, ResumeLanguage } from '@/lib/templates'

interface ResumePreviewProps {
  resumeId: string
  templateId?: string
  detectedLanguage?: 'en' | 'zh'
  originalHeaders?: Record<string, string>
}

export function ResumePreview({ resumeId, templateId, detectedLanguage, originalHeaders }: ResumePreviewProps) {
  const { content, loading, loadResume } = useResumeEditor()

  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId)
    }
  }, [resumeId, loadResume])

  // Get template context based on resume language and original headers
  const templateContext = useMemo((): TemplateContext | null => {
    if (!content) return null

    const resolvedLanguage = (detectedLanguage || content.detected_language || 'en') as ResumeLanguage
    const resolvedHeaders = originalHeaders || content.original_headers || {}
    
    // Use provided template ID or get recommended template based on language
    const selectedTemplateId = templateId || TemplateService.getRecommendedTemplate(resolvedLanguage).id
    
    return TemplateService.getTemplateContext(selectedTemplateId, resolvedLanguage, resolvedHeaders)
  }, [content, templateId, detectedLanguage, originalHeaders])

  // Generate template CSS
  const templateCSS = useMemo(() => {
    if (!templateContext) return ''
    return TemplateService.generateTemplateCSS(templateContext.template)
  }, [templateContext])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!content || !templateContext) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Resume not found</p>
      </div>
    )
  }

  // Get dynamic section order based on template
  const getSectionOrder = () => {
    const order = templateContext.template.sectionOrder
    return Object.entries(order)
      .sort(([, aOrder], [, bOrder]) => aOrder - bOrder)
      .map(([section]) => section)
      .filter(section => ['contact', 'summary', 'education', 'experience', 'projects', 'skills'].includes(section))
  }

  // Section rendering functions with template context
  const renderSection = (sectionType: string) => {
    const sectionDisplayName = TemplateService.getSectionDisplayName(sectionType, templateContext)
    
    switch (sectionType) {
      case 'contact':
        return (
          <PreviewHeader 
            key="contact" 
            contact={content.contact}
          />
        )
      case 'summary':
        return content.summary ? (
          <section key="summary">
            <h2 className="section-header">{sectionDisplayName}</h2>
            <PreviewSummary summary={content.summary} />
          </section>
        ) : null
      case 'education':
        return content.education && content.education.length > 0 ? (
          <section key="education">
            <h2 className="section-header">{sectionDisplayName}</h2>
            <PreviewEducation education={content.education} />
          </section>
        ) : null
      case 'experience':
        return content.experience && content.experience.length > 0 ? (
          <section key="experience">
            <h2 className="section-header">{sectionDisplayName}</h2>
            <PreviewExperience experience={content.experience} />
          </section>
        ) : null
      case 'projects':
        return content.projects && content.projects.length > 0 ? (
          <section key="projects">
            <h2 className="section-header">{sectionDisplayName}</h2>
            <PreviewProjects projects={content.projects} />
          </section>
        ) : null
      case 'skills':
        return content.skills && content.skills.length > 0 ? (
          <section key="skills">
            <h2 className="section-header">{sectionDisplayName}</h2>
            <PreviewSkills skills={content.skills} />
          </section>
        ) : null
      default:
        return null
    }
  }

  const sectionOrder = getSectionOrder()

  return (
    <div className={`resume-preview bg-white resume-template-${templateContext.template.id}`}>
      <div className="w-full">
        {/* Print-friendly container */}
        <div className="bg-white shadow-sm min-h-full p-4 print:p-6 print:shadow-none print:min-h-0">
          {sectionOrder.map(renderSection).filter(Boolean)}
        </div>
      </div>
      
      {/* Dynamic template styling */}
      <style jsx>{`
        ${templateCSS}
        
        @media print {
          /* Reset all margins and backgrounds for clean printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .resume-preview {
            background: white !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          .w-full {
            max-width: none !important;
            margin: 0 !important;
          }
          
          /* Remove all container styling for print */
          .resume-preview > div {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          
          .resume-preview .shadow-sm,
          .resume-preview .shadow-lg {
            box-shadow: none !important;
          }
          
          /* Page setup */
          @page {
            margin: 0.5in;
            size: letter;
          }
          
          /* Typography for print */
          .resume-preview h1 {
            font-size: 20pt !important;
            margin-bottom: 8pt !important;
          }
          
          .resume-preview h2 {
            font-size: 14pt !important;
            margin-bottom: 6pt !important;
            margin-top: 12pt !important;
            color: #000 !important;
          }
          
          .resume-preview h3 {
            font-size: 12pt !important;
            margin-bottom: 3pt !important;
            color: #000 !important;
          }
          
          .resume-preview p {
            margin-bottom: 6pt !important;
            text-align: left !important;
          }
          
          /* Ensure good page breaks */
          .resume-preview section {
            break-inside: avoid-page;
            margin-bottom: 12pt !important;
          }
          
          .resume-preview .border-l-2 {
            padding-left: 8pt !important;
            margin-bottom: 8pt !important;
            break-inside: avoid-page;
          }
          
          /* Hide interactive elements in print */
          button, 
          .hover\\:underline:hover,
          [onclick] {
            display: none !important;
          }
          
          /* Convert colors to print-friendly versions */
          .text-blue-600, 
          .text-blue-800 {
            color: #000 !important;
          }
          
          .bg-blue-50 {
            background-color: #f5f5f5 !important;
            color: #000 !important;
          }
          
          .bg-gray-100 {
            background-color: #f0f0f0 !important;
            color: #000 !important;
          }
          
          /* Ensure borders are visible in print */
          .border-b,
          .border-l-2 {
            border-color: #333 !important;
          }
          
          /* Skills and tech tags for print */
          .resume-preview span[class*="bg-"] {
            border: 1px solid #333 !important;
            background-color: white !important;
            color: #000 !important;
            padding: 2pt 4pt !important;
          }
          
          /* Contact info styling for print */
          .resume-preview header div {
            margin: 0 8pt !important;
          }
          
          /* Lists for print */
          .resume-preview ul {
            margin-left: 12pt !important;
          }
          
          .resume-preview li {
            margin-bottom: 2pt !important;
          }
        }
        
        @media screen and (max-width: 768px) {
          /* Mobile responsiveness */
          .resume-preview {
            font-size: 14px;
          }
          
          .resume-preview .flex-wrap {
            flex-direction: column;
            align-items: center;
          }
          
          .resume-preview .flex-wrap > div {
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}