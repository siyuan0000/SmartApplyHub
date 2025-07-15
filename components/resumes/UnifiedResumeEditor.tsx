'use client'

import { useState, useEffect, useCallback } from 'react'
import { SectionNavigation } from './SectionNavigation'
import { ResumePreview } from './ResumePreview'
import { EditModal } from './EditModal'
import { ContactEditModal } from './modals/ContactEditModal'
import { SummaryEditModal } from './modals/SummaryEditModal'
import { SkillsEditModal } from './modals/SkillsEditModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useResumeEditor, SectionType } from '@/hooks/useResumeEditor'
import { useAI } from '@/hooks/useAI'
import { AlertCircle } from 'lucide-react'

interface UnifiedResumeEditorProps {
  resumeId: string
}

export function UnifiedResumeEditor({ resumeId }: UnifiedResumeEditorProps) {
  const [editingSection, setEditingSection] = useState<SectionType | null>(null)
  const { 
    content, 
    loading, 
    error,
    loadResume, 
    clearError,
    activeSection,
    cleanup
  } = useResumeEditor()
  
  const { enhanceSection, isEnhancing, error: aiError, clearError: clearAIError } = useAI()

  // Stabilize loadResume with useCallback to prevent infinite loops
  const stableLoadResume = useCallback((id: string) => {
    console.log('🎯 stableLoadResume called with ID:', id)
    loadResume(id)
  }, [loadResume])

  // Stabilize cleanup function
  const stableCleanup = useCallback(() => {
    console.log('🧹 Cleanup called')
    cleanup()
  }, [cleanup])

  useEffect(() => {
    console.log('📱 UnifiedResumeEditor useEffect triggered:', { 
      resumeId, 
      resumeIdType: typeof resumeId,
      resumeIdLength: resumeId?.length,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString()
    })
    
    if (resumeId) {
      // Add additional validation logging
      console.log('🔍 Resume ID Analysis:', {
        value: resumeId,
        isString: typeof resumeId === 'string',
        hasValidLength: resumeId.length === 36,
        containsHyphens: resumeId.includes('-'),
        isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(resumeId)
      })
      
      stableLoadResume(resumeId)
    } else {
      console.warn('⚠️ No resumeId provided to UnifiedResumeEditor')
    }

    // Cleanup on unmount
    return () => {
      stableCleanup()
    }
  }, [resumeId, stableLoadResume, stableCleanup])

  const handleSectionEdit = (section: SectionType) => {
    setEditingSection(section)
  }

  const handleCloseModal = () => {
    setEditingSection(null)
  }

  const handleAIEnhance = async (section: SectionType) => {
    if (!content) return

    try {
      clearAIError()
      let currentContent = ''
      
      switch (section) {
        case 'summary':
          currentContent = content.summary || ''
          break
        case 'contact':
          currentContent = `${content.contact.name || ''} ${content.contact.email || ''}`
          break
        default:
          console.warn(`AI enhancement not implemented for section: ${section}`)
          return
      }
      
      await enhanceSection(section, currentContent)
      
      // The hook will handle the update and auto-save automatically
    } catch (error) {
      console.error('Failed to enhance section:', error)
    }
  }

  const renderEditModal = () => {
    if (!editingSection) return null

    const modalProps = {
      section: editingSection,
      isOpen: true,
      onClose: handleCloseModal,
      onAIEnhance: () => handleAIEnhance(editingSection),
      isEnhancing
    }

    switch (editingSection) {
      case 'contact':
        return (
          <EditModal {...modalProps}>
            <ContactEditModal />
          </EditModal>
        )
      case 'summary':
        return (
          <EditModal {...modalProps}>
            <SummaryEditModal />
          </EditModal>
        )
      case 'skills':
        return (
          <EditModal {...modalProps}>
            <SkillsEditModal />
          </EditModal>
        )
      default:
        return (
          <EditModal {...modalProps}>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {editingSection.charAt(0).toUpperCase() + editingSection.slice(1)} editor coming soon!
              </p>
            </div>
          </EditModal>
        )
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <div className="space-y-2">
          <p className="text-muted-foreground">Loading resume...</p>
          <p className="text-sm text-muted-foreground/70">This may take a few seconds</p>
        </div>
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
    <div className="space-y-4">
      {/* Error Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {(error.includes('Invalid resume ID format') || 
              error.includes('Resume not found') || 
              error.includes('No active session found')) && (
              <div className="mt-2 text-sm">
                Redirecting to resume list in 3 seconds...
              </div>
            )}
            <button onClick={clearError} className="ml-2 text-sm underline">
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      {aiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            AI Enhancement Error: {aiError}
            <button onClick={clearAIError} className="ml-2 text-sm underline">
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[600px]">
        {/* Left Panel - Section Navigation */}
        <div className="lg:col-span-2">
          <SectionNavigation onSectionEdit={handleSectionEdit} />
        </div>

        {/* Right Panel - Live Preview */}
        <div className="lg:col-span-3">
          <div className="sticky top-6">
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-medium text-gray-900">Live Preview</h3>
                <p className="text-sm text-gray-600">
                  {activeSection === 'contact' && 'Contact information section'}
                  {activeSection === 'summary' && 'Professional summary section'}
                  {activeSection === 'experience' && 'Work experience section'}
                  {activeSection === 'education' && 'Education section'}
                  {activeSection === 'skills' && 'Skills section'}
                  {activeSection === 'projects' && 'Projects section'}
                </p>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                <ResumePreview 
                  resumeId={resumeId} 
                  highlightSection={activeSection}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modals */}
      {renderEditModal()}
    </div>
  )
}