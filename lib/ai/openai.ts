// Legacy compatibility layer - re-exports from modular services
// This file maintains backward compatibility while the new modular structure is adopted

import { ResumeContent } from '@/lib/resume/parser'
import { ResumeParserService } from './resume-parser'
import { ResumeAnalyzerService, type AIAnalysisResult } from './resume-analyzer'
import { ATSAnalyzerService, type ATSAnalysisResult } from './ats-analyzer'
import { ContentEnhancerService, type ContentEnhancementResult } from './content-enhancer'
import { KeywordSuggesterService } from './keyword-suggester'

// Re-export types for backward compatibility
export type { AIAnalysisResult, ATSAnalysisResult, ContentEnhancementResult }

// Legacy OpenAIService class that delegates to modular services
export class OpenAIService {
  static async analyzeResume(resumeContent: object): Promise<AIAnalysisResult> {
    return ResumeAnalyzerService.analyzeResume(resumeContent)
  }

  static async analyzeATS(resumeContent: object, jobDescription?: string): Promise<ATSAnalysisResult> {
    return ATSAnalyzerService.analyzeATS(resumeContent, jobDescription)
  }

  static async enhanceSection(sectionType: string, content: string, jobDescription?: string): Promise<ContentEnhancementResult> {
    return ContentEnhancerService.enhanceSection(sectionType, content, jobDescription)
  }

  static async generateKeywordSuggestions(resumeContent: object, jobDescription: string): Promise<string[]> {
    return KeywordSuggesterService.generateKeywordSuggestions(resumeContent, jobDescription)
  }

  static async parseResumeStructure(rawText: string): Promise<ResumeContent> {
    return ResumeParserService.parseResumeStructure(rawText)
  }
}