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
  const generateAbout = async (resumeData: ResumeContent, retryCount = 0): Promise<AboutGenerationResult | null> => {
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
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } catch {
          // Failed to parse error response, use status
        }
        throw new Error(errorMessage)
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
      console.error('About generation failed:', error)
      
      // Retry once on network errors
      if (retryCount < 1 && (error instanceof Error && 
          (error.message.includes('fetch') || error.message.includes('network')))) {
        console.log('Retrying generation due to network error...')
        return generateAbout(resumeData, retryCount + 1)
      }
      
      let errorMessage = 'Failed to generate content'
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error - check your internet connection and try again'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out - the AI service may be busy, please try again'
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'Server error - the AI service encountered an issue, please try again'
        } else if (error.message.includes('HTTP 429')) {
          errorMessage = 'Rate limit exceeded - please wait a moment and try again'
        } else {
          errorMessage = error.message
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: errorMessage,
        lastResult: null
      }))
      
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
    resumeData: ResumeContent,
    retryCount = 0
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
        body: JSON.stringify({ 
          resumeData, 
          section: 'about', 
          content: currentAbout 
        })
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } catch {
          // Failed to parse error response, use status
        }
        throw new Error(errorMessage)
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
      console.error('About enhancement failed:', error)
      
      // Retry once on network errors
      if (retryCount < 1 && (error instanceof Error && 
          (error.message.includes('fetch') || error.message.includes('network')))) {
        console.log('Retrying enhancement due to network error...')
        return enhanceAbout(currentAbout, resumeData, retryCount + 1)
      }
      
      let errorMessage = 'Failed to enhance content'
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error - check your internet connection and try again'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out - the AI service may be busy, please try again'
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'Server error - the AI service encountered an issue, please try again'
        } else if (error.message.includes('HTTP 429')) {
          errorMessage = 'Rate limit exceeded - please wait a moment and try again'
        } else {
          errorMessage = error.message
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        isEnhancing: false, 
        error: errorMessage,
        lastResult: null
      }))
      
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