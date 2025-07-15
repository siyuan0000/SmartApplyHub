'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { ResumeEditor } from '@/components/resumes/ResumeEditor'
import { ResumePreview } from '@/components/resumes/ResumePreview'
import { Button } from '@/components/ui/button'
import { useResumeEditor, useResumeEditorComputed } from '@/hooks/useResumeEditor'
import { ArrowLeft, Eye, Download, Edit, AlertCircle, Save } from 'lucide-react'
import Link from 'next/link'

export default function ResumePage() {
  const params = useParams()
  const resumeId = params.id as string
  const { saving, saveResume } = useResumeEditor()
  const { isDirty } = useResumeEditorComputed()

  // Prevent navigation away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty) {
          saveResume()
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('keydown', handleKeydown)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [isDirty, saveResume])

  const handleBackClick = (e: React.MouseEvent) => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      )
      if (!confirmed) {
        e.preventDefault()
        return
      }
    }
  }

  const handlePrint = () => {
    window.print()
  }


  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/resumes" onClick={handleBackClick}>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Resumes
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Resume Editor</h1>
                {saving && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium">Saving...</span>
                  </div>
                )}
                {!saving && isDirty && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Unsaved changes</span>
                  </div>
                )}
                {!saving && !isDirty && (
                  <div className="flex items-center gap-1 text-green-600">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm font-medium">All changes saved</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  Edit your resume sections and optimize with AI
                </p>
                {isDirty && (
                  <p className="text-sm text-amber-600">
                    Press Ctrl+S (⌘+S on Mac) to save quickly
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={saveResume}
              disabled={saving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Resume'}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handlePrint}
            >
              <Download className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Split View Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
          {/* Editor Panel */}
          <div className="bg-background border rounded-lg overflow-hidden flex flex-col">
            <div className="border-b bg-muted/50 px-4 py-2 flex-shrink-0">
              <h3 className="font-medium flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Editor
              </h3>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <ResumeEditor resumeId={resumeId} />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-background border rounded-lg overflow-hidden flex flex-col">
            <div className="border-b bg-muted/50 px-4 py-2 flex-shrink-0">
              <h3 className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </h3>
            </div>
            <div className="overflow-y-auto flex-1">
              <ResumePreview resumeId={resumeId} />
            </div>
          </div>
        </div>

        {/* Mobile Stack View */}
        <style jsx>{`
          @media (max-width: 1023px) {
            .grid.lg\\:grid-cols-2 {
              grid-template-columns: 1fr !important;
              height: auto !important;
            }
            
            .grid.lg\\:grid-cols-2 > div {
              height: 50vh !important;
            }
          }
          
          @media print {
            /* Hide everything except preview for printing */
            .grid.lg\\:grid-cols-2 {
              display: block !important;
            }
            
            .grid.lg\\:grid-cols-2 > div:first-child {
              display: none !important;
            }
            
            .grid.lg\\:grid-cols-2 > div:last-child {
              display: block !important;
              overflow: visible !important;
              height: auto !important;
              border: none !important;
              background: white !important;
            }
            
            .grid.lg\\:grid-cols-2 > div:last-child > div:first-child {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </AppLayout>
  )
}