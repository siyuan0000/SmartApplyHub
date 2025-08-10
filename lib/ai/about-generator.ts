import { route2all } from './route2all'
import { ResumeContent } from '@/lib/resume/parser'

export interface AboutGenerationResult {
  aboutText: string
  wordCount: number
  generatedAt: Date
  provider?: string
}

export class AboutGenerator {
  /**
   * Extract key information from resume data for about generation
   */
  private static extractResumeInfo(resumeData: ResumeContent): string {
    const infoParts: string[] = []
    
    // Extract basic contact information
    const contact = resumeData.contact
    if (contact?.name) {
      infoParts.push(`Name: ${contact.name}`)
    }
    if (contact?.location) {
      infoParts.push(`Location: ${contact.location}`)
    }
    
    // Extract education background
    if (resumeData.education && resumeData.education.length > 0) {
      const latestEdu = resumeData.education[0] // Assume most recent first
      const school = latestEdu.school
      const degree = latestEdu.degree
      if (school && degree) {
        infoParts.push(`Education: ${degree} at ${school}`)
      }
    }
    
    // Extract current/recent work experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      const currentExp = resumeData.experience[0] // Most recent experience
      const title = currentExp.title
      const company = currentExp.company
      if (title && company) {
        infoParts.push(`Current Position: ${title} at ${company}`)
      }
      if (currentExp.description) {
        infoParts.push(`Role Description: ${currentExp.description}`)
      }
      if (currentExp.achievements && currentExp.achievements.length > 0) {
        infoParts.push(`Key Achievements: ${currentExp.achievements.slice(0, 3).join('; ')}`)
      }
    }
    
    // Extract skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      const topSkills = resumeData.skills.slice(0, 8).join(', ')
      infoParts.push(`Key Skills: ${topSkills}`)
    }
    
    // Extract projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      const notableProjects = resumeData.projects.slice(0, 2)
        .map(p => p.name).join(', ')
      infoParts.push(`Notable Projects: ${notableProjects}`)
    }
    
    // Extract certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      const certs = resumeData.certifications.slice(0, 3).join(', ')
      infoParts.push(`Certifications: ${certs}`)
    }
    
    return infoParts.join('\n')
  }
  
  /**
   * Create system prompt for about generation
   */
  private static createSystemPrompt(): string {
    return `You are a professional LinkedIn About section generator. Create a compelling, 
professional LinkedIn About section that will attract recruiters and networking opportunities.

Requirements:
1. Write in first person perspective
2. Keep it between 100-150 words
3. Professional but engaging tone
4. Highlight key achievements and expertise
5. Include career goals or aspirations
6. Make it memorable and authentic
7. Focus on value proposition to employers
8. Use active voice and strong action words

The About section should flow naturally and tell a cohesive professional story that showcases the candidate's unique value.`
  }
  
  /**
   * Create user prompt with resume information
   */
  private static createUserPrompt(resumeInfo: string): string {
    return `Based on the following resume information, generate a professional LinkedIn About section:

${resumeInfo}

Please create a compelling LinkedIn About section that highlights the most important aspects of this person's background and makes them stand out to potential employers and connections.`
  }
  
  /**
   * Generate LinkedIn-style About section from resume data
   */
  static async generateAbout(resumeData: ResumeContent): Promise<AboutGenerationResult> {
    try {
      // Extract key resume information
      const resumeInfo = this.extractResumeInfo(resumeData)
      
      // Create prompts
      const systemPrompt = this.createSystemPrompt()
      const userPrompt = this.createUserPrompt(resumeInfo)
      
      // Generate about text using AI router
      const response = await route2all([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        task: 'generation',
        temperature: 0.7,
        maxTokens: 250,
        preferredProvider: 'deepseek' // DeepSeek is good at professional content
      })
      
      let aboutText = response.content.trim()
      
      // Clean up the response if it contains template warnings
      if (aboutText.includes('⚠️ Note: This is a template response')) {
        // For template responses, provide helpful guidance
        const parts = aboutText.split('⚠️ Note:')
        aboutText = parts[0].trim()
        
        // If it's clearly a template, enhance it with resume data
        if (response.provider === 'local-fallback') {
          aboutText = this.enhanceTemplateWithResumeData(aboutText, resumeData)
        }
      }
      
      const wordCount = aboutText.split(/\s+/).length
      
      return {
        aboutText,
        wordCount,
        generatedAt: new Date(),
        provider: response.provider
      }
    } catch (error) {
      console.error('About generation failed:', error)
      
      // Check if it's a network or configuration error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        console.warn('Network error detected, using offline fallback')
      } else if (errorMessage.includes('No AI providers configured')) {
        console.warn('No AI providers available, using offline fallback')
      } else {
        console.warn('Unexpected error, using offline fallback')
      }
      
      // Provide a more helpful fallback
      return this.generateOfflineFallback(resumeData)
    }
  }
  
  /**
   * Generate multiple About variations for the user to choose from
   */
  static async generateAboutVariations(
    resumeData: ResumeContent, 
    count: number = 3
  ): Promise<AboutGenerationResult[]> {
    const variations: AboutGenerationResult[] = []
    
    // Generate variations with different approaches
    const approaches = [
      {
        style: 'achievement-focused',
        instruction: 'Focus primarily on key achievements and quantifiable results.'
      },
      {
        style: 'passion-driven',
        instruction: 'Emphasize passion for the field and career aspirations.'
      },
      {
        style: 'expertise-centered',
        instruction: 'Highlight technical expertise and core competencies.'
      }
    ]
    
    for (let i = 0; i < Math.min(count, approaches.length); i++) {
      try {
        const approach = approaches[i]
        const resumeInfo = this.extractResumeInfo(resumeData)
        
        const systemPrompt = `${this.createSystemPrompt()}

Style guidance: ${approach.instruction}`
        
        const userPrompt = this.createUserPrompt(resumeInfo)
        
        const response = await route2all([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ], {
          task: 'generation',
          temperature: 0.6 + (i * 0.1), // Slight variation in creativity
          maxTokens: 250
        })
        
        let aboutText = response.content.trim()
        
        // Clean up template responses
        if (aboutText.includes('⚠️ Note: This is a template response')) {
          const parts = aboutText.split('⚠️ Note:')
          aboutText = parts[0].trim()
        }
        
        const wordCount = aboutText.split(/\s+/).length
        
        variations.push({
          aboutText,
          wordCount,
          generatedAt: new Date(),
          provider: response.provider
        })
        
        // Small delay between requests to avoid rate limiting
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Failed to generate variation ${i + 1}:`, error)
        
        // Generate an offline fallback variation with different style
        const fallbackVariation = this.generateStyledFallback(resumeData, approaches[i].style)
        variations.push(fallbackVariation)
      }
    }
    
            // If no variations were generated, provide at least one fallback
        if (variations.length === 0) {
          variations.push(this.generateOfflineFallback(resumeData))
        }
    
    return variations
  }
  
  /**
   * Enhance existing about text with resume context
   */
  static async enhanceExistingAbout(
    currentAbout: string,
    resumeData: ResumeContent
  ): Promise<AboutGenerationResult> {
    try {
      const resumeInfo = this.extractResumeInfo(resumeData)
      
      const systemPrompt = `You are a professional LinkedIn About section editor. Improve the given About section using additional resume information.

Requirements:
1. Maintain the person's voice and style
2. Incorporate relevant missing information
3. Keep it 100-150 words
4. Improve clarity and impact
5. Ensure professional tone
6. Make it more compelling to recruiters`
      
      const userPrompt = `Current About section:
${currentAbout}

Additional resume information to potentially incorporate:
${resumeInfo}

Please enhance this About section to make it more compelling while maintaining the original voice and style.`
      
      const response = await route2all([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        task: 'enhancement',
        temperature: 0.5,
        maxTokens: 250
      })
      
      const aboutText = response.content.trim()
      const wordCount = aboutText.split(/\s+/).length
      
      return {
        aboutText,
        wordCount,
        generatedAt: new Date(),
        provider: response.provider
      }
    } catch (error) {
      console.error('Failed to enhance about section:', error)
      throw new Error(`About enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate an offline fallback About section using resume data
   */
  private static generateOfflineFallback(resumeData: ResumeContent): AboutGenerationResult {
    let aboutText = "I am a dedicated professional"
    
    // Add experience context
    if (resumeData.experience && resumeData.experience.length > 0) {
      const currentRole = resumeData.experience[0]
      if (currentRole.title && currentRole.company) {
        aboutText = `I am a ${currentRole.title.toLowerCase()}`
        if (resumeData.experience.length > 1) {
          aboutText += ` with proven experience across multiple organizations`
        }
      }
    }
    
    aboutText += ". "
    
    // Add skills context
    if (resumeData.skills && resumeData.skills.length > 0) {
      const topSkills = resumeData.skills.slice(0, 4).join(', ')
      aboutText += `My expertise includes ${topSkills}, which I leverage to deliver high-quality solutions. `
    }
    
    // Add education context
    if (resumeData.education && resumeData.education.length > 0) {
      const degree = resumeData.education[0]
      if (degree.degree && degree.school) {
        aboutText += `My ${degree.degree} from ${degree.school} provides a strong foundation for my professional work. `
      }
    }
    
    // Add achievement context
    if (resumeData.experience && resumeData.experience[0]?.achievements?.length) {
      aboutText += "I have a track record of delivering measurable results and driving positive impact in my roles. "
    }
    
    // Professional closing
    aboutText += "I am passionate about continuous learning and collaborating with teams to achieve shared goals. "
    aboutText += "I'm always open to new opportunities and challenges that allow me to contribute meaningfully to organizational success."
    
    aboutText += `\n\n💡 Generated offline due to connectivity issues. Please check your internet connection and try the AI-powered generation for a more personalized result.`
    
    const wordCount = aboutText.split(/\s+/).length
    
    return {
      aboutText,
      wordCount,
      generatedAt: new Date(),
      provider: 'offline-fallback'
    }
  }

  /**
   * Enhance template text with specific resume data
   */
  private static enhanceTemplateWithResumeData(templateText: string, resumeData: ResumeContent): string {
    let enhanced = templateText
    
    // Replace generic terms with specific data
    if (resumeData.contact?.name) {
      enhanced = enhanced.replace(/I am a dedicated professional/i, `I'm ${resumeData.contact.name}, a dedicated professional`)
    }
    
    if (resumeData.experience && resumeData.experience[0]) {
      const currentRole = resumeData.experience[0]
      if (currentRole.title) {
        enhanced = enhanced.replace(/in my field/i, `as a ${currentRole.title}`)
      }
      if (currentRole.company) {
        enhanced = enhanced.replace(/to every project/i, `at ${currentRole.company} and beyond`)
      }
    }
    
    if (resumeData.skills && resumeData.skills.length > 0) {
      const skills = resumeData.skills.slice(0, 3).join(', ')
      enhanced = enhanced.replace(/modern technologies and frameworks/i, `${skills} and related technologies`)
    }
    
    return enhanced
  }

  /**
   * Generate styled fallback variations
   */
  private static generateStyledFallback(resumeData: ResumeContent, style: string): AboutGenerationResult {
    const baseText = this.generateOfflineFallback(resumeData)
    let styledText = baseText.aboutText.replace(/💡 Generated offline.*$/, '').trim()
    
    // Apply different styling based on the approach
    switch (style) {
      case 'achievement-focused':
        if (resumeData.experience && resumeData.experience[0]?.achievements?.length) {
          styledText = styledText.replace(/track record of delivering measurable results/, 
            `proven track record including ${resumeData.experience[0].achievements[0].toLowerCase()}`)
        }
        styledText += `\n\n📊 Style: Achievement-focused variation (generated offline)`
        break
        
      case 'passion-driven':
        styledText = styledText.replace(/I am passionate about/, 'I am deeply passionate about')
        styledText = styledText.replace(/continuous learning/, 'continuous learning and innovation')
        styledText += `\n\n🔥 Style: Passion-driven variation (generated offline)`
        break
        
      case 'expertise-centered':
        if (resumeData.skills && resumeData.skills.length > 0) {
          const expertiseArea = resumeData.skills[0]
          styledText = styledText.replace(/My expertise includes/, `As a ${expertiseArea} specialist, my expertise includes`)
        }
        styledText += `\n\n🔧 Style: Expertise-centered variation (generated offline)`
        break
    }
    
    return {
      aboutText: styledText,
      wordCount: styledText.split(/\s+/).length,
      generatedAt: new Date(),
      provider: `offline-fallback-${style}`
    }
  }
}