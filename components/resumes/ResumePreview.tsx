'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useResumeEditor } from '@/hooks/useResumeEditor'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { X, Printer } from 'lucide-react'
import { printPreviewToPDF, type PrintOptions } from '@/lib/isolated-print'
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
  onClose?: () => void
}

export function ResumePreview({ resumeId, templateId, detectedLanguage, originalHeaders, onClose }: ResumePreviewProps) {
  const { content, loading, loadResume } = useResumeEditor()
  const previewRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)

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
          <PreviewSummary key="summary" summary={content.summary} sectionTitle={sectionDisplayName} />
        ) : null
      case 'education':
        return content.education && content.education.length > 0 ? (
          <PreviewEducation key="education" education={content.education} sectionTitle={sectionDisplayName} />
        ) : null
      case 'experience':
        return content.experience && content.experience.length > 0 ? (
          <PreviewExperience key="experience" experience={content.experience} sectionTitle={sectionDisplayName} />
        ) : null
      case 'projects':
        return content.projects && content.projects.length > 0 ? (
          <PreviewProjects key="projects" projects={content.projects} sectionTitle={sectionDisplayName} />
        ) : null
      case 'skills':
        return content.skills && content.skills.length > 0 ? (
          <PreviewSkills key="skills" skills={content.skills} sectionTitle={sectionDisplayName} />
        ) : null
      default:
        return null
    }
  }

  const sectionOrder = getSectionOrder()

  // Print handler using isolated print system
  const handlePrint = async () => {
    if (!previewRef.current || isPrinting) return
    
    setIsPrinting(true)
    try {
      // Get the actual preview dimensions
      const previewRect = previewRef.current.getBoundingClientRect()
      const previewWidth = previewRect.width
      const previewHeight = previewRect.height
      
      // Calculate scale to fit preview content to page
      const pageWidthPx = previewWidth
      const pageHeightPx = previewHeight
      
      // Convert pixels to inches (96 DPI standard)
      const pageWidthIn = pageWidthPx / 96
      const pageHeightIn = pageHeightPx / 96
      
      // Determine page size based on aspect ratio
      const aspectRatio = pageWidthIn / pageHeightIn
      let pageSize: 'A4' | 'Letter' = 'Letter'
      
      // A4 aspect ratio ≈ 0.707, Letter aspect ratio ≈ 0.773
      if (aspectRatio < 0.74) {
        pageSize = 'A4'
      }
      
      const printOptions: PrintOptions = {
        pageSize,
        margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        scale: 1,
        filename: `${content?.contact?.name || 'resume'}.pdf`
      }
      
      await printPreviewToPDF(previewRef.current, printOptions)
    } catch (error) {
      console.error('Print failed:', error)
      // You could add toast notification here
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className={`resume-preview bg-white resume-template-${templateContext.template.id} relative`}>
      {/* Action buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-2 no-print">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100"
          onClick={handlePrint}
          disabled={isPrinting}
        >
          <Printer className="h-4 w-4" />
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="w-full" ref={previewRef}>
        {/* Print-friendly container */}
        <div className="resume-content bg-white shadow-sm min-h-full p-6 print:p-6 print:shadow-none print:min-h-0 text-sm">
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
            font-size: 18pt !important;
            margin-bottom: 6pt !important;
          }
          
          .resume-preview h2 {
            font-size: 12pt !important;
            margin-bottom: 4pt !important;
            margin-top: 8pt !important;
            color: #000 !important;
          }
          
          .resume-preview h3 {
            font-size: 11pt !important;
            margin-bottom: 2pt !important;
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
        
        /* Screen styles for smaller text */
        .resume-preview {
          font-size: 13px;
        }
        
        .resume-preview h1 {
          font-size: 1.4rem;
        }
        
        .resume-preview h2 {
          font-size: 1.1rem;
        }
        
        .resume-preview h3 {
          font-size: 1rem;
        }
        
        @media screen and (max-width: 768px) {
          /* Mobile responsiveness */
          .resume-preview {
            font-size: 12px;
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