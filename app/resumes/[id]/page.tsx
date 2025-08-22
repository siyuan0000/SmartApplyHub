'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { ResumeEditor } from '@/components/resumes/ResumeEditor'
import { ResumePreview } from '@/components/resumes/ResumePreview'
import { TemplatePanel } from '@/components/resumes/TemplatePanel'
import { Button } from '@/components/ui/button'
import { useResumeEditor, useResumeEditorComputed } from '@/hooks/useResumeEditor'
import { ResumeLanguage } from '@/lib/templates'
import { PDFGenerator } from '@/lib/pdf-generator'
import { ArrowLeft, Eye, Download, Edit, AlertCircle, Save, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ResumePage() {
  const params = useParams()
  const resumeId = params.id as string
  const { content, saving, forceSave } = useResumeEditor()
  const { isDirty } = useResumeEditorComputed()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>()
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [isStreamPaneOpen, setIsStreamPaneOpen] = useState(false)

  // Get detected language from content
  const detectedLanguage = (content?.detected_language || 'en') as ResumeLanguage
  const originalHeaders = content?.original_headers || {}

  // Auto-collapse preview when AI stream pane opens
  useEffect(() => {
    if (isStreamPaneOpen && !previewCollapsed) {
      setPreviewCollapsed(true)
    }
  }, [isStreamPaneOpen, previewCollapsed])

  // Handle stream pane toggle from ResumeEditor
  const handleStreamPaneToggle = useCallback((isOpen: boolean) => {
    setIsStreamPaneOpen(isOpen)
  }, [])

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
          forceSave()
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('keydown', handleKeydown)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [isDirty, forceSave])

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

  const handlePrint = async () => {
    try {
      // Show loading state
      toast.loading('Generating PDF...', { id: 'pdf-generation' })
      
      // Ensure preview is visible before generating PDF
      if (previewCollapsed) {
        setPreviewCollapsed(false)
        // Wait a bit for the preview to render
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      await PDFGenerator.generateResumePreviewPDF({
        quality: 0.98,
        scale: 2,
        margin: 0.5
      })
      
      toast.success('PDF generated successfully!', { id: 'pdf-generation' })
    } catch (error) {
      console.error('PDF generation failed:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate PDF. Please try again.',
        { id: 'pdf-generation' }
      )
    }
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
              onClick={forceSave}
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
        <div className="relative">
          <div className={`grid gap-6 h-[calc(100vh-12rem)] transition-all duration-300 ${
            previewCollapsed 
              ? 'grid-cols-1' 
              : 'grid-cols-1 lg:grid-cols-2'
          }`}>
            {/* Editor Panel */}
            <div className="bg-background border rounded-lg overflow-hidden flex flex-col">
              <div className="border-b bg-muted/50 px-4 py-2 flex-shrink-0">
                <h3 className="font-medium flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Editor
                </h3>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-4">
                {/* Template Selection */}
                <TemplatePanel
                  currentTemplateId={selectedTemplateId}
                  detectedLanguage={detectedLanguage}
                  onTemplateSelect={setSelectedTemplateId}
                />
                
                {/* Resume Editor */}
                <ResumeEditor 
                  resumeId={resumeId} 
                  onStreamPaneToggle={handleStreamPaneToggle}
                />
              </div>
            </div>

            {/* Show Preview Button - positioned on right side when collapsed */}
            {previewCollapsed && (
              <div className="fixed right-0 top-2/3 transform -translate-y-1/2 z-10">
                <div className="group relative">
                  {/* Main Button */}
                  <button
                    onClick={() => setPreviewCollapsed(false)}
                    className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white p-0.5 rounded-l-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
                    title="Show Preview"
                  >
                    {/* Background Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-l-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    
                    {/* Button Content */}
                    <div className="relative bg-gray-900/90 backdrop-blur-sm rounded-l-lg px-2 py-4 flex flex-col items-center gap-1 min-w-[32px] min-h-[32px]">
                      {/* Eye Icon with Animation */}
                      <div className="relative">
                        <Eye className="h-4 w-4 text-white group-hover:text-blue-200 transition-colors duration-300" />
                        <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-110 transition-transform duration-300"></div>
                      </div>

                      {/* Pulse Animation Dot */}
                      <div className="absolute -top-1 -right-1">
                        <div className="relative">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow Indicator */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
                      <div className="w-0 h-0 border-t-3 border-b-3 border-r-4 border-transparent border-r-white/20 group-hover:border-r-blue-200 transition-colors duration-300"></div>
                    </div>
                  </button>
                  
                  {/* Floating Particles Effect */}
                  {/* <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-2 right-1 w-1 h-1 bg-blue-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity duration-300" style={{ animationDelay: '0.1s' }}></div>
                    <div className="absolute top-8 right-2 w-1 h-1 bg-purple-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity duration-300" style={{ animationDelay: '0.3s' }}></div>
                    <div className="absolute bottom-8 right-1 w-1 h-1 bg-pink-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity duration-300" style={{ animationDelay: '0.6s' }}></div>
                  </div> */}
                </div>
              </div>
            )}

            {/* Preview Panel */}
            <div className={`bg-background border rounded-lg overflow-hidden flex flex-col transition-all duration-300 ${
              previewCollapsed ? 'hidden' : 'block'
            }`}>
            <div className="border-b bg-muted/50 px-4 py-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewCollapsed(true)}
                  className="h-6 w-6 p-0 hover:bg-muted"
                  title="Collapse preview"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <ResumePreview 
                resumeId={resumeId}
                templateId={selectedTemplateId}
                detectedLanguage={detectedLanguage}
                originalHeaders={originalHeaders}
              />
            </div>
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
            /* Hide all UI chrome and navigation */
            .sidebar, 
            nav, 
            .app-header,
            header {
              display: none !important;
            }
            
            /* Hide AppLayout padding and styling */
            main {
              padding: 0 !important;
              background: white !important;
            }
            
            /* Hide page header with buttons */
            .space-y-6 > div:first-child {
              display: none !important;
            }
            
            /* Hide split view layout, show only preview */
            .grid.lg\\:grid-cols-2 {
              display: block !important;
              height: auto !important;
              gap: 0 !important;
            }
            
            /* Hide editor panel completely */
            .grid.lg\\:grid-cols-2 > div:first-child {
              display: none !important;
            }
            
            /* Show only preview panel */
            .grid.lg\\:grid-cols-2 > div:last-child {
              display: block !important;
              overflow: visible !important;
              height: auto !important;
              border: none !important;
              background: white !important;
              width: 100% !important;
              max-width: none !important;
            }
            
            /* Hide preview panel header */
            .grid.lg\\:grid-cols-2 > div:last-child > div:first-child {
              display: none !important;
            }
            
            /* Ensure preview content fills page */
            .grid.lg\\:grid-cols-2 > div:last-child > div:last-child {
              overflow: visible !important;
              height: auto !important;
            }
          }
        `}</style>
      </div>
    </AppLayout>
  )
}