import { create } from 'zustand'
import { ResumeContent } from '@/lib/resume/parser'

interface HistoryEntry {
  content: ResumeContent
  timestamp: number
  action: string
  description?: string
}

interface ResumeHistoryState {
  history: HistoryEntry[]
  currentIndex: number
  maxHistorySize: number
  
  // Actions
  addToHistory: (content: ResumeContent, action: string, description?: string) => void
  undo: () => ResumeContent | null
  redo: () => ResumeContent | null
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
  getHistoryInfo: () => { total: number, current: number, canUndo: boolean, canRedo: boolean }
}

export const useResumeHistory = create<ResumeHistoryState>((set, get) => ({
  history: [],
  currentIndex: -1,
  maxHistorySize: 50, // Keep last 50 changes

  addToHistory: (content: ResumeContent, action: string, description?: string) => {
    const { history, currentIndex, maxHistorySize } = get()
    
    // Create deep copy to prevent mutation
    const contentCopy = structuredClone(content)
    
    const newEntry: HistoryEntry = {
      content: contentCopy,
      timestamp: Date.now(),
      action,
      description
    }

    // Remove any history after current index (when adding after undo)
    const newHistory = [...history.slice(0, currentIndex + 1), newEntry]
    
    // Limit history size
    const trimmedHistory = newHistory.length > maxHistorySize 
      ? newHistory.slice(-maxHistorySize) 
      : newHistory

    set({
      history: trimmedHistory,
      currentIndex: trimmedHistory.length - 1
    })
  },

  undo: () => {
    const { history, currentIndex } = get()
    
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      set({ currentIndex: newIndex })
      return structuredClone(history[newIndex].content)
    }
    
    return null
  },

  redo: () => {
    const { history, currentIndex } = get()
    
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1
      set({ currentIndex: newIndex })
      return structuredClone(history[newIndex].content)
    }
    
    return null
  },

  canUndo: () => {
    const { currentIndex } = get()
    return currentIndex > 0
  },

  canRedo: () => {
    const { history, currentIndex } = get()
    return currentIndex < history.length - 1
  },

  clearHistory: () => {
    set({
      history: [],
      currentIndex: -1
    })
  },

  getHistoryInfo: () => {
    const { history, currentIndex } = get()
    return {
      total: history.length,
      current: currentIndex + 1,
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1
    }
  }
}))