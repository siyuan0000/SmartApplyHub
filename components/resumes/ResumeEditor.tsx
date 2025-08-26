'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ResumeContent } from '@/lib/resume/parser'
import { useResumeEditor, useResumeEditorComputed, formatAchievements, parseAchievements } from '@/hooks/useResumeEditor'
import { useResumeHistory } from '@/hooks/useResumeHistory'
import { useAI } from '@/hooks/useAI'
import { useResizablePanels } from '@/hooks/useResizablePanels'
import { ResizableHandle } from '@/components/ui/resizable-handle'
import { useAboutGeneration } from '@/hooks/useAboutGeneration'
import { AIEnhancementLab } from './AIEnhancementLab'
import { ResumeEditorSidebar } from './ResumeEditorSidebar'
import { useUIStore } from '@/store/ui'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { saveLogger } from '@/lib/debug/save-logger'
import { Plus, Trash2, Sparkles, AlertCircle, RefreshCw, Wand2, Copy, Undo2, Redo2, Save, History } from 'lucide-react'

interface ResumeEditorProps {
  resumeId: string
  onSave?: (content: ResumeContent) => void
  onStreamPaneToggle?: (isOpen: boolean) => void
}

export function ResumeEditor({ resumeId, onSave, onStreamPaneToggle }: ResumeEditorProps) {
  const { 
    content, 
    loading, 
    saving,
    error,
    loadResume, 
    clearError,
    updateContact,
    updateSummary,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    addProject,
    updateProject,
    removeProject,
    applyAIEnhancement,
    updateContent,
    forceSave
  } = useResumeEditor()

  const { isDirty } = useResumeEditorComputed()
  
  const { 
    canUndo, 
    canRedo, 
    getHistoryInfo, 
    addToHistory, 
    undo: historyUndo, 
    redo: historyRedo 
  } = useResumeHistory()

  // Resizable panels for AI Enhancement Lab
  const {
    width: aiPanelWidth,
    isResizing,
    handleMouseDown: handleResizeMouseDown,
    resetWidth: resetAIPanelWidth
  } = useResizablePanels({
    minWidth: 400,
    maxWidth: 800,
    defaultWidth: 500,
    storageKey: 'ai-panel-width'
  })
  
  const [activeSection, setActiveSection] = useState<string>('contact')
  const { error: aiError, clearError: clearAIError } = useAI()
  const { 
    generateAbout, 
    generateAboutVariations, 
    enhanceAbout,
    isGenerating, 
    isGeneratingVariations, 
    isEnhancing: isEnhancingAbout, 
    error: aboutError,
    lastResult,
    variations,
    clearError: clearAboutError,
    clearResults
  } = useAboutGeneration()
  
  const [showVariations, setShowVariations] = useState(false)
  const [enhancingSection, setEnhancingSection] = useState<string | null>(null)
  
  // AI Enhancement Lab state
  const [showEnhancementLab, setShowEnhancementLab] = useState(false)
  
  const isMobile = useIsMobile()
  const autoCollapseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { 
    editorSidebarCollapsed,
    autoCollapseEditorSidebar
  } = useUIStore()

  // Notify parent when AI lab toggles
  useEffect(() => {
    onStreamPaneToggle?.(showEnhancementLab)
  }, [showEnhancementLab, onStreamPaneToggle])

  // Unified AI Enhancement System
  const getContentForSection = (sectionType: string): string => {
    if (!content) return ''
    
    switch (sectionType) {
      case 'contact':
        return `Name: ${content.contact.name || ''}
Email: ${content.contact.email || ''}
Phone: ${content.contact.phone || ''}
Location: ${content.contact.location || ''}
LinkedIn: ${content.contact.linkedin || ''}
GitHub: ${content.contact.github || ''}`
      
      case 'about':
      case 'summary':
        return content.summary || ''
      
      case 'experience':
        return content.experience.map((exp, index) => 
          `Experience ${index + 1}:
Title: ${exp.title}
Company: ${exp.company}
Description: ${exp.description || ''}
Achievements: ${formatAchievements(exp.achievements)}`
        ).join('\n\n')
      
      case 'education':
        return content.education.map((edu, index) =>
          `Education ${index + 1}:
Degree: ${edu.degree}
School: ${edu.school}
Graduation: ${edu.graduationDate || ''}
GPA: ${edu.gpa || ''}`
        ).join('\n\n')
      
      case 'skills':
        return content.skills.join(', ')
      
      case 'projects':
        return (content.projects || []).map((project, index) =>
          `Project ${index + 1}:
Name: ${project.name}
Description: ${project.description}
Details: ${formatAchievements(project.details)}
Technologies: ${project.technologies?.join(', ') || ''}
URL: ${project.url || ''}`
        ).join('\n\n')
      
      default:
        return ''
    }
  }

  // Handle field-level content application
  const applyEnhancedField = async (fieldPath: string, value: string) => {
    if (!content) return
    
    try {
      // Track history before applying AI enhancement
      addToHistory(content, 'ai_enhancement', `Enhanced ${fieldPath.split('.').pop()}`)
      await applyAIEnhancement(fieldPath, value)
    } catch (error) {
      console.error(`Failed to apply AI enhancement to ${fieldPath}:`, error)
      throw error // Re-throw to allow toast notification to catch it
    }
  }
  
  const applyEnhancedContent = async (sectionType: string, enhancedContent: string) => {
    if (!content) {
      console.error('❌ applyEnhancedContent: No content available')
      return
    }
    
    console.log('🎯 Applying enhanced content:', { 
      sectionType, 
      contentLength: enhancedContent.length,
      contentPreview: enhancedContent.substring(0, 200) + '...',
      currentSummary: content.summary?.substring(0, 50) + '...',
      currentSkillsCount: content.skills?.length || 0
    })
    
    try {
      // Track history before applying enhancement
      addToHistory(content, 'ai_enhancement', `Enhanced ${sectionType} section`)
      
      // Create deep copy to prevent mutations
      const updatedContent = structuredClone(content)
      let updateApplied = false
      
      switch (sectionType) {
        case 'about':
        case 'summary':
          console.log('🔄 Updating summary section...')
          updatedContent.summary = enhancedContent
          updateApplied = true
          break
        
        case 'skills':
          // Parse skills from enhanced content
          const skillsArray = enhancedContent
            .split(/[,\n]/)
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0)
          console.log('🔄 Updating skills section:', { skillsArray })
          updatedContent.skills = skillsArray
          updateApplied = true
          break
        
        case 'contact':
          // Parse contact information from enhanced content
          const lines = enhancedContent.split('\n')
          console.log('🔄 Updating contact section:', { lines })
          lines.forEach(line => {
            const [field, value] = line.split(':').map(s => s.trim())
            if (field && value) {
              const fieldMap: Record<string, string> = {
                'Name': 'name',
                'Email': 'email', 
                'Phone': 'phone',
                'Location': 'location',
                'LinkedIn': 'linkedin',
                'GitHub': 'github'
              }
              const contactField = fieldMap[field]
              if (contactField) {
                updatedContent.contact = { ...updatedContent.contact, [contactField]: value }
                updateApplied = true
              }
            }
          })
          break
        
        case 'experience':
          // Try to parse and apply enhanced content to the first experience entry
          if (updatedContent.experience.length > 0) {
            console.log('🔄 Updating experience section...')
            const enhancedLines = enhancedContent.split('\n').filter(line => line.trim())
            const currentExp = { ...updatedContent.experience[0] }
            
            enhancedLines.forEach(line => {
              if (line.toLowerCase().includes('title:') || line.toLowerCase().includes('position:')) {
                currentExp.title = line.split(':')[1]?.trim() || currentExp.title
              } else if (line.toLowerCase().includes('company:')) {
                currentExp.company = line.split(':')[1]?.trim() || currentExp.company
              } else if (line.toLowerCase().includes('description:')) {
                currentExp.description = line.split(':')[1]?.trim() || currentExp.description
              } else if (line.startsWith('•') || line.startsWith('-') || line.toLowerCase().includes('achievement')) {
                if (!currentExp.achievements) currentExp.achievements = []
                const achievement = line.replace(/^[•\-]\s*/, '').trim()
                if (achievement && !currentExp.achievements.includes(achievement)) {
                  currentExp.achievements.push(achievement)
                }
              }
            })
            
            updatedContent.experience[0] = currentExp
            updateApplied = true
          }
          break
        
        case 'education':
          // Try to parse and apply enhanced content to the first education entry
          if (updatedContent.education.length > 0) {
            console.log('🔄 Updating education section...')
            const enhancedLines = enhancedContent.split('\n').filter(line => line.trim())
            const currentEdu = { ...updatedContent.education[0] }
            
            enhancedLines.forEach(line => {
              if (line.toLowerCase().includes('degree:')) {
                currentEdu.degree = line.split(':')[1]?.trim() || currentEdu.degree
              } else if (line.toLowerCase().includes('school:') || line.toLowerCase().includes('university:')) {
                currentEdu.school = line.split(':')[1]?.trim() || currentEdu.school
              } else if (line.toLowerCase().includes('graduation:') || line.toLowerCase().includes('year:')) {
                currentEdu.graduationDate = line.split(':')[1]?.trim() || currentEdu.graduationDate
              } else if (line.toLowerCase().includes('gpa:')) {
                currentEdu.gpa = line.split(':')[1]?.trim() || currentEdu.gpa
              }
            })
            
            updatedContent.education[0] = currentEdu
            updateApplied = true
          }
          break
        
        case 'projects':
          // Try to parse and apply enhanced content to the first project entry
          if (updatedContent.projects && updatedContent.projects.length > 0) {
            console.log('🔄 Updating projects section...')
            const enhancedLines = enhancedContent.split('\n').filter(line => line.trim())
            const currentProject = { ...updatedContent.projects[0] }
            
            enhancedLines.forEach(line => {
              if (line.toLowerCase().includes('name:') || line.toLowerCase().includes('project:')) {
                currentProject.name = line.split(':')[1]?.trim() || currentProject.name
              } else if (line.toLowerCase().includes('description:')) {
                currentProject.description = line.split(':')[1]?.trim() || currentProject.description
              } else if (line.toLowerCase().includes('technologies:') || line.toLowerCase().includes('tech:')) {
                const techStr = line.split(':')[1]?.trim()
                if (techStr) {
                  currentProject.technologies = techStr.split(',').map(t => t.trim())
                }
              } else if (line.toLowerCase().includes('url:') || line.toLowerCase().includes('link:')) {
                currentProject.url = line.split(':')[1]?.trim() || currentProject.url
              } else if (line.startsWith('•') || line.startsWith('-') || line.toLowerCase().includes('feature')) {
                if (!currentProject.details) currentProject.details = []
                const detail = line.replace(/^[•\-]\s*/, '').trim()
                if (detail && !currentProject.details.includes(detail)) {
                  currentProject.details.push(detail)
                }
              }
            })
            
            updatedContent.projects[0] = currentProject
            updateApplied = true
          }
          break
        
        default:
          console.warn(`❌ Enhancement handler not implemented for section: ${sectionType}`)
          return
      }
      
      if (updateApplied) {
        console.log('✅ Content update applied successfully, updating state and saving...')
        
        // Update content with deep copy to ensure React detects changes
        updateContent(updatedContent)
        
        // Force save immediately after content update
        await handleSave(true)
        
        console.log('✅ Enhanced content saved successfully!')
      } else {
        console.warn('⚠️ No content updates were applied')
      }
      
    } catch (error) {
      console.error(`❌ Failed to apply enhanced content for ${sectionType}:`, error)
      throw error // Re-throw to allow upper-level error handling
    }
  }

  const handleAIEnhance = (sectionType: string) => {
    const currentContent = getContentForSection(sectionType)
    
    if (!currentContent.trim()) {
      console.log(`🆕 Creating new ${sectionType} section from scratch with AI`)
    } else {
      console.log(`🎯 Enhancing existing ${sectionType} section content`)
    }
    
    setEnhancingSection(sectionType)
    setActiveSection(sectionType) // Switch to the section being enhanced
    setShowEnhancementLab(true) // Open the AI lab
  }

  const handleCloseEnhancementLab = () => {
    setEnhancingSection(null)
    setShowEnhancementLab(false)
  }


  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId)
    }
  }, [resumeId, loadResume])

  // Track if we've initialized history for this resume
  const historyInitialized = useRef<string | null>(null)
  
  // Initialize history when content first loads
  useEffect(() => {
    if (content && resumeId && historyInitialized.current !== resumeId) {
      addToHistory(content, 'loaded', 'Resume loaded')
      historyInitialized.current = resumeId
    }
  }, [content, resumeId, addToHistory])

  const handleSave = async (force = false) => {
    const sessionId = saveLogger.generateSessionId()
    const startTime = Date.now()
    
    // Start logging session
    saveLogger.startSession(sessionId, resumeId, undefined)
    saveLogger.logStep(sessionId, 'editor_handle_save', 'start', {
      hasContent: !!content,
      contentKeys: content ? Object.keys(content) : [],
      summaryLength: content?.summary?.length || 0,
      skillsCount: content?.skills?.length || 0,
      experienceCount: content?.experience?.length || 0,
      isDirty,
      saving,
      force,
      trigger: force ? 'manual_force' : isDirty ? 'manual_dirty' : 'manual_clean'
    })
    
    try {
      if (force || isDirty) {
        saveLogger.logStep(sessionId, 'editor_calling_force_save', 'start')
        await forceSave(sessionId) // Pass sessionId for continuity
        saveLogger.logStep(sessionId, 'editor_force_save_complete', 'success', undefined, undefined, startTime)
      } else {
        saveLogger.logStep(sessionId, 'editor_skip_save', 'warning', { reason: 'not_dirty_and_not_forced' })
      }
      
      if (content) {
        onSave?.(content)
        saveLogger.logStep(sessionId, 'editor_on_save_callback', 'success')
      }
      
      saveLogger.logStep(sessionId, 'save_complete', 'success')
      saveLogger.endSession(sessionId, 'success')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      saveLogger.logStep(sessionId, 'editor_handle_save', 'error', {
        error: errorMessage,
        errorType: error?.constructor?.name
      }, errorMessage)
      saveLogger.endSession(sessionId, 'error')
      throw error // Re-throw to maintain original error handling
    }
  }
  
  const handleUndo = () => {
    const previousContent = historyUndo()
    if (previousContent) {
      updateContent(previousContent)
    }
  }
  
  const handleRedo = () => {
    const nextContent = historyRedo()
    if (nextContent) {
      updateContent(nextContent)
    }
  }

  // Auto-collapse functionality for main content area
  const scheduleAutoCollapse = useCallback(() => {
    if (isMobile) return
    
    if (autoCollapseTimeoutRef.current) {
      clearTimeout(autoCollapseTimeoutRef.current)
    }
    
    autoCollapseTimeoutRef.current = setTimeout(() => {
      autoCollapseEditorSidebar()
    }, 500)
  }, [isMobile, autoCollapseEditorSidebar])

  const handleMainContentClick = useCallback(() => {
    if (!isMobile && !editorSidebarCollapsed) {
      scheduleAutoCollapse()
    }
  }, [isMobile, editorSidebarCollapsed, scheduleAutoCollapse])


  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading resume...</p>
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

  // About generation handlers
  const handleGenerateAbout = async () => {
    if (!content) return
    try {
      // Track history before generating new content
      addToHistory(content, 'ai_generation', 'Generated about section')
      
      // Clear previous text and error state
      clearAboutError()
      clearResults()
      
      // Clear the current summary to show we're generating fresh content
      updateSummary('')
      
      const result = await generateAbout(content)
      if (result) {
        // Show success message for offline fallback
        if (result.provider === 'offline-fallback' || result.provider === 'local-fallback') {
          console.log('Generated offline template - customize it with your specific details')
        }
        updateSummary(result.aboutText)
        await handleSave()
      }
    } catch (error) {
      console.error('Failed to generate about:', error)
      // Show error state - the error will be displayed in the UI
    }
  }

  const handleGenerateVariations = async () => {
    if (!content) return
    try {
      clearAboutError()
      clearResults()
      setShowVariations(true)
      await generateAboutVariations(content, 3)
    } catch (error) {
      console.error('Failed to generate variations:', error)
    }
  }

  const handleEnhanceAbout = async () => {
    if (!content || !content.summary) return
    try {
      // Track history before enhancing content
      addToHistory(content, 'ai_enhancement', 'Enhanced about section')
      
      clearAboutError()
      clearResults()
      const result = await enhanceAbout(content.summary, content)
      if (result) {
        updateSummary(result.aboutText)
        await handleSave()
      }
    } catch (error) {
      console.error('Failed to enhance about:', error)
    }
  }

  const handleSelectVariation = async (variation: { aboutText: string }) => {
    if (content) {
      // Track history before selecting variation
      addToHistory(content, 'ai_selection', 'Selected about variation')
    }
    
    updateSummary(variation.aboutText)
    setShowVariations(false)
    clearResults()
    await handleSave()
  }

  const sections = [
    { id: 'contact', label: 'Contact Info', icon: '👤' },
    { id: 'about', label: 'About Me', icon: '📝' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '🔧' },
    { id: 'projects', label: 'Projects', icon: '🚀' }
  ]

  return (
    <div className="flex h-full">
      <ResumeEditorSidebar
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      <div className="flex flex-1 min-w-0 relative">
        <div 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            "overflow-y-auto min-w-0"
          )}
          style={{
            marginRight: showEnhancementLab ? `${aiPanelWidth}px` : '0px'
          }}
          onClick={handleMainContentClick}
        >
          <div className="p-4 space-y-4">
          

          {/* Editor Controls */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Editor Controls
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Save, undo, and manage your changes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo()}
                  className="gap-1"
                >
                  <Undo2 className="h-4 w-4" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={!canRedo()}
                  className="gap-1"
                >
                  <Redo2 className="h-4 w-4" />
                  Redo
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium px-4"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            {(() => {
              const historyInfo = getHistoryInfo()
              return historyInfo.total > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  History: {historyInfo.current}/{historyInfo.total} changes
                </div>
              )
            })()}
          </div>

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
          {aboutError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium mb-1">AI Enhancement Failed</div>
                    <div className="text-sm">{aboutError}</div>
                    <div className="mt-2 text-xs opacity-90">
                      {aboutError.includes('network') && (
                        <p>💡 Check your internet connection and try again</p>
                      )}
                      {aboutError.includes('timeout') && (
                        <p>💡 The AI service may be busy - please try again in a moment</p>
                      )}
                      {aboutError.includes('rate limit') && (
                        <p>💡 Please wait a moment before trying again</p>
                      )}
                      {aboutError.includes('server error') && (
                        <p>💡 The AI service encountered an issue - please try again</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        clearAboutError()
                        if (content?.summary) {
                          handleEnhanceAbout()
                        } else {
                          handleGenerateAbout()
                        }
                      }}
                      disabled={isGenerating || isGeneratingVariations || isEnhancingAbout}
                    >
                      Retry
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-2 text-xs"
                      onClick={clearAboutError}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <button onClick={clearError} className="ml-2 text-sm underline">
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Section Editor */}
          <div>
        {activeSection === 'contact' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span>
                Contact Information
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-auto gap-1"
                  onClick={() => handleAIEnhance('contact')}
                  disabled={enhancingSection === 'contact'}
                >
                  {enhancingSection === 'contact' ? (
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {enhancingSection === 'contact' ? 'Enhancing...' : 'AI Enhance'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={content.contact.name || ''}
                    onChange={(e) => updateContact('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={content.contact.email || ''}
                    onChange={(e) => updateContact('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={content.contact.phone || ''}
                    onChange={(e) => updateContact('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={content.contact.location || ''}
                    onChange={(e) => updateContact('location', e.target.value)}
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={content.contact.linkedin || ''}
                    onChange={(e) => updateContact('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={content.contact.github || ''}
                    onChange={(e) => updateContact('github', e.target.value)}
                    placeholder="github.com/yourusername"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'about' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📝</span>
                About
                {(isGenerating || isGeneratingVariations || isEnhancingAbout) && (
                  <div className="ml-2 flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 rounded-full">
                    <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {isGenerating && 'Generating new content...'}
                      {isGeneratingVariations && 'Creating variations...'}
                      {isEnhancingAbout && 'Enhancing existing content...'}
                    </span>
                  </div>
                )}
                <div className="ml-auto flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={handleGenerateAbout}
                    disabled={isGenerating || isGeneratingVariations || isEnhancingAbout}
                  >
                    {isGenerating ? (
                      <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                  {content?.summary && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={handleEnhanceAbout}
                      disabled={isGenerating || isGeneratingVariations || isEnhancingAbout}
                    >
                      {isEnhancingAbout ? (
                        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {isEnhancingAbout ? 'Enhancing...' : 'Enhance'}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={handleGenerateVariations}
                    disabled={isGenerating || isGeneratingVariations || isEnhancingAbout}
                  >
                    {isGeneratingVariations ? (
                      <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    {isGeneratingVariations ? 'Generating...' : 'Variations'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Label htmlFor="about">About Section</Label>
                <div className="relative">
                  <Textarea
                    id="about"
                    value={content.summary || ''}
                    onChange={(e) => updateSummary(e.target.value)}
                    placeholder={isGenerating || isGeneratingVariations || isEnhancingAbout 
                      ? "AI is working on your content..." 
                      : "Generate a professional LinkedIn-style about section using AI, or write your own compelling introduction that highlights your unique value proposition..."
                    }
                    className={cn(
                      "min-h-32 transition-opacity",
                      (isGenerating || isGeneratingVariations || isEnhancingAbout) && "opacity-50"
                    )}
                    disabled={isGenerating || isGeneratingVariations || isEnhancingAbout}
                  />
                  {(isGenerating || isGeneratingVariations || isEnhancingAbout) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-primary">
                            {isGenerating && '✨ Generating fresh content...'}
                            {isGeneratingVariations && '🔄 Creating multiple variations...'}
                            {isEnhancingAbout && '⚡ Enhancing your content...'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            This may take a few moments
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {content?.summary ? `${content.summary.split(/\s+/).length} words` : '0 words'} 
                    {content?.summary && content.summary.length > 0 && (
                      <span className="ml-2">
                        (Recommended: 100-150 words for LinkedIn)
                      </span>
                    )}
                  </p>
                  {lastResult && (
                    <p className="text-xs text-green-600">
                      Last generated: {(() => {
                        try {
                          const generatedAt = lastResult.generatedAt instanceof Date 
                            ? lastResult.generatedAt 
                            : new Date(lastResult.generatedAt);
                          
                          // Check if the date is valid
                          if (isNaN(generatedAt.getTime())) {
                            return 'Recently';
                          }
                          
                          return generatedAt.toLocaleTimeString();
                        } catch (error) {
                          console.warn('Failed to format generatedAt:', error);
                          return 'Recently';
                        }
                      })()}
                    </p>
                  )}
                </div>
              </div>

              {/* About Generation Variations */}
              {showVariations && variations.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Choose from AI-generated variations:</h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setShowVariations(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {variations.map((variation, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Option {index + 1}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {variation.wordCount} words
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={() => navigator.clipboard.writeText(variation.aboutText)}
                              title="Copy to clipboard"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="h-6 px-2 text-xs"
                              onClick={() => handleSelectVariation(variation)}
                            >
                              Use This
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {variation.aboutText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips for writing About section */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">
                  💡 About Section Tips
                </h4>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Use first person perspective (&quot;I&quot; statements)</li>
                  <li>• Highlight your unique value proposition</li>
                  <li>• Include 2-3 key achievements with numbers if possible</li>
                  <li>• End with your career goals or what you&apos;re seeking</li>
                  <li>• Keep it conversational but professional</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'experience' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💼</span>
                Work Experience
                <Button size="sm" onClick={addExperience} className="ml-auto gap-1">
                  <Plus className="h-3 w-3" />
                  Add Experience
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {content.experience.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Experience {index + 1}</h4>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => handleAIEnhance('experience')}
                        disabled={enhancingSection === 'experience'}
                      >
                        {enhancingSection === 'experience' ? (
                          <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {enhancingSection === 'experience' ? 'Enhancing...' : 'AI Enhance'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeExperience(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Job Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        placeholder="Tech Company Inc."
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        value={exp.startDate || ''}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        placeholder="Jan 2020"
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        value={exp.endDate || ''}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        placeholder="Present"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Role Description</Label>
                    <Input
                      value={exp.description || ''}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder="Brief overview of your role"
                    />
                  </div>
                  <div>
                    <Label>Key Achievements</Label>
                    <Textarea
                      value={formatAchievements(exp.achievements)}
                      onChange={(e) => updateExperience(index, 'achievements', parseAchievements(e.target.value))}
                      placeholder="• Achievement 1&#10;• Achievement 2&#10;• Achievement 3"
                      className="min-h-32"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeSection === 'education' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎓</span>
                Education
                <Button size="sm" onClick={addEducation} className="ml-auto gap-1">
                  <Plus className="h-3 w-3" />
                  Add Education
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.education.map((edu, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Education {index + 1}</h4>
                    <Button size="sm" variant="outline" onClick={() => removeEducation(index)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Bachelor of Science in Computer Science"
                      />
                    </div>
                    <div>
                      <Label>School</Label>
                      <Input
                        value={edu.school}
                        onChange={(e) => updateEducation(index, 'school', e.target.value)}
                        placeholder="University Name"
                      />
                    </div>
                    <div>
                      <Label>Graduation Year</Label>
                      <Input
                        value={edu.graduationDate || ''}
                        onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                        placeholder="2020"
                      />
                    </div>
                    <div>
                      <Label>GPA (Optional)</Label>
                      <Input
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                        placeholder="3.8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeSection === 'skills' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔧</span>
                Skills
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-auto gap-1"
                  onClick={() => handleAIEnhance('skills')}
                  disabled={enhancingSection === 'skills'}
                >
                  {enhancingSection === 'skills' ? (
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {enhancingSection === 'skills' ? 'Enhancing...' : 'AI Enhance'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Skills (comma-separated)</Label>
                <Textarea
                  value={content.skills.join(', ')}
                  onChange={(e) => updateSkills(e.target.value)}
                  placeholder="JavaScript, React, Node.js, Python, SQL, Git..."
                  className="min-h-24"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {content.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'projects' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🚀</span>
                Projects
                <Button size="sm" onClick={addProject} className="ml-auto gap-1">
                  <Plus className="h-3 w-3" />
                  Add Project
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(content.projects || []).map((project, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Project {index + 1}</h4>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => handleAIEnhance('projects')}
                        disabled={enhancingSection === 'projects'}
                      >
                        {enhancingSection === 'projects' ? (
                          <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {enhancingSection === 'projects' ? 'Enhancing...' : 'AI Enhance'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeProject(index)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Project Name</Label>
                      <Input
                        value={project.name}
                        onChange={(e) => updateProject(index, 'name', e.target.value)}
                        placeholder="Project Name"
                      />
                    </div>
                    <div>
                      <Label>Project URL</Label>
                      <Input
                        value={project.url || ''}
                        onChange={(e) => updateProject(index, 'url', e.target.value)}
                        placeholder="https://github.com/username/project"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Project Overview</Label>
                    <Input
                      value={project.description}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      placeholder="Brief project description"
                    />
                  </div>
                  <div>
                    <Label>Key Features/Accomplishments</Label>
                    <Textarea
                      value={formatAchievements(project.details)}
                      onChange={(e) => updateProject(index, 'details', parseAchievements(e.target.value))}
                      placeholder="• Feature 1&#10;• Feature 2&#10;• Accomplishment 3"
                      className="min-h-24"
                    />
                  </div>
                  <div>
                    <Label>Technologies Used</Label>
                    <Input
                      value={project.technologies?.join(', ') || ''}
                      onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0))}
                      placeholder="React, Node.js, PostgreSQL"
                    />
                  </div>
                </div>
              ))}
              {(content.projects || []).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No projects added yet.</p>
                  <p className="text-sm text-muted-foreground">Click &quot;Add Project&quot; to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </div>
        </div>
        </div>
      </div>

      {/* Open Enhancement Lab Button - positioned on right side when collapsed */}
      {!showEnhancementLab && (
        <div className="fixed right-0 top-1/3 transform -translate-y-1/2 z-10">
          <div className="group relative">
            {/* Main Button */}
            <button
              onClick={() => setShowEnhancementLab(true)}
              className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white p-0.5 rounded-l-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
              title="Open AI Enhancement Lab"
            >
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 rounded-l-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              
              {/* Button Content */}
              <div className="relative bg-gray-900/90 backdrop-blur-sm rounded-l-lg px-2 py-4 flex flex-col items-center gap-1 min-w-[32px] min-h-[32px]">
                {/* Sparkles Icon with Animation */}
                <div className="relative">
                  <Sparkles className="h-4 w-4 text-white group-hover:text-purple-200 transition-colors duration-300" />
                  <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-110 transition-transform duration-300"></div>
                </div>
                
                {/* Magic Wand Animation Dot */}
                <div className="absolute -top-1 -right-1">
                  <div className="relative">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
              </div>
              
              {/* Arrow Indicator */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
                <div className="w-0 h-0 border-t-3 border-b-3 border-r-4 border-transparent border-r-white/20 group-hover:border-r-purple-200 transition-colors duration-300"></div>
              </div>
            </button>
            
            
          </div>
        </div>
      )}

      {/* AI Enhancement Lab with Resizable Handle */}
      {showEnhancementLab && (
        <>
          <div 
            className="absolute top-0 z-50"
            style={{ right: `${aiPanelWidth}px` }}
          >
            <ResizableHandle
              onMouseDown={handleResizeMouseDown}
              isResizing={isResizing}
              position="left"
            />
          </div>
          <AIEnhancementLab
            isOpen={showEnhancementLab}
            onClose={handleCloseEnhancementLab}
            resumeContent={content}
            onApplyEnhancement={applyEnhancedContent}
            onApplyField={applyEnhancedField}
            activeSection={activeSection}
            width={aiPanelWidth}
            onResetWidth={resetAIPanelWidth}
          />
        </>
      )}
    </div>
  )
}