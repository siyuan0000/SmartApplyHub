import { useState } from 'react'
import { ResumeContent } from '@/lib/resume/parser'
import { AboutGenerationResult } from '@/lib/ai/about-generator'

interface UseAboutGenerationState {
  isGenerating: boolean
  isGeneratingVariations: boolean
  isEnhancing: boolean
  error: string | null
  lastResult: AboutGenerationResult | null
  variations: AboutGenerationResult[]
}

export function useAboutGeneration() {
  const [state, setState] = useState<UseAboutGenerationState>({
    isGenerating: false,
    isGeneratingVariations: false,
    isEnhancing: false,
    error: null,
    lastResult: null,
    variations: []
  })

  /**
   * Generate a single about section via API with no caching
   */
  const generateAbout = async (resumeData: ResumeContent): Promise<AboutGenerationResult | null> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))
    
    try {
      const response = await fetch('/api/about/generate', {
        method: 'POST',
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeData })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        lastResult: result,
        error: null
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate about section'
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage,
        lastResult: null
      }))
      console.error('About generation failed:', error)
      return null
    }
  }

  /**
   * Generate multiple about variations via API with no caching
   */
  const generateAboutVariations = async (
    resumeData: ResumeContent, 
    count: number = 3
  ): Promise<AboutGenerationResult[]> => {
    setState(prev => ({ ...prev, isGeneratingVariations: true, error: null }))
    
    try {
      const response = await fetch('/api/about/variations', {
        method: 'POST',
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeData, count })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const results = await response.json()
      setState(prev => ({ 
        ...prev, 
        isGeneratingVariations: false, 
        variations: results,
        error: null
      }))
      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate about variations'
      setState(prev => ({ 
        ...prev, 
        isGeneratingVariations: false, 
        error: errorMessage,
        variations: []
      }))
      console.error('About variations generation failed:', error)
      return []
    }
  }

  /**
   * Enhance existing about text via API with no caching
   */
  const enhanceAbout = async (
    currentAbout: string,
    resumeData: ResumeContent
  ): Promise<AboutGenerationResult | null> => {
    setState(prev => ({ ...prev, isEnhancing: true, error: null }))
    
    try {
      const response = await fetch('/api/about/enhance', {
        method: 'POST',
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentAbout, resumeData })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      setState(prev => ({ 
        ...prev, 
        isEnhancing: false, 
        lastResult: result,
        error: null
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enhance about section'
      setState(prev => ({ 
        ...prev, 
        isEnhancing: false, 
        error: errorMessage,
        lastResult: null
      }))
      console.error('About enhancement failed:', error)
      return null
    }
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  /**
   * Clear all results
   */
  const clearResults = () => {
    setState(prev => ({ 
      ...prev, 
      lastResult: null, 
      variations: [],
      error: null
    }))
  }

  return {
    // State
    isGenerating: state.isGenerating,
    isGeneratingVariations: state.isGeneratingVariations,
    isEnhancing: state.isEnhancing,
    error: state.error,
    lastResult: state.lastResult,
    variations: state.variations,
    
    // Actions
    generateAbout,
    generateAboutVariations,
    enhanceAbout,
    clearError,
    clearResults
  }
}