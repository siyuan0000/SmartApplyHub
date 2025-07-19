import { BaseOpenAIService } from './base-service'

// Keyword suggester service - generates keyword suggestions for resume optimization
export class KeywordSuggesterService extends BaseOpenAIService {
  static async generateKeywordSuggestions(
    resumeContent: object, 
    jobDescription: string
  ): Promise<string[]> {
    const prompt = `
      Compare this resume against the job description and suggest relevant keywords to add:
      
      Resume Content: ${JSON.stringify(resumeContent, null, 2)}
      Job Description: ${jobDescription}
      
      Return only a JSON array of keywords that are:
      1. Present in the job description
      2. Missing from the resume
      3. Relevant to the candidate's experience
      4. Likely to improve ATS matching
      
      Format: ["keyword1", "keyword2", "keyword3"]
    `

    const messages = [
      {
        role: 'system' as const,
        content: 'You are a keyword optimization expert. Identify missing keywords that would improve resume-job matching.'
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ]

    const content = await this.makeRequest(messages, 500, 0.3)
    return JSON.parse(content)
  }
} 