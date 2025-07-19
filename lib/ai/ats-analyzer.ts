import { BaseOpenAIService } from './base-service'

// ATS analysis result interface
export interface ATSAnalysisResult {
  score: number
  keywords: string[]
  missingKeywords: string[]
  suggestions: string[]
  formatting: {
    score: number
    issues: string[]
    suggestions: string[]
  }
}

// ATS analyzer service - evaluates resume for ATS compatibility
export class ATSAnalyzerService extends BaseOpenAIService {
  static async analyzeATS(resumeContent: object, jobDescription?: string): Promise<ATSAnalysisResult> {
    const prompt = `
      Analyze this resume for ATS (Applicant Tracking System) compatibility:
      
      Resume Content: ${JSON.stringify(resumeContent, null, 2)}
      ${jobDescription ? `Job Description: ${jobDescription}` : ''}
      
      Please evaluate:
      1. ATS compatibility score (0-100)
      2. Keywords present in the resume
      3. Missing keywords (if job description provided)
      4. Formatting issues that might cause ATS problems
      5. Suggestions for improvement
      
      Return the response as a JSON object with the following structure:
      {
        "score": number,
        "keywords": string[],
        "missingKeywords": string[],
        "suggestions": string[],
        "formatting": {
          "score": number,
          "issues": string[],
          "suggestions": string[]
        }
      }
    `

    const messages = [
      {
        role: 'system' as const,
        content: 'You are an ATS (Applicant Tracking System) expert. Analyze resumes for ATS compatibility and keyword optimization.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    const content = await this.makeRequest(messages, 1500, 0.3)
    return JSON.parse(content)
  }
} 