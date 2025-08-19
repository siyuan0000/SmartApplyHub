// Main AI services index - exports all AI service classes

// New router system - recommended for new code
export { AIRouter, aiRouter, route2all, streamRoute2all } from './route2all'
export type * from './types'

// Provider system
export * from './providers'

// AI Utilities - new modular approach
export * from './ai_util'

// Updated base services
export { BaseAIService, BaseOpenAIService } from './base-service'
export { AIService } from './ai-service'

// Legacy compatibility
export { OpenAIService } from './openai'

// Specific service exports
export { ResumeParserService } from './resume-parser'
export { ResumeAnalyzerService, type AIAnalysisResult } from './resume-analyzer'
export { ATSAnalyzerService, type ATSAnalysisResult } from './ats-analyzer'
export { ContentEnhancerService, type ContentEnhancementResult } from './content-enhancer'
export { KeywordSuggesterService } from './keyword-suggester'
export { EmailGeneratorService, type AIGeneratedEmail } from './email-generator'
export { AboutGenerator, type AboutGenerationResult } from './about-generator' 