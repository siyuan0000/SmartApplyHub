'use client'

import { useEffect } from 'react'
import { useResumeEditor } from '@/hooks/useResumeEditor'
import { Skeleton } from '@/components/ui/skeleton'
import { PreviewHeader } from './preview/PreviewHeader'
import { PreviewSummary } from './preview/PreviewSummary'
import { PreviewExperience } from './preview/PreviewExperience'
import { PreviewEducation } from './preview/PreviewEducation'
import { PreviewSkills } from './preview/PreviewSkills'
import { PreviewProjects } from './preview/PreviewProjects'

interface ResumePreviewProps {
  resumeId: string
}

export function ResumePreview({ resumeId }: ResumePreviewProps) {
  const { content, loading, loadResume } = useResumeEditor()

  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId)
    }
  }, [resumeId, loadResume])

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

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Resume not found</p>
      </div>
    )
  }

  return (
    <div className="resume-preview bg-white">
      <div className="w-full">
        {/* Print-friendly container */}
        <div className="bg-white shadow-sm min-h-full p-4 print:p-6 print:shadow-none print:min-h-0">
          <PreviewHeader contact={content.contact} />
          <PreviewSummary summary={content.summary} />
          <PreviewExperience experience={content.experience} />
          <PreviewEducation education={content.education} />
          <PreviewSkills skills={content.skills} />
          <PreviewProjects projects={content.projects} />
        </div>
      </div>
      
      {/* Enhanced print and professional styling */}
      <style jsx>{`
        /* General resume styling improvements */
        .resume-preview {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.4;
          font-size: 0.9rem;
        }
        
        .resume-preview h1 {
          font-family: 'Arial', 'Helvetica', sans-serif;
          letter-spacing: 0.5px;
        }
        
        .resume-preview h2 {
          font-family: 'Arial', 'Helvetica', sans-serif;
          color: #2c3e50;
        }
        
        .resume-preview h3 {
          font-family: 'Arial', 'Helvetica', sans-serif;
        }
        
        /* Professional spacing */
        .resume-preview section {
          margin-bottom: 1.25rem;
        }
        
        .resume-preview .border-l-2 {
          padding-left: 0.75rem;
          margin-bottom: 1rem;
        }
        
        /* Enhanced typography */
        .resume-preview p {
          text-align: justify;
          hyphens: auto;
        }
        
        .resume-preview ul {
          margin-left: 0.5rem;
        }
        
        .resume-preview li {
          margin-bottom: 0.25rem;
        }
        
        /* Professional color scheme */
        .resume-preview .border-blue-200 {
          border-left-color: #3b82f6;
          border-left-width: 3px;
        }
        
        .resume-preview .border-green-200 {
          border-left-color: #10b981;
          border-left-width: 3px;
        }
        
        .resume-preview .border-purple-200 {
          border-left-color: #8b5cf6;
          border-left-width: 3px;
        }
        
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
          }
          
          .w-full {
            max-width: none !important;
            margin: 0 !important;
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