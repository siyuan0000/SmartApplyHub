import { useState } from 'react'

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
  streamedText: string
}

export interface StreamInfo {
  streamId: string
  promise: Promise<void>
}

export function useSectionEnhancement() {
  const [state, setState] = useState<UseSectionEnhancementState>({
    isEnhancing: false,
    error: null,
    lastResult: null,
    streamedText: ''
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

  // Word count limits by section type
  const WORD_LIMITS: Record<string, number> = {
    summary: 80,
    experience: 150,
    projects: 100,
    education: 100,
    skills: 30,
    contact: Infinity
  }

  /**
   * Create system prompt with HR insights and word count awareness
   */
  const createSystemPrompt = (sectionType: string, hrInsights: string[]): string => {
    const wordLimit = WORD_LIMITS[sectionType] || 150
    const limitText = wordLimit === Infinity 
      ? '' 
      : `\n• Target maximum word count for this section: ${wordLimit} words
• If content is too long, shorten it without losing clarity or ATS relevance`

    return `You are a professional resume writer and HR expert. You are helping to enhance the ${sectionType} section of a resume.

HR Expert Guidelines for ${sectionType} sections:
${hrInsights.map(insight => `• ${insight}`).join('\n')}${limitText}

Your task is to:
1. Improve the content while maintaining the candidate's voice
2. Make it more compelling and ATS-friendly
3. Ensure proper formatting and professional language
4. Optimize for both human recruiters and applicant tracking systems
5. Provide specific, actionable improvements
6. Keep content within the specified word count limit while preserving impact

CRITICAL: You must respond in the exact delimiter format specified by the user. Follow the format instructions precisely.`
  }

  /**
   * Helper function to count words in text
   */
  const countWords = (text: string): number => {
    if (!text || !text.trim()) return 0
    return text.trim().split(/\s+/).length
  }

  /**
   * Helper function to get section label for display
   */
  const getSectionLabel = (sectionType: string): string => {
    const labels: Record<string, string> = {
      summary: 'Professional Summary',
      experience: 'Experience',
      projects: 'Projects',
      education: 'Education',
      skills: 'Skills',
      contact: 'Contact Information'
    }
    return labels[sectionType] || sectionType
  }

  /**
   * Create user prompt with context and word count control
   */
  const createUserPrompt = (context: EnhancementContext): string => {
    const isEmpty = !context.originalContent || !context.originalContent.trim()
    const wordLimit = WORD_LIMITS[context.sectionType] || 150
    const currentWordCount = countWords(context.originalContent || '')
    const needsConciseRewrite = !isEmpty && currentWordCount > wordLimit
    const sectionLabel = getSectionLabel(context.sectionType)
    
    let prompt = isEmpty 
      ? `Please create a professional ${context.sectionType} section from scratch:

Current content: [Empty - please generate new content]
`
      : `Please enhance this ${context.sectionType} section content:

Current content:
${context.originalContent}
`

    // Add word count information for non-contact sections
    if (wordLimit !== Infinity) {
      prompt += `\nWord count target: Maximum ${wordLimit} words for ${sectionLabel} section${!isEmpty ? ` (current: ${currentWordCount} words)` : ''}
`
    }

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
4. Content optimized for ATS (Applicant Tracking Systems)${wordLimit !== Infinity ? `\n5. Content that stays within ${wordLimit} words` : ''}

Note: Since starting from scratch, create professional placeholder content that the user can customize with their specific details.`
    } else {
      prompt += `\nPlease provide:
1. Enhanced version of the content
2. Key improvements made
3. Additional suggestions for optimization${wordLimit !== Infinity ? `\n4. Content that stays within ${wordLimit} words` : ''}

Focus on making this section stand out while remaining truthful and professional.`
    }

    // Add concise rewrite prompt if content exceeds word limit
    if (needsConciseRewrite) {
      prompt += `

=== CONTENT TOO LONG — PLEASE CONCISELY REWRITE ===
The enhanced content exceeds the maximum word count for this section. Please rewrite the content to stay within ${wordLimit} words while preserving:
• Quantified impact
• Action verbs and ATS keywords
• Narrative consistency
• Most compelling achievements and details`
    }

    prompt += `\n\n###
Output *exactly* in this format – no markdown fences:

=== ANALYSIS ===
<bullet-point analysis of current content (or of empty state)>

=== ENHANCED_CONTENT ===
<fully improved ${context.sectionType} section, ready to paste verbatim>
###`

    return prompt
  }

  /**
   * Enhance a resume section
   */
  const enhanceSection = async (context: EnhancementContext): Promise<SectionEnhancementResult | null> => {
    setState(prev => ({ ...prev, isEnhancing: true, error: null }))
    
    // Debug logging for troubleshooting
    console.log('🔧 [AI Enhancement Debug] Starting non-stream enhancement...')
    console.log('🔧 [AI Enhancement Debug] Context:', {
      sectionType: context.sectionType,
      hasOriginalContent: !!context.originalContent,
      hasCustomPrompt: !!context.customPrompt,
      hasJobDescription: !!context.jobDescription
    })
    
    try {
      // Use API call instead of direct router access
      const response = await fetch('/api/about/enhance', {
        method: 'POST',
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          resumeData: {}, // Minimal data for API compatibility
          section: context.sectionType,
          content: context.originalContent || ''
        })
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // Keep the HTTP status message
        }
        throw new Error(errorMessage)
      }
      
      const apiResult = await response.json()
      console.log('🔧 [AI Enhancement Debug] API response received:', {
        hasEnhancedText: !!apiResult.aboutText,
        contentLength: apiResult.aboutText?.length || 0
      })
      
      // Convert API response to expected format
      // API returns AboutGenerationResult format, convert to SectionEnhancementResult
      const result: SectionEnhancementResult = {
        enhancedText: apiResult.aboutText || '',
        suggestions: ['Content enhanced via API'],
        changes: ['Professional language improvements', 'ATS optimization'],
        provider: apiResult.provider || 'api'
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
      
      // Return fallback result without modifying content
      return {
        enhancedText: '',
        suggestions: [],
        changes: [],
        provider: 'fallback'
      }
    }
  }

  /**
   * Enhance a resume section with streaming
   */
  const enhanceSectionStream = async (context: EnhancementContext): Promise<void> => {
    setState(prev => ({ ...prev, isEnhancing: true, error: null, streamedText: '' }))
    
    // Debug logging for troubleshooting
    console.log('🔧 [AI Enhancement Debug] Starting stream enhancement...')
    console.log('🔧 [AI Enhancement Debug] Context:', {
      sectionType: context.sectionType,
      hasOriginalContent: !!context.originalContent,
      hasCustomPrompt: !!context.customPrompt,
      hasJobDescription: !!context.jobDescription
    })
    
    try {
      // Use new streaming API
      const response = await fetch('/api/enhance/stream', {
        method: 'POST',
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sectionType: context.sectionType,
          originalContent: context.originalContent,
          customPrompt: context.customPrompt,
          jobDescription: context.jobDescription,
          hrInsights: context.hrInsights || getHRInsights(context.sectionType)
        })
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        } catch {
          // Keep the HTTP status message
        }
        throw new Error(errorMessage)
      }
      
      console.log('🔧 [AI Enhancement Debug] Stream response received, processing...')
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available for stream')
      }
      
      const decoder = new TextDecoder()
      let chunkCount = 0
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunkCount++
        const chunk = decoder.decode(value)
        setState(prev => ({
          ...prev,
          streamedText: prev.streamedText + chunk
        }))
        
        if (chunkCount === 1) {
          console.log('🔧 [AI Enhancement Debug] First chunk received successfully')
        }
      }
      
      console.log(`🔧 [AI Enhancement Debug] Stream completed with ${chunkCount} chunks`)
      
      setState(prev => ({ 
        ...prev, 
        isEnhancing: false,
        lastResult: null // No auto-apply
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enhancement failed'
      console.error('🔧 [AI Enhancement Debug] Stream enhancement failed:', {
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : undefined
      })
      
      setState(prev => ({ 
        ...prev, 
        isEnhancing: false, 
        error: errorMessage
      }))
    }
  }

  /**
   * Validate and optionally truncate enhanced content if it exceeds word limits
   */
  const validateAndTruncateContent = (enhancedText: string, sectionType: string): { text: string; wasTrimed: boolean } => {
    const wordLimit = WORD_LIMITS[sectionType] || 150
    
    if (wordLimit === Infinity) {
      return { text: enhancedText, wasTrimed: false }
    }
    
    const words = enhancedText.trim().split(/\s+/)
    
    if (words.length <= wordLimit) {
      return { text: enhancedText, wasTrimed: false }
    }
    
    // Truncate to word limit and add indication
    const truncatedWords = words.slice(0, wordLimit)
    const truncatedText = truncatedWords.join(' ')
    
    console.warn(`⚠️ [Word Limit] Enhanced ${sectionType} content exceeded ${wordLimit} words (${words.length} words), truncated to fit limit.`)
    
    return { text: truncatedText, wasTrimed: true }
  }

  /**
   * Robust AI response parser with JSON-first approach and improved regex fallback
   * @param raw - Raw AI response string
   * @param provider - AI provider name (optional)
   * @param sectionType - Section type for word count validation
   * @returns Parsed SectionEnhancementResult
   */
  const parseAiResponse = (raw: string, provider?: string, sectionType?: string): SectionEnhancementResult => {
    // Normalize line endings
    const content = raw.replace(/\r\n/g, '\n').trim()
    
    // Try to locate JSON via delimiters or first { ... } block
    const jsonResult = tryParseJson(content)
    if (jsonResult) {
      let enhancedText = jsonResult.enhancedText || ''
      let suggestions = Array.isArray(jsonResult.suggestions) ? jsonResult.suggestions.filter((s: any) => typeof s === 'string' && s.trim().length >= 5) : []
      
      // Validate word count if section type is provided
      if (sectionType && enhancedText) {
        const { text: validatedText, wasTrimed } = validateAndTruncateContent(enhancedText, sectionType)
        enhancedText = validatedText
        
        if (wasTrimed) {
          suggestions.unshift('Content was automatically shortened to meet word count requirements')
        }
      }
      
      return {
        enhancedText,
        suggestions,
        changes: Array.isArray(jsonResult.changes) ? jsonResult.changes.filter((c: any) => typeof c === 'string' && c.trim().length >= 5) : [],
        provider
      }
    }
    
    // Fallback to improved regex parsing
    return parseWithRegex(content, provider, sectionType)
  }
  
  /**
   * Attempt to parse JSON from delimited content or first JSON block
   */
  const tryParseJson = (content: string): any => {
    // Try delimiter-based extraction first
    const delimiterMatch = content.match(/### OUTPUT \(valid JSON\)\s*\n([\s\S]*?)\n### END/i)
    if (delimiterMatch) {
      try {
        return JSON.parse(delimiterMatch[1].trim())
      } catch {
        // Continue to next approach
      }
    }
    
    // Try to find first complete JSON object
    const jsonMatch = content.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        // Continue to fallback
      }
    }
    
    return null
  }
  
  /**
   * Parse content using improved regex patterns
   */
  const parseWithRegex = (content: string, provider?: string, sectionType?: string): SectionEnhancementResult => {
    const bulletRegex = /^\s*(?:[\-*•+]|\d+[.)])\s*/gm
    
    // Extract enhanced text
    let enhancedText = extractTextSection(content, [
      /(?:enhanced version|enhanced content|improved version|improved content):\s*\n([\s\S]*?)(?:\n\n|$)/i,
      /(?:here's the enhanced|here is the enhanced)([\s\S]*?)(?:\n\n|$)/i,
      /=== ENHANCED_CONTENT ===([\s\S]*?)(?:\n===|$)/i,
      /```\s*([\s\S]*?)\s*```/
    ])
    
    if (!enhancedText) {
      // Fallback: use first substantial paragraph
      const paragraphs = content.split('\n\n')
      enhancedText = paragraphs.find(p => p.trim().length > 50) || content
    }
    
    // Extract suggestions
    let suggestions = extractListSection(content, [
      /(?:suggestions|recommendations|additional suggestions):\s*\n([\s\S]*?)(?:\n\n|$)/i,
      /(?:key improvements|improvements made):\s*\n([\s\S]*?)(?:\n\n|$)/i
    ], bulletRegex)
    
    // Extract changes
    const changes = extractListSection(content, [
      /(?:changes made|key improvements|improvements):\s*\n([\s\S]*?)(?:\n\n|$)/i,
      /(?:what i changed|modifications):\s*\n([\s\S]*?)(?:\n\n|$)/i
    ], bulletRegex)
    
    // Validate word count if section type is provided
    if (sectionType && enhancedText) {
      const { text: validatedText, wasTrimed } = validateAndTruncateContent(enhancedText.trim(), sectionType)
      enhancedText = validatedText
      
      if (wasTrimed) {
        suggestions.unshift('Content was automatically shortened to meet word count requirements')
      }
    }
    
    return {
      enhancedText: enhancedText.trim(),
      suggestions,
      changes,
      provider
    }
  }
  
  /**
   * Extract text section using multiple patterns
   */
  const extractTextSection = (content: string, patterns: RegExp[]): string => {
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match && match[1]?.trim()) {
        return match[1].trim()
      }
    }
    return ''
  }
  
  /**
   * Extract list items using patterns and bullet regex
   */
  const extractListSection = (content: string, patterns: RegExp[], bulletRegex: RegExp): string[] => {
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        const lines = match[1].split('\n')
        const items: string[] = []
        
        for (const line of lines) {
          const cleaned = line.replace(bulletRegex, '').trim()
          if (cleaned && cleaned.length >= 5) {
            items.push(cleaned)
          }
        }
        
        if (items.length > 0) {
          return items
        }
      }
    }
    return []
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  /**
   * Start enhancement stream for a section (for use beneath sections)
   * Returns { streamId, promise } for tracking stream lifecycle
   */
  const startEnhanceStream = (context: EnhancementContext): StreamInfo => {
    const streamId = `enhance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const promise = (async () => {
      setState(prev => ({ ...prev, isEnhancing: true, error: null, streamedText: '' }))
      
      // Debug logging for troubleshooting
      console.log('🔧 [Stream Enhancement Debug] Starting stream enhancement...')
      console.log('🔧 [Stream Enhancement Debug] Context:', {
        sectionType: context.sectionType,
        hasOriginalContent: !!context.originalContent,
        hasCustomPrompt: !!context.customPrompt,
        hasJobDescription: !!context.jobDescription,
        streamId: streamId
      })
      
      try {
        console.log('🔧 [Stream Enhancement Debug] Making API call...')
        
        // Use new streaming API
        const response = await fetch('/api/enhance/stream', {
          method: 'POST',
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sectionType: context.sectionType,
            originalContent: context.originalContent,
            customPrompt: context.customPrompt,
            jobDescription: context.jobDescription,
            hrInsights: context.hrInsights || getHRInsights(context.sectionType)
          })
        })
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`
          try {
            const errorText = await response.text()
            errorMessage = errorText || errorMessage
          } catch {
            // Keep the HTTP status message
          }
          throw new Error(errorMessage)
        }
        
        console.log('🔧 [Stream Enhancement Debug] Stream response received, processing...')
        
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No reader available for stream')
        }
        
        const decoder = new TextDecoder()
        let chunkCount = 0
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          chunkCount++
          const chunk = decoder.decode(value)
          setState(prev => ({
            ...prev,
            streamedText: prev.streamedText + chunk
          }))
          
          if (chunkCount === 1) {
            console.log('🔧 [Stream Enhancement Debug] First chunk received successfully')
          }
        }
        
        console.log(`🔧 [Stream Enhancement Debug] Stream completed with ${chunkCount} chunks`)
        
        setState(prev => ({ 
          ...prev, 
          isEnhancing: false,
          lastResult: null // No auto-apply
        }))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Enhancement failed'
        console.error('🔧 [Stream Enhancement Debug] Stream enhancement failed:', {
          error: errorMessage,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorStack: error instanceof Error ? error.stack : undefined,
          streamId: streamId
        })
        
        setState(prev => ({ 
          ...prev, 
          isEnhancing: false, 
          error: errorMessage
        }))
        
        // Re-throw for caller to handle (e.g., toast NO_PROVIDERS)
        throw error
      }
    })()
    
    return { streamId, promise }
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
    streamedText: state.streamedText,
    
    // Actions
    enhanceSection,
    enhanceSectionStream,
    startEnhanceStream,
    getHRInsights,
    clearError,
    clearResults
  }
}