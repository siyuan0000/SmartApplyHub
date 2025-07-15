import { create } from 'zustand'
import { ResumeContent, ResumeExperience, ResumeEducation, ResumeProject } from '@/lib/resume/parser'
import { ResumeService } from '@/lib/resume/service'

interface ResumeEditorState {
  // Core state
  content: ResumeContent | null
  savedContent: ResumeContent | null
  loading: boolean
  saving: boolean
  error: string | null
  resumeId: string | null
  
  // Actions
  loadResume: (id: string) => Promise<void>
  updateContent: (content: ResumeContent) => void
  saveResume: () => Promise<void>
  resetChanges: () => void
  clearError: () => void
  
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

export const useResumeEditor = create<ResumeEditorState>((set, get) => ({
  // Initial state
  content: null,
  savedContent: null,
  loading: false,
  saving: false,
  error: null,
  resumeId: null,
  
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
  
  // Save changes to database
  saveResume: async () => {
    const { content, resumeId } = get()
    if (!content || !resumeId) return
    
    set({ saving: true, error: null })
    try {
      await ResumeService.updateResume(resumeId, { content })
      set({ 
        savedContent: structuredClone(content), // Update saved state
        saving: false 
      })
    } catch (error) {
      console.error('Failed to save resume:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save resume',
        saving: false 
      })
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
  
  // Section-specific update methods
  updateContact: (field: string, value: string) => {
    const { content } = get()
    if (!content) return
    
    set({
      content: {
        ...content,
        contact: { ...content.contact, [field]: value }
      }
    })
  },
  
  updateSummary: (summary: string) => {
    const { content } = get()
    if (!content) return
    
    set({
      content: { ...content, summary }
    })
  },
  
  updateExperience: (index: number, field: string, value: string | string[]) => {
    const { content } = get()
    if (!content) return
    
    const updatedExperience = [...content.experience]
    updatedExperience[index] = { ...updatedExperience[index], [field]: value }
    
    set({
      content: { ...content, experience: updatedExperience }
    })
  },
  
  addExperience: () => {
    const { content } = get()
    if (!content) return
    
    const newExperience: ResumeExperience = {
      title: '',
      company: '',
      description: ''
    }
    
    set({
      content: {
        ...content,
        experience: [...content.experience, newExperience]
      }
    })
  },
  
  removeExperience: (index: number) => {
    const { content } = get()
    if (!content) return
    
    set({
      content: {
        ...content,
        experience: content.experience.filter((_, i) => i !== index)
      }
    })
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
    const { content } = get()
    if (!content) return
    
    const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0)
    
    set({
      content: { ...content, skills: skillsArray }
    })
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
  const { content, savedContent } = useResumeEditor()
  
  const isDirty = (() => {
    if (!content || !savedContent) return false
    return JSON.stringify(content) !== JSON.stringify(savedContent)
  })()
  
  return { isDirty }
}

// Export helper functions for use in components
export { formatAchievements, parseAchievements }