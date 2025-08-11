import { BaseOpenAIService } from './base-service'

// Content enhancement result interface
export interface ContentEnhancementResult {
  originalText: string
  enhancedText: string
  improvements: string[]
  confidence: number
}

// Content enhancer service - improves resume section content
export class ContentEnhancerService extends BaseOpenAIService {
  static async enhanceSection(
    sectionType: string, 
    originalContent: string, 
    jobDescription?: string
  ): Promise<ContentEnhancementResult> {
    const prompt = `Enhance this ${sectionType} section for a resume:

Current Content: ${originalContent}
${jobDescription ? `Target Job: ${jobDescription}` : ''}

Requirements:
1. Improve the writing quality and impact
2. Use action verbs and quantifiable achievements
3. Optimize for ATS keywords (if job description provided)
4. Maintain the original intent and truthfulness
5. Keep it concise and professional

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text. Return exactly this JSON structure:

{
  "originalText": "${originalContent.replace(/"/g, '\\"')}",
  "enhancedText": "improved version here",
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "confidence": 0.85
}`

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a professional resume writer. Enhance resume sections to be more compelling and ATS-friendly while maintaining accuracy. Always respond with ONLY valid JSON format - no markdown, no code blocks, no additional text.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    // Use optimized settings for generation task
    const maxTokens = this.getOptimalTokens(1000);
    const temperature = this.getOptimalTemperature('generation');
    
    return await this.makeStructuredRequest<ContentEnhancementResult>(messages, maxTokens, temperature);
  }
} 