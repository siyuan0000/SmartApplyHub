import { create } from 'zustand'
import { Database } from '@/types/database.types'
import { ResumeContent } from '@/lib/resume/parser'
import { AIGeneratedEmail } from '@/lib/ai/email-generator'

type JobPosting = Database['public']['Tables']['job_postings']['Row']
type Resume = Database['public']['Tables']['resumes']['Row'] & {
  content: ResumeContent
}

const SESSION_STORAGE_KEY = 'application_workflow_data'

interface SessionStorageData {
  selectedJob: JobPosting | null
  selectedResume: Resume | null
  emailOptions: {
    tone: 'professional' | 'friendly' | 'formal'
    includeAttachments: boolean
    customInstructions: string
  }
}

// Session storage utilities
const saveToSessionStorage = (data: SessionStorageData) => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save to sessionStorage:', error)
    }
  }
}

const loadFromSessionStorage = (): SessionStorageData | null => {
  if (typeof window !== 'undefined') {
    try {
      const data = sessionStorage.getItem(SESSION_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Failed to load from sessionStorage:', error)
      return null
    }
  }
  return null
}

const clearSessionStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error)
    }
  }
}

export interface ApplicationWorkflowStep {
  id: 'job-selection' | 'resume-selection' | 'email-generation' | 'submission'
  title: string
  description: string
  completed: boolean
  canSkip: boolean
}

interface ApplicationWorkflowState {
  // Modal state
  isOpen: boolean
  currentStep: number
  steps: ApplicationWorkflowStep[]
  
  // Data state
  selectedJob: JobPosting | null
  selectedResume: Resume | null
  generatedEmail: AIGeneratedEmail | null
  emailOptions: {
    tone: 'professional' | 'friendly' | 'formal'
    includeAttachments: boolean
    customInstructions: string
  }
  
  // Loading states
  isGeneratingEmail: boolean
  isSubmittingApplication: boolean
  
  // Error state
  error: string | null
  
  // Actions
  openWorkflow: (jobPosting?: JobPosting) => void
  closeWorkflow: () => void
  resetWorkflow: () => void
  
  // Session storage actions
  loadFromSession: () => void
  saveToSession: () => void
  clearSession: () => void
  
  // Step navigation
  nextStep: () => void
  prevStep: () => void
  goToStep: (stepIndex: number) => void
  completeCurrentStep: () => void
  
  // Data actions
  setSelectedJob: (job: JobPosting | null) => void
  setSelectedResume: (resume: Resume | null) => void
  setGeneratedEmail: (email: AIGeneratedEmail | null) => void
  setEmailOptions: (options: Partial<ApplicationWorkflowState['emailOptions']>) => void
  
  // Loading actions
  setGeneratingEmail: (loading: boolean) => void
  setSubmittingApplication: (loading: boolean) => void
  
  // Error actions
  setError: (error: string | null) => void
  clearError: () => void
  
  // Computed getters
  canProceedToNext: () => boolean
  getCurrentStepData: () => ApplicationWorkflowStep
  getProgress: () => number
}

const defaultSteps: ApplicationWorkflowStep[] = [
  {
    id: 'job-selection',
    title: 'Select Job',
    description: 'Choose the job you want to apply for',
    completed: false,
    canSkip: false
  },
  {
    id: 'resume-selection',
    title: 'Select Resume',
    description: 'Choose which resume to use for this application',
    completed: false,
    canSkip: false
  },
  {
    id: 'email-generation',
    title: 'Generate Application',
    description: 'AI will create a personalized application email',
    completed: false,
    canSkip: false
  },
  {
    id: 'submission',
    title: 'Review & Submit',
    description: 'Review your application and submit it',
    completed: false,
    canSkip: false
  }
]

export const useApplicationWorkflowStore = create<ApplicationWorkflowState>((set, get) => ({
  // Initial state
  isOpen: false,
  currentStep: 0,
  steps: [...defaultSteps],
  
  selectedJob: null,
  selectedResume: null,
  generatedEmail: null,
  emailOptions: {
    tone: 'professional',
    includeAttachments: true,
    customInstructions: ''
  },
  
  isGeneratingEmail: false,
  isSubmittingApplication: false,
  error: null,
  
  // Workflow control actions
  openWorkflow: (jobPosting?: JobPosting) => {
    const newSteps = [...defaultSteps]
    let startStep = 0
    
    // If job is provided, mark first step as completed and start from resume selection
    if (jobPosting) {
      newSteps[0].completed = true
      startStep = 1
    }
    
    set({
      isOpen: true,
      currentStep: startStep,
      steps: newSteps,
      selectedJob: jobPosting || null,
      selectedResume: null,
      generatedEmail: null,
      error: null
    })
  },
  
  closeWorkflow: () => {
    set({ isOpen: false })
    get().clearSession()
  },
  
  resetWorkflow: () => {
    set({
      isOpen: false,
      currentStep: 0,
      steps: [...defaultSteps],
      selectedJob: null,
      selectedResume: null,
      generatedEmail: null,
      emailOptions: {
        tone: 'professional',
        includeAttachments: true,
        customInstructions: ''
      },
      isGeneratingEmail: false,
      isSubmittingApplication: false,
      error: null
    })
    get().clearSession()
  },
  
  // Step navigation
  nextStep: () => {
    const { currentStep, steps } = get()
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 })
    }
  },
  
  prevStep: () => {
    const { currentStep } = get()
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 })
    }
  },
  
  goToStep: (stepIndex: number) => {
    const { steps } = get()
    if (stepIndex >= 0 && stepIndex < steps.length) {
      set({ currentStep: stepIndex })
    }
  },
  
  completeCurrentStep: () => {
    const { currentStep, steps } = get()
    const updatedSteps = [...steps]
    if (updatedSteps[currentStep]) {
      updatedSteps[currentStep].completed = true
    }
    set({ steps: updatedSteps })
  },
  
  // Data actions
  setSelectedJob: (job: JobPosting | null) => {
    set({ selectedJob: job })
    if (job) {
      get().completeCurrentStep()
    }
    get().saveToSession()
  },
  
  setSelectedResume: (resume: Resume | null) => {
    set({ selectedResume: resume })
    if (resume) {
      get().completeCurrentStep()
    }
    get().saveToSession()
  },
  
  setGeneratedEmail: (email: AIGeneratedEmail | null) => {
    set({ generatedEmail: email })
    if (email) {
      get().completeCurrentStep()
    }
  },
  
  setEmailOptions: (options: Partial<ApplicationWorkflowState['emailOptions']>) => {
    set(state => ({
      emailOptions: { ...state.emailOptions, ...options }
    }))
    get().saveToSession()
  },
  
  // Loading actions
  setGeneratingEmail: (loading: boolean) => {
    set({ isGeneratingEmail: loading })
  },
  
  setSubmittingApplication: (loading: boolean) => {
    set({ isSubmittingApplication: loading })
  },
  
  // Error actions
  setError: (error: string | null) => {
    set({ error })
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  // Computed getters
  canProceedToNext: () => {
    const { currentStep, selectedJob, selectedResume, generatedEmail } = get()
    
    switch (currentStep) {
      case 0: // job-selection
        return selectedJob !== null
      case 1: // resume-selection
        return selectedResume !== null
      case 2: // email-generation
        return generatedEmail !== null
      case 3: // submission
        return true // Always can proceed from submission (it's the last step)
      default:
        return false
    }
  },
  
  getCurrentStepData: () => {
    const { currentStep, steps } = get()
    return steps[currentStep] || steps[0]
  },
  
  getProgress: () => {
    const { steps } = get()
    const completedSteps = steps.filter(step => step.completed).length
    return (completedSteps / steps.length) * 100
  },
  
  // Session storage methods
  loadFromSession: () => {
    const sessionData = loadFromSessionStorage()
    if (sessionData) {
      set({
        selectedJob: sessionData.selectedJob,
        selectedResume: sessionData.selectedResume,
        emailOptions: sessionData.emailOptions
      })
    }
  },
  
  saveToSession: () => {
    const { selectedJob, selectedResume, emailOptions } = get()
    saveToSessionStorage({
      selectedJob,
      selectedResume,
      emailOptions
    })
  },
  
  clearSession: () => {
    clearSessionStorage()
  }
}))