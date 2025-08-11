import { useState } from 'react'
import { route2all } from '@/lib/ai/route2all'

export interface SectionEnhancementResult {
  enhancedText: string
  suggestions: string[]
  changes: string[]
  provider?: string
}

export interface EnhancementContext {
  sectionType: string
  originalContent: string
  customPrompt?: string
  jobDescription?: string
  hrInsights?: string[]
}

interface UseSectionEnhancementState {
  isEnhancing: boolean
  error: string | null
  lastResult: SectionEnhancementResult | null
}

export function useSectionEnhancement() {
  const [state, setState] = useState<UseSectionEnhancementState>({
    isEnhancing: false,
    error: null,
    lastResult: null
  })

  /**
   * Get HR expert insights for different sections
   */
  const getHRInsights = (sectionType: string): string[] => {
    const insights: Record<string, string[]> = {
      contact: [
        "Include a professional email address and phone number",
        "LinkedIn profile should be complete and professional",
        "Location can be city/state or remote-friendly",
        "Avoid personal information like age, marital status, or photo"
      ],
      summary: [
        "Start with a strong professional headline",
        "Include 2-3 key achievements with numbers when possible",
        "Mention years of experience and core expertise",
        "End with career goals or value proposition"
      ],
      about: [
        "Write in first person for LinkedIn-style sections",
        "Tell a story that connects your experiences",
        "Include personality while staying professional",
        "Show passion for your field and continuous learning"
      ],
      experience: [
        "Use action verbs to start each bullet point",
        "Quantify achievements with numbers, percentages, or dollar amounts",
        "Focus on results and impact, not just responsibilities",
        "Tailor experiences to match target job requirements",
        "Use reverse chronological order"
      ],
      education: [
        "List degree type, field of study, and institution",
        "Include graduation year if within last 10-15 years",
        "Add GPA if 3.5 or higher and recent graduate",
        "Include relevant coursework, honors, or projects if space allows"
      ],
      skills: [
        "Organize by categories (Technical, Languages, Soft Skills)",
        "List most relevant skills first",
        "Be honest about proficiency levels",
        "Include industry-specific tools and technologies",
        "Balance hard and soft skills"
      ],
      projects: [
        "Focus on projects relevant to target role",
        "Include technologies used and your specific role",
        "Highlight measurable outcomes or impact",
        "Provide links to live projects or repositories when possible"
      ]
    }
    
    return insights[sectionType] || [
      "Focus on clarity and professional presentation",
      "Highlight achievements and quantifiable results",
      "Tailor content to your target role",
      "Use professional language and formatting"
    ]
  }

  /**
   * Create system prompt with HR insights
   */
  const createSystemPrompt = (sectionType: string, hrInsights: string[]): string => {
    return `You are a professional resume writer and HR expert. You are helping to enhance the ${sectionType} section of a resume.

HR Expert Guidelines for ${sectionType} sections:
${hrInsights.map(insight => `• ${insight}`).join('\n')}

Your task is to:
1. Improve the content while maintaining the candidate's voice
2. Make it more compelling and ATS-friendly
3. Ensure proper formatting and professional language
4. Optimize for both human recruiters and applicant tracking systems
5. Provide specific, actionable improvements

Always provide enhanced content that is:
- Professional and polished
- Quantified where possible
- Relevant to modern hiring practices
- Optimized for applicant tracking systems
- Compelling to human recruiters`
  }

  /**
   * Create user prompt with context
   */
  const createUserPrompt = (context: EnhancementContext): string => {
    const isEmpty = !context.originalContent || !context.originalContent.trim()
    
    let prompt = isEmpty 
      ? `Please create a professional ${context.sectionType} section from scratch:

Current content: [Empty - please generate new content]
`
      : `Please enhance this ${context.sectionType} section content:

Current content:
${context.originalContent}
`

    if (context.jobDescription) {
      prompt += `\nTarget job context:
${context.jobDescription}
`
    }

    if (context.customPrompt) {
      prompt += `\nSpecific ${isEmpty ? 'creation' : 'enhancement'} request:
${context.customPrompt}
`
    }

    if (isEmpty) {
      prompt += `\nPlease create:
1. Professional ${context.sectionType} content following industry best practices
2. Content that would be impressive to recruiters and hiring managers
3. Realistic but compelling information (use placeholder data where needed)
4. Content optimized for ATS (Applicant Tracking Systems)

Note: Since starting from scratch, create professional placeholder content that the user can customize with their specific details.`
    } else {
      prompt += `\nPlease provide:
1. Enhanced version of the content
2. Key improvements made
3. Additional suggestions for optimization

Focus on making this section stand out while remaining truthful and professional.`
    }

    return prompt
  }

  /**
   * Enhance a resume section
   */
  const enhanceSection = async (context: EnhancementContext): Promise<SectionEnhancementResult | null> => {
    setState(prev => ({ ...prev, isEnhancing: true, error: null }))
    
    try {
      const hrInsights = context.hrInsights || getHRInsights(context.sectionType)
      const systemPrompt = createSystemPrompt(context.sectionType, hrInsights)
      const userPrompt = createUserPrompt(context)
      
      const response = await route2all([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        task: 'enhancement',
        temperature: 0.5,
        maxTokens: 1000,
        preferredProvider: 'openai' // OpenAI is better for professional writing
      })
      
      // Parse the response to extract enhanced text and suggestions
      const content = response.content.trim()
      const enhancedText = extractEnhancedContent(content)
      const suggestions = extractSuggestions(content)
      const changes = extractChanges(content)
      
      const result: SectionEnhancementResult = {
        enhancedText,
        suggestions,
        changes,
        provider: response.provider
      }
      
      setState(prev => ({ 
        ...prev, 
        isEnhancing: false, 
        lastResult: result,
        error: null
      }))
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enhancement failed'
      setState(prev => ({ 
        ...prev, 
        isEnhancing: false, 
        error: errorMessage,
        lastResult: null
      }))
      console.error('Section enhancement failed:', error)
      
      // Return a basic enhancement as fallback
      return generateBasicEnhancement(context)
    }
  }

  /**
   * Extract enhanced content from AI response
   */
  const extractEnhancedContent = (content: string): string => {
    // Look for patterns like "Enhanced version:", "Improved content:", etc.
    const patterns = [
      /(?:Enhanced version:|Enhanced content:|Improved version:|Improved content:)\s*\n([\s\S]*?)(?:\n\n|$)/i,
      /(?:Here's the enhanced|Here is the enhanced)([\s\S]*?)(?:\n\n|$)/i,
      /```\s*([\s\S]*?)\s*```/,
    ]
    
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match && match[1]?.trim()) {
        return match[1].trim()
      }
    }
    
    // If no pattern matches, return the first substantial paragraph
    const paragraphs = content.split('\n\n')
    return paragraphs.find(p => p.trim().length > 50) || content
  }

  /**
   * Extract suggestions from AI response
   */
  const extractSuggestions = (content: string): string[] => {
    const suggestions: string[] = []
    
    // Look for numbered or bulleted suggestions
    const suggestionPatterns = [
      /(?:Additional suggestions|Suggestions|Recommendations):\s*\n([\s\S]*?)(?:\n\n|$)/i,
      /(?:Key improvements|Improvements made):\s*\n([\s\S]*?)(?:\n\n|$)/i
    ]
    
    for (const pattern of suggestionPatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        const lines = match[1].split('\n')
        for (const line of lines) {
          const cleaned = line.replace(/^[•\-*\d.]\s*/, '').trim()
          if (cleaned && cleaned.length > 10) {
            suggestions.push(cleaned)
          }
        }
        break
      }
    }
    
    return suggestions
  }

  /**
   * Extract changes made from AI response
   */
  const extractChanges = (content: string): string[] => {
    const changes: string[] = []
    
    const changePatterns = [
      /(?:Changes made|Key improvements|Improvements):\s*\n([\s\S]*?)(?:\n\n|$)/i,
      /(?:What I changed|Modifications):\s*\n([\s\S]*?)(?:\n\n|$)/i
    ]
    
    for (const pattern of changePatterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        const lines = match[1].split('\n')
        for (const line of lines) {
          const cleaned = line.replace(/^[•\-*\d.]\s*/, '').trim()
          if (cleaned && cleaned.length > 5) {
            changes.push(cleaned)
          }
        }
        break
      }
    }
    
    return changes
  }

  /**
   * Generate basic enhancement when AI fails
   */
  const generateBasicEnhancement = (context: EnhancementContext): SectionEnhancementResult => {
    const hrInsights = getHRInsights(context.sectionType)
    
    return {
      enhancedText: context.originalContent + "\n\n💡 AI enhancement unavailable - please manually improve this section using the HR insights provided.",
      suggestions: hrInsights,
      changes: ["Unable to connect to AI services - manual enhancement required"],
      provider: 'fallback'
    }
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  /**
   * Clear results
   */
  const clearResults = () => {
    setState(prev => ({ 
      ...prev, 
      lastResult: null, 
      error: null
    }))
  }

  return {
    // State
    isEnhancing: state.isEnhancing,
    error: state.error,
    lastResult: state.lastResult,
    
    // Actions
    enhanceSection,
    getHRInsights,
    clearError,
    clearResults
  }
}