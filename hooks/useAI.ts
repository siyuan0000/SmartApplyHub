import { useState } from 'react'
import { AIAnalysisResult, ATSAnalysisResult, ContentEnhancementResult } from '@/lib/ai/openai'
import { ResumeContent } from '@/lib/resume/parser'

export interface UseAIReturn {
  // Analysis
  analyzeResume: (resumeId: string) => Promise<AIAnalysisResult>
  analyzeATS: (resumeId: string, jobDescription?: string) => Promise<ATSAnalysisResult>
  
  // Content Enhancement
  enhanceSection: (sectionType: string, content: string, jobDescription?: string) => Promise<ContentEnhancementResult>
  
  // Resume Parsing
  parseResumeStructure: (rawText: string) => Promise<ResumeContent>
  
  // Keyword Suggestions
  getKeywordSuggestions: (resumeId: string, jobDescription: string) => Promise<string[]>
  
  // Loading States
  isAnalyzing: boolean
  isEnhancing: boolean
  isParsing: boolean
  isGeneratingKeywords: boolean
  
  // Error States
  error: string | null
  clearError: () => void
}

export function useAI(): UseAIReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const analyzeResume = async (resumeId: string): Promise<AIAnalysisResult> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ resumeId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze resume')
      }

      const { analysis } = await response.json()
      return analysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeATS = async (resumeId: string, jobDescription?: string): Promise<ATSAnalysisResult> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze-ats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ resumeId, jobDescription }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze ATS compatibility')
      }

      const { analysis } = await response.json()
      return analysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ATS analysis failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsAnalyzing(false)
    }
  }

  const enhanceSection = async (
    sectionType: string,
    content: string,
    jobDescription?: string
  ): Promise<ContentEnhancementResult> => {
    setIsEnhancing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/enhance-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ sectionType, content, jobDescription }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enhance content')
      }

      const { enhancement } = await response.json()
      return enhancement
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Content enhancement failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsEnhancing(false)
    }
  }

  const getKeywordSuggestions = async (resumeId: string, jobDescription: string): Promise<string[]> => {
    setIsGeneratingKeywords(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/suggest-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ resumeId, jobDescription }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate keyword suggestions')
      }

      const { keywords } = await response.json()
      return keywords
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Keyword generation failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsGeneratingKeywords(false)
    }
  }

  const parseResumeStructure = async (rawText: string): Promise<ResumeContent> => {
    setIsParsing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ rawText }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to parse resume')
      }

      const { structuredContent } = await response.json()
      return structuredContent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Resume parsing failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsParsing(false)
    }
  }

  return {
    analyzeResume,
    analyzeATS,
    enhanceSection,
    parseResumeStructure,
    getKeywordSuggestions,
    isAnalyzing,
    isEnhancing,
    isParsing,
    isGeneratingKeywords,
    error,
    clearError,
  }
}