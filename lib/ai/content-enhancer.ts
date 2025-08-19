import { BaseOpenAIService } from './base-service'

// Content enhancement result interface
export interface ContentEnhancementResult {
  enhancedText: string
  suggestions: string[]
  changes: string[]
}

// Content enhancer service - improves resume section content
export class ContentEnhancerService extends BaseOpenAIService {
  static async enhanceSection(
    sectionType: string, 
    originalContent: string, 
    jobDescription?: string
  ): Promise<ContentEnhancementResult> {
    console.log('🔧 [ContentEnhancerService Debug] Starting enhancement:', {
      sectionType,
      originalContentLength: originalContent?.length || 0,
      hasOriginalContent: !!originalContent,
      hasJobDescription: !!jobDescription,
      jobDescriptionLength: jobDescription?.length || 0
    })
    const prompt = `Enhance this ${sectionType} section for a resume:

Current Content: ${originalContent}
${jobDescription ? `Target Job: ${jobDescription}` : ''}

Requirements:
1. Improve the writing quality and impact
2. Use action verbs and quantifiable achievements
3. Optimize for ATS keywords (if job description provided)
4. Maintain the original intent and truthfulness
5. Keep it concise and professional

IMPORTANT: You must respond with ONLY valid JSON - no markdown fences, no extra prose, no code blocks. Use this exact format:

### OUTPUT (valid JSON)
{
  "enhancedText": "improved version here",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "changes": ["change 1", "change 2", "change 3"]
}
### END`

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a professional resume writer. Enhance resume sections to be more compelling and ATS-friendly while maintaining accuracy. CRITICAL: Respond with valid JSON only between ### OUTPUT (valid JSON) and ### END delimiters. No markdown fences, no extra prose.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    // Use optimized settings for generation task
    const maxTokens = this.getOptimalTokens(1000, 'enhancement');
    const temperature = this.getOptimalTemperature('enhancement');
    
    console.log('🔧 [ContentEnhancerService Debug] Making request with settings:', {
      maxTokens,
      temperature,
      preferredProvider: 'deepseek',
      messagesCount: messages.length
    })
    
    try {
      const result = await this.makeStructuredRequest<ContentEnhancementResult>(messages, {
        task: 'enhancement',
        maxTokens,
        temperature,
        preferredProvider: 'deepseek' // DeepSeek is good at content enhancement
      });
      
      console.log('🔧 [ContentEnhancerService Debug] Enhancement successful:', {
        hasEnhancedText: !!result.enhancedText,
        enhancedTextLength: result.enhancedText?.length || 0,
        suggestionsCount: Array.isArray(result.suggestions) ? result.suggestions.length : 0,
        changesCount: Array.isArray(result.changes) ? result.changes.length : 0
      })
      
      return result;
    } catch (error) {
      console.error('🔧 [ContentEnhancerService Debug] Enhancement failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : undefined
      })
      throw error;
    }
  }
} 