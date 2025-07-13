import { OpenAI } from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false // Ensure this only runs on server-side
})

export interface AIAnalysisResult {
  score: number
  feedback: string[]
  suggestions: string[]
  strengths: string[]
  weaknesses: string[]
}

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

export interface ContentEnhancementResult {
  originalText: string
  enhancedText: string
  improvements: string[]
  confidence: number
}

export class OpenAIService {
  private static validateApiKey(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY environment variable.')
    }
  }

  static async analyzeResume(resumeContent: object): Promise<AIAnalysisResult> {
    this.validateApiKey()

    try {
      const prompt = `
        Analyze this resume and provide a comprehensive evaluation:
        
        Resume Content: ${JSON.stringify(resumeContent, null, 2)}
        
        Please provide:
        1. Overall score (0-100)
        2. Specific feedback points
        3. Improvement suggestions
        4. Key strengths
        5. Areas for improvement
        
        Return the response as a JSON object with the following structure:
        {
          "score": number,
          "feedback": string[],
          "suggestions": string[],
          "strengths": string[],
          "weaknesses": string[]
        }
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume reviewer and career coach. Provide detailed, actionable feedback to help improve resumes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(content)
    } catch (error) {
      console.error('OpenAI resume analysis failed:', error)
      throw new Error(`Resume analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async analyzeATS(resumeContent: object, jobDescription?: string): Promise<ATSAnalysisResult> {
    this.validateApiKey()

    try {
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

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an ATS (Applicant Tracking System) expert. Analyze resumes for ATS compatibility and keyword optimization.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(content)
    } catch (error) {
      console.error('OpenAI ATS analysis failed:', error)
      throw new Error(`ATS analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async enhanceSection(sectionType: string, content: string, jobDescription?: string): Promise<ContentEnhancementResult> {
    this.validateApiKey()

    try {
      const prompt = `
        Enhance this ${sectionType} section for a resume:
        
        Current Content: ${content}
        ${jobDescription ? `Target Job: ${jobDescription}` : ''}
        
        Please:
        1. Improve the writing quality and impact
        2. Use action verbs and quantifiable achievements
        3. Optimize for ATS keywords (if job description provided)
        4. Maintain the original intent and truthfulness
        5. Keep it concise and professional
        
        Return the response as a JSON object with the following structure:
        {
          "originalText": "${content}",
          "enhancedText": "improved version",
          "improvements": ["list of specific improvements made"],
          "confidence": number (0-1)
        }
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume writer. Enhance resume sections to be more compelling and ATS-friendly while maintaining accuracy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.5
      })

      const responseContent = response.choices[0].message.content
      if (!responseContent) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(responseContent)
    } catch (error) {
      console.error('OpenAI content enhancement failed:', error)
      throw new Error(`Content enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async generateKeywordSuggestions(resumeContent: object, jobDescription: string): Promise<string[]> {
    this.validateApiKey()

    try {
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

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a keyword optimization expert. Identify missing keywords that would improve resume-job matching.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(content)
    } catch (error) {
      console.error('OpenAI keyword suggestions failed:', error)
      throw new Error(`Keyword suggestions failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}