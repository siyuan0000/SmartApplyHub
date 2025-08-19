import { AIResponse, AITaskConfig } from '../types'
import { route2all } from '../route2all'

/**
 * Cover letter generation utility functions
 */
export class CoverLetterGenerator {
  /**
   * Generate a professional cover letter based on resume and job description
   */
  static async generateCoverLetter(resumeContent: object, jobDescription: string): Promise<AIResponse> {
    const prompt = `Generate a professional cover letter based on this resume and job description:

Resume: ${JSON.stringify(resumeContent, null, 2)}

Job Description: ${jobDescription}

Please create a compelling, personalized cover letter.`

    return route2all(prompt, {
      task: 'generation',
      temperature: 0.7,
      maxTokens: 1000
    })
  }

  /**
   * Generate a cover letter with specific focus areas
   */
  static async generateTargetedCoverLetter(
    resumeContent: object, 
    jobDescription: string, 
    focusAreas: string[]
  ): Promise<AIResponse> {
    const prompt = `Generate a professional cover letter based on this resume and job description, with special focus on: ${focusAreas.join(', ')}

Resume: ${JSON.stringify(resumeContent, null, 2)}

Job Description: ${jobDescription}

Focus Areas: ${focusAreas.join(', ')}

Please create a compelling, personalized cover letter that emphasizes these specific areas.`

    return route2all(prompt, {
      task: 'generation',
      temperature: 0.7,
      maxTokens: 1200
    })
  }

  /**
   * Generate a cover letter for a specific company
   */
  static async generateCompanySpecificCoverLetter(
    resumeContent: object, 
    jobDescription: string, 
    companyName: string,
    companyInfo?: string
  ): Promise<AIResponse> {
    const companyContext = companyInfo ? `\nCompany Information: ${companyInfo}` : ''
    
    const prompt = `Generate a professional cover letter for ${companyName} based on this resume and job description:${companyContext}

Resume: ${JSON.stringify(resumeContent, null, 2)}

Job Description: ${jobDescription}

Please create a compelling, personalized cover letter that shows enthusiasm for working at ${companyName} and aligns with their values and mission.`

    return route2all(prompt, {
      task: 'generation',
      temperature: 0.7,
      maxTokens: 1200
    })
  }
}

