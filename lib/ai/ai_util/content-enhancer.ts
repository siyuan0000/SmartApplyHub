import { AIResponse, AITaskConfig } from '../types'
import { route2all } from '../route2all'

/**
 * Content enhancement utility functions
 */
export class ContentEnhancer {
  /**
   * Enhance content with optional job description context
   */
  static async enhanceContent(content: string, jobDescription?: string): Promise<AIResponse> {
    const prompt = jobDescription 
      ? `Enhance this content for the following job:\n\nJob: ${jobDescription}\n\nContent: ${content}`
      : `Enhance this content: ${content}`
    
    return route2all(prompt, {
      task: 'enhancement',
      temperature: 0.5,
      maxTokens: 1500
    })
  }

  /**
   * Generate enhancement fallback for resume content when AI fails
   */
  static generateEnhancementFallback(userMessage: string, originalError: Error): AIResponse {
    // Try to extract original content from the user message
    let originalContent = ''
    const contentMatch = userMessage.match(/Current Content:\s*([^]*?)(?=\n\n|Requirements:|$)/i)
    if (contentMatch) {
      originalContent = contentMatch[1].trim()
    }
    
    // Provide basic improvements if we can identify content
    const enhancedContent = originalContent || "I am a professional with experience in my field. I bring value through my skills and dedication to excellence."
    
    // Return structured JSON response for enhancement requests
    const fallbackResponse = {
      originalText: originalContent,
      enhancedText: enhancedContent + " (Note: AI enhancement temporarily unavailable - this is the original content. Please try again later or edit manually.)",
      improvements: [
        "AI enhancement services are currently unavailable",
        "Please try again in a few minutes",
        "You can edit the content manually in the meantime"
      ],
      confidence: 0.0
    }
    
    return {
      content: JSON.stringify(fallbackResponse),
      provider: 'local-fallback',
      usage: {
        promptTokens: userMessage.length / 4,
        completionTokens: 150,
        totalTokens: 200
      }
    }
  }

  /**
   * Check if a message is an enhancement request
   */
  static isEnhancementRequest(userMessage: string): boolean {
    return userMessage.toLowerCase().includes('enhance') ||
           userMessage.toLowerCase().includes('improve') ||
           userMessage.toLowerCase().includes('json') ||
           userMessage.includes('enhancedText')
  }
}

