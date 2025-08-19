import { AIResponse, AITaskConfig } from '../types'
import { route2all } from '../route2all'

/**
 * Resume parsing utility functions
 */
export class ResumeParser {
  /**
   * Parse raw resume text into structured format
   */
  static async parseResume(rawText: string): Promise<AIResponse> {
    return route2all(rawText, {
      task: 'parsing',
      temperature: 0.1,
      maxTokens: 3000,
      requiresStructured: true
    })
  }

  /**
   * Analyze resume content and provide feedback
   */
  static async analyzeResume(resumeContent: object): Promise<AIResponse> {
    const prompt = `Analyze this resume and provide detailed feedback:\n\n${JSON.stringify(resumeContent, null, 2)}`
    return route2all(prompt, {
      task: 'analysis',
      temperature: 0.3,
      maxTokens: 2000
    })
  }

  /**
   * Generate template-based About section when AI fails
   */
  static generateTemplateAbout(userMessage: string): string {
    // Try to extract information from the user's message
    const hasExperience = userMessage.toLowerCase().includes('engineer') || 
                         userMessage.toLowerCase().includes('developer') ||
                         userMessage.toLowerCase().includes('manager')
    
    const hasTech = userMessage.toLowerCase().includes('javascript') ||
                   userMessage.toLowerCase().includes('python') ||
                   userMessage.toLowerCase().includes('react') ||
                   userMessage.toLowerCase().includes('node')
    
    const hasEducation = userMessage.toLowerCase().includes('university') ||
                        userMessage.toLowerCase().includes('college') ||
                        userMessage.toLowerCase().includes('degree')

    // Generate a basic template-based about section
    let aboutText = "I am a dedicated professional with a passion for innovation and excellence. "
    
    if (hasExperience) {
      aboutText += "With proven experience in my field, I bring a unique combination of technical skills and strategic thinking to every project. "
    }
    
    if (hasTech) {
      aboutText += "My technical expertise spans modern technologies and frameworks, allowing me to build robust and scalable solutions. "
    }
    
    if (hasEducation) {
      aboutText += "My educational background provides a solid foundation for continuous learning and professional growth. "
    }
    
    aboutText += "I am committed to delivering high-quality results and collaborating effectively with teams to achieve shared goals. "
    aboutText += "I'm always eager to take on new challenges and contribute to meaningful projects that make a positive impact."

    return aboutText + "\n\n⚠️ Note: This is a template response generated when AI services are unavailable. Please try again later for a personalized About section, or edit this content to better reflect your unique experience and goals."
  }
}

