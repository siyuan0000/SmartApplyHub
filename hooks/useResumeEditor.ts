import { create } from 'zustand'
import { ResumeContent, ResumeExperience, ResumeEducation, ResumeProject } from '@/lib/resume/parser'
import { ResumeService } from '@/lib/resume/service'
import { saveLogger } from '@/lib/debug/save-logger'

interface ResumeEditorState {
  // Core state
  content: ResumeContent | null
  savedContent: ResumeContent | null
  loading: boolean
  saving: boolean
  error: string | null
  resumeId: string | null
  autoSaveEnabled: boolean
  lastAutoSave: number | null
  isUndoRedoAction: boolean
  
  // Actions
  loadResume: (id: string) => Promise<void>
  updateContent: (content: ResumeContent, skipHistory?: boolean) => void
  saveResume: (retryCount?: number) => Promise<void>
  resetChanges: () => void
  clearError: () => void
  enableAutoSave: () => void
  disableAutoSave: () => void
  validateContent: (content: ResumeContent) => string[]
  forceSave: () => Promise<void>
  
  // Section-specific updates
  updateContact: (field: string, value: string) => void
  updateSummary: (summary: string) => void
  updateExperience: (index: number, field: string, value: string | string[]) => void
  addExperience: () => void
  removeExperience: (index: number) => void
  updateEducation: (index: number, field: string, value: string) => void
  addEducation: () => void
  removeEducation: (index: number) => void
  updateSkills: (skills: string) => void
  updateProject: (index: number, field: string, value: string | string[]) => void
  addProject: () => void
  removeProject: (index: number) => void
  
  // AI Enhancement specific
  applyAIEnhancement: (fieldPath: string, value: string) => Promise<void>
}

// Helper functions for bullet point handling
const formatAchievements = (achievements: string[] = []): string => {
  return achievements.map(a => `• ${a}`).join('\n')
}

const parseAchievements = (text: string): string[] => {
  return text.split('\n')
    .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter(line => line.length > 0)
}

// Auto-save interval (5 minutes)
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000

let autoSaveTimer: NodeJS.Timeout | null = null

export const useResumeEditor = create<ResumeEditorState>((set, get) => ({
  // Initial state
  content: null,
  savedContent: null,
  loading: false,
  saving: false,
  error: null,
  resumeId: null,
  autoSaveEnabled: false,
  lastAutoSave: null,
  isUndoRedoAction: false,
  
  // Load resume from database
  loadResume: async (id: string) => {
    set({ loading: true, error: null, resumeId: id })
    try {
      const resume = await ResumeService.getResume(id)
      if (resume) {
        const content = ResumeService.parseResumeContent(resume)
        
        
        set({ 
          content,
          savedContent: structuredClone(content), // Deep copy for comparison
          loading: false 
        })
      } else {
        set({ error: 'Resume not found', loading: false })
      }
    } catch (error) {
      console.error('Failed to load resume:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load resume',
        loading: false 
      })
    }
  },
  
  // Update entire content
  updateContent: (content: ResumeContent) => {
    set({ content })
  },
  
  // Save changes to database with retry logic
  saveResume: async (retryCount = 0, sessionId?: string) => {
    const { content, savedContent, resumeId } = get()
    
    // Create or use existing session ID
    const currentSessionId = sessionId || saveLogger.generateSessionId()
    if (!sessionId) {
      // Only start new session if no sessionId provided
      saveLogger.startSession(currentSessionId, resumeId, undefined)
    }
    
    const stepStartTime = Date.now()
    saveLogger.logStep(currentSessionId, 'hook_save_resume', 'start', { 
      hasContent: !!content,
      hasResumeId: !!resumeId,
      retryCount 
    })
    
    if (!content || !resumeId) {
      const error = 'Cannot save: missing content or resumeId'
      saveLogger.logStep(currentSessionId, 'hook_validation_failed', 'error', { 
        content: !!content, 
        resumeId 
      }, error)
      console.warn('❌ Cannot save: missing content or resumeId', { content: !!content, resumeId })
      if (!sessionId) saveLogger.endSession(currentSessionId, 'error')
      return
    }
    
    // Check if content has actually changed
    const isDirtyCheck = JSON.stringify(content) !== JSON.stringify(savedContent)
    saveLogger.logStep(currentSessionId, 'hook_dirty_check', 'success', {
      resumeId, 
      retryCount, 
      contentSize: JSON.stringify(content).length,
      isDirty: isDirtyCheck,
      summaryPreview: content.summary?.substring(0, 50) + '...',
      skillsCount: content.skills?.length || 0
    })
    
    set({ saving: true, error: null })
    saveLogger.logStep(currentSessionId, 'hook_set_saving_state', 'success')
    
    try {
      // Validate content before saving
      saveLogger.logStep(currentSessionId, 'hook_content_validation', 'start')
      if (!content.contact || typeof content.contact !== 'object') {
        throw new Error('Invalid resume content: missing or invalid contact information')
      }
      saveLogger.logStep(currentSessionId, 'hook_content_validation', 'success')
      
      // Create a deep copy to prevent mutation during save
      const contentToSave = structuredClone(content)
      saveLogger.logStep(currentSessionId, 'hook_content_clone', 'success', {
        contentSample: {
          summary: contentToSave.summary?.substring(0, 100),
          skillsCount: contentToSave.skills?.length,
          contactName: contentToSave.contact?.name,
          experienceCount: contentToSave.experience?.length || 0
        }
      })
      
      saveLogger.logStep(currentSessionId, 'hook_calling_service', 'start')
      const serviceStartTime = Date.now()
      const savedResume = await ResumeService.updateResume(resumeId, { content: contentToSave }, currentSessionId)
      saveLogger.logStep(currentSessionId, 'hook_service_complete', 'success', {
        id: savedResume.id,
        updatedAt: savedResume.updated_at,
        version: savedResume.version
      }, undefined, serviceStartTime)
      
      set({ 
        savedContent: structuredClone(content), // Update saved state
        saving: false,
        error: null,
        lastAutoSave: Date.now()
      })
      saveLogger.logStep(currentSessionId, 'hook_state_updated', 'success', undefined, undefined, stepStartTime)
      
      if (!sessionId) saveLogger.endSession(currentSessionId, 'success')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save resume'
      
      saveLogger.logStep(currentSessionId, 'hook_save_error', 'error', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        resumeId,
        contentKeys: Object.keys(content),
        retryCount
      }, errorMessage)
      
      // Retry logic for network errors
      if (retryCount < 2 && (
        errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('fetch')
      )) {
        saveLogger.logStep(currentSessionId, 'hook_retry_attempt', 'start', { 
          retryCount: retryCount + 1,
          reason: 'network_timeout_or_fetch_error'
        })
        
        // Wait progressively longer between retries
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
        
        set({ saving: false }) // Reset saving state temporarily
        return get().saveResume(retryCount + 1, currentSessionId) // Pass session ID for continuity
      }
      
      // Handle different error types
      let userFriendlyError = errorMessage
      if (errorMessage.includes('authentication') || errorMessage.includes('session')) {
        userFriendlyError = 'Session expired. Please refresh the page and try again.'
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyError = 'Network error. Please check your connection and try again.'
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'Request timed out. Please try again.'
      }
      
      set({ 
        error: userFriendlyError,
        saving: false 
      })
      
      if (!sessionId) saveLogger.endSession(currentSessionId, 'error')
      
      // Re-throw to allow upper-level error handling
      throw error
    }
  },
  
  // Reset changes to last saved state
  resetChanges: () => {
    const { savedContent } = get()
    if (savedContent) {
      set({ content: structuredClone(savedContent) })
    }
  },
  
  // Clear error state
  clearError: () => {
    set({ error: null })
  },
  
  
  // Force save (for manual save button)
  forceSave: async (sessionId?: string) => {
    const { saveResume } = get()
    await saveResume(0, sessionId) // Pass sessionId for continuity
  },
  
  // Enable auto-save
  enableAutoSave: () => {
    const state = get()
    if (!state.autoSaveEnabled && state.resumeId) {
      console.log('✅ Auto-save enabled')
      set({ autoSaveEnabled: true })
      
      // Set up auto-save timer
      if (autoSaveTimer) clearInterval(autoSaveTimer)
      autoSaveTimer = setInterval(() => {
        const currentState = get()
        const { isDirty } = useResumeEditorComputed.getState()
        
        if (currentState.autoSaveEnabled && isDirty && !currentState.saving && currentState.content) {
          console.log('💾 Auto-saving resume...')
          currentState.saveResume().then(() => {
            set({ lastAutoSave: Date.now() })
          })
        }
      }, AUTO_SAVE_INTERVAL)
    }
  },
  
  // Disable auto-save
  disableAutoSave: () => {
    console.log('❌ Auto-save disabled')
    set({ autoSaveEnabled: false })
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  },
  
  // Validate resume content
  validateContent: (content: ResumeContent) => {
    const errors: string[] = []
    
    // Validate contact information
    if (!content.contact) {
      errors.push('Contact information is required')
    } else {
      if (!content.contact.email || !content.contact.email.includes('@')) {
        errors.push('Valid email address is required')
      }
      if (!content.contact.name || content.contact.name.trim().length < 2) {
        errors.push('Full name is required')
      }
    }
    
    // Validate experience
    if (content.experience?.length > 0) {
      content.experience.forEach((exp, index) => {
        if (!exp.title || exp.title.trim().length === 0) {
          errors.push(`Experience ${index + 1}: Job title is required`)
        }
        if (!exp.company || exp.company.trim().length === 0) {
          errors.push(`Experience ${index + 1}: Company name is required`)
        }
      })
    }
    
    // Validate education
    if (content.education?.length > 0) {
      content.education.forEach((edu, index) => {
        if (!edu.degree || edu.degree.trim().length === 0) {
          errors.push(`Education ${index + 1}: Degree is required`)
        }
        if (!edu.school || edu.school.trim().length === 0) {
          errors.push(`Education ${index + 1}: School name is required`)
        }
      })
    }
    
    // Validate skills
    if (!content.skills || content.skills.length === 0) {
      errors.push('At least one skill is required')
    }
    
    return errors
  },
  
  // AI Enhancement specific
  applyAIEnhancement: async (fieldPath: string, value: string) => {
    const { content, updateContent, forceSave, resumeId } = get()
    if (!content) {
      console.error('❌ applyAIEnhancement: No content available')
      return
    }
    if (!resumeId) {
      console.error('❌ applyAIEnhancement: No resumeId available')
      return
    }
    
    const pathParts = fieldPath.split('.')
    let updatedContent = structuredClone(content)
    
    console.log('🔄 Applying AI enhancement:', { fieldPath, value: value.substring(0, 100) + '...', resumeId })
    
    try {
      if (pathParts[0] === 'contact') {
        updatedContent.contact = { ...updatedContent.contact, [pathParts[1]]: value }
      } else if (pathParts[0] === 'summary') {
        updatedContent.summary = value
      } else if (pathParts[0] === 'skills') {
        const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0)
        updatedContent.skills = skillsArray
      } else if (pathParts[0] === 'experience') {
        const index = parseInt(pathParts[1])
        const field = pathParts[2]
        
        if (field === 'achievements') {
          const achievements = value.split('\n').map(a => a.replace(/^\u2022\s*/, '').trim()).filter(a => a)
          updatedContent.experience[index] = { ...updatedContent.experience[index], achievements }
        } else {
          updatedContent.experience[index] = { ...updatedContent.experience[index], [field]: value }
        }
      } else if (pathParts[0] === 'education') {
        const index = parseInt(pathParts[1])
        const field = pathParts[2]
        updatedContent.education[index] = { ...updatedContent.education[index], [field]: value }
      } else if (pathParts[0] === 'projects') {
        const index = parseInt(pathParts[1])
        const field = pathParts[2]
        
        if (field === 'details') {
          const details = value.split('\n').map(d => d.replace(/^\u2022\s*/, '').trim()).filter(d => d)
          updatedContent.projects![index] = { ...updatedContent.projects![index], details }
        } else if (field === 'technologies') {
          const technologies = value.split(',').map(t => t.trim()).filter(t => t)
          updatedContent.projects![index] = { ...updatedContent.projects![index], technologies }
        } else {
          updatedContent.projects![index] = { ...updatedContent.projects![index], [field]: value }
        }
      }
      
      console.log('🔄 Updating content and force saving...')
      
      // Update content with deep copy to ensure React detects changes
      updateContent(updatedContent)
      
      // Force save to immediately persist changes
      await forceSave()
      
      console.log('✅ AI Enhancement applied and saved successfully:', fieldPath)
      
    } catch (error) {
      console.error(`❌ Failed to apply AI enhancement to ${fieldPath}:`, error)
      // Log additional error details
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          resumeId,
          fieldPath,
          contentKeys: Object.keys(content)
        })
      }
      throw error
    }
  },
  
  // Section-specific update methods
  updateContact: (field: string, value: string) => {
    const { content, updateContent } = get()
    if (!content) return
    
    const updatedContent = {
      ...content,
      contact: { ...content.contact, [field]: value }
    }
    
    updateContent(updatedContent)
  },
  
  updateSummary: (summary: string) => {
    const { content, updateContent } = get()
    if (!content) return
    
    const updatedContent = { ...content, summary }
    updateContent(updatedContent)
  },
  
  updateExperience: (index: number, field: string, value: string | string[]) => {
    const { content, updateContent } = get()
    if (!content) return
    
    const updatedExperience = [...content.experience]
    updatedExperience[index] = { ...updatedExperience[index], [field]: value }
    
    const updatedContent = { ...content, experience: updatedExperience }
    updateContent(updatedContent)
  },
  
  addExperience: () => {
    const { content, updateContent } = get()
    if (!content) return
    
    const newExperience: ResumeExperience = {
      title: '',
      company: '',
      description: ''
    }
    
    const updatedContent = {
      ...content,
      experience: [...content.experience, newExperience]
    }
    
    updateContent(updatedContent)
  },
  
  removeExperience: (index: number) => {
    const { content, updateContent } = get()
    if (!content) return
    
    const updatedContent = {
      ...content,
      experience: content.experience.filter((_, i) => i !== index)
    }
    
    updateContent(updatedContent)
  },
  
  updateEducation: (index: number, field: string, value: string) => {
    const { content } = get()
    if (!content) return
    
    const updatedEducation = [...content.education]
    updatedEducation[index] = { ...updatedEducation[index], [field]: value }
    
    set({
      content: { ...content, education: updatedEducation }
    })
  },
  
  addEducation: () => {
    const { content } = get()
    if (!content) return
    
    const newEducation: ResumeEducation = {
      degree: '',
      school: ''
    }
    
    set({
      content: {
        ...content,
        education: [...content.education, newEducation]
      }
    })
  },
  
  removeEducation: (index: number) => {
    const { content } = get()
    if (!content) return
    
    set({
      content: {
        ...content,
        education: content.education.filter((_, i) => i !== index)
      }
    })
  },
  
  updateSkills: (skills: string) => {
    const { content, updateContent } = get()
    if (!content) return
    
    const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0)
    
    const updatedContent = { ...content, skills: skillsArray }
    updateContent(updatedContent)
  },
  
  updateProject: (index: number, field: string, value: string | string[]) => {
    const { content } = get()
    if (!content) return
    
    const updatedProjects = [...(content.projects || [])]
    updatedProjects[index] = { ...updatedProjects[index], [field]: value }
    
    set({
      content: { ...content, projects: updatedProjects }
    })
  },
  
  addProject: () => {
    const { content } = get()
    if (!content) return
    
    const newProject: ResumeProject = {
      name: '',
      description: '',
      details: [],
      technologies: []
    }
    
    set({
      content: {
        ...content,
        projects: [...(content.projects || []), newProject]
      }
    })
  },
  
  removeProject: (index: number) => {
    const { content } = get()
    if (!content) return
    
    set({
      content: {
        ...content,
        projects: (content.projects || []).filter((_, i) => i !== index)
      }
    })
  }
}))

// Hook to get computed values
export const useResumeEditorComputed = () => {
  const { 
    content, 
    savedContent, 
    autoSaveEnabled, 
    lastAutoSave, 
    saving,
    validateContent 
  } = useResumeEditor()
  
  const isDirty = (() => {
    if (!content || !savedContent) return false
    return JSON.stringify(content) !== JSON.stringify(savedContent)
  })()
  
  const validationErrors = (() => {
    if (!content) return []
    return validateContent(content)
  })()
  
  const isValid = validationErrors.length === 0
  
  const autoSaveStatus = (() => {
    if (!autoSaveEnabled) return 'disabled'
    if (saving) return 'saving'
    if (!isDirty) return 'up-to-date'
    if (lastAutoSave && Date.now() - lastAutoSave < AUTO_SAVE_INTERVAL) return 'recent'
    return 'pending'
  })()
  
  const nextAutoSave = (() => {
    if (!autoSaveEnabled || !lastAutoSave) return null
    const nextSave = lastAutoSave + AUTO_SAVE_INTERVAL
    return Math.max(0, nextSave - Date.now())
  })()
  
  return { 
    isDirty, 
    validationErrors, 
    isValid,
    autoSaveStatus,
    nextAutoSave
  }
}

// Export helper functions for use in components
export { formatAchievements, parseAchievements }