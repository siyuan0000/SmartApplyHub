export interface ResumeContact {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  website?: string
}

export interface ResumeExperience {
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description?: string
  achievements?: string[]
}

export interface ResumeEducation {
  degree: string
  school: string
  location?: string
  graduationDate?: string
  gpa?: string
  honors?: string[]
}

export interface ResumeProject {
  name: string
  description: string
  details?: string[]  // Array for bullet points (features/accomplishments)
  technologies?: string[]
  url?: string
  startDate?: string
  endDate?: string
}

export interface ResumeSection {
  section_name: string // Original header text from user's resume
  content: unknown // The actual content for this section
}

export interface ResumeContent {
  contact: ResumeContact
  summary?: string
  experience: ResumeExperience[]
  education: ResumeEducation[]
  skills: string[]
  projects?: ResumeProject[]
  certifications?: string[]
  languages?: string[]
  // Language and cultural metadata
  detected_language?: 'en' | 'zh'
  original_headers?: Record<string, string> // Maps section types to original header text
  raw_text: string
}

export class ResumeParser {
  private static readonly SECTION_PATTERNS = {
    contact: /^(.*?)(?=\n\s*(?:summary|objective|profile|experience|work|education|skills|projects))/i,
    summary: /(?:summary|objective|profile|about)\s*:?\s*\n(.*?)(?=\n\s*(?:experience|work|education|skills|projects))/i,
    experience: /(?:experience|work|employment)\s*:?\s*\n(.*?)(?=\n\s*(?:education|skills|projects|certifications))/i,
    education: /(?:education|academic)\s*:?\s*\n(.*?)(?=\n\s*(?:skills|projects|certifications|languages))/i,
    skills: /(?:skills|technical|technologies)\s*:?\s*\n(.*?)(?=\n\s*(?:projects|certifications|languages|awards))/i,
    projects: /(?:projects|portfolio)\s*:?\s*\n(.*?)(?=\n\s*(?:certifications|languages|awards))/i,
    certifications: /(?:certifications|certificates)\s*:?\s*\n(.*?)(?=\n\s*(?:languages|awards))/i,
    languages: /(?:languages|linguistic)\s*:?\s*\n(.*?)(?=\n\s*(?:awards|references))/i
  }

  private static readonly EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  private static readonly PHONE_PATTERN = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/
  private static readonly URL_PATTERN = /https?:\/\/[^\s]+/g

  static parseResumeText(text: string): ResumeContent {
    const cleanText = this.cleanText(text)
    
    return {
      contact: this.parseContact(cleanText),
      summary: this.parseSummary(cleanText),
      experience: this.parseExperience(cleanText),
      education: this.parseEducation(cleanText),
      skills: this.parseSkills(cleanText),
      projects: this.parseProjects(cleanText),
      certifications: this.parseCertifications(cleanText),
      languages: this.parseLanguages(cleanText),
      raw_text: text
    }
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private static parseContact(text: string): ResumeContact {
    const lines = text.split('\n').slice(0, 10) // Check first 10 lines
    const contact: ResumeContact = {}

    // Extract name (usually first line)
    const firstLine = lines[0]?.trim()
    if (firstLine && !this.EMAIL_PATTERN.test(firstLine) && !this.PHONE_PATTERN.test(firstLine)) {
      contact.name = firstLine
    }

    // Extract email
    const emailMatch = text.match(this.EMAIL_PATTERN)
    if (emailMatch) {
      contact.email = emailMatch[0]
    }

    // Extract phone
    const phoneMatch = text.match(this.PHONE_PATTERN)
    if (phoneMatch) {
      contact.phone = phoneMatch[0]
    }

    // Extract LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/[^\s]+/i)
    if (linkedinMatch) {
      contact.linkedin = linkedinMatch[0]
    }

    // Extract GitHub
    const githubMatch = text.match(/github\.com\/[^\s]+/i)
    if (githubMatch) {
      contact.github = githubMatch[0]
    }

    // Extract location (common patterns)
    const locationMatch = text.match(/(?:^|\n)\s*([A-Za-z\s]+,\s*[A-Za-z]{2,})\s*(?:\n|$)/m)
    if (locationMatch) {
      contact.location = locationMatch[1]
    }

    return contact
  }

  private static parseSummary(text: string): string | undefined {
    const match = text.match(this.SECTION_PATTERNS.summary)
    if (match) {
      return match[1].trim().replace(/\n/g, ' ')
    }
    return undefined
  }

  private static parseExperience(text: string): ResumeExperience[] {
    const match = text.match(this.SECTION_PATTERNS.experience)
    if (!match) return []

    const experienceText = match[1]
    const experiences: ResumeExperience[] = []
    
    // Split by job entries (look for patterns like "Company Name" or "Job Title at Company")
    const jobEntries = experienceText.split(/\n(?=[A-Z][A-Za-z\s&]+(?:,|\n))/g)
    
    for (const entry of jobEntries) {
      const lines = entry.trim().split('\n')
      if (lines.length < 2) continue

      const experience: ResumeExperience = {
        title: '',
        company: '',
        description: ''
      }

      // Parse first few lines for title, company, dates
      const firstLine = lines[0].trim()
      const secondLine = lines[1]?.trim()

      // Try to identify title and company
      if (firstLine.includes(' at ')) {
        const [title, company] = firstLine.split(' at ')
        experience.title = title.trim()
        experience.company = company.trim()
      } else if (secondLine && secondLine.includes(' at ')) {
        experience.title = firstLine
        const [, company] = secondLine.split(' at ')
        experience.company = company.trim()
      } else {
        experience.title = firstLine
        experience.company = secondLine || ''
      }

      // Extract dates
      const dateMatch = entry.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/i)
      if (dateMatch) {
        experience.startDate = dateMatch[1]
        experience.endDate = dateMatch[2].toLowerCase() === 'present' || dateMatch[2].toLowerCase() === 'current' ? undefined : dateMatch[2]
        experience.current = dateMatch[2].toLowerCase() === 'present' || dateMatch[2].toLowerCase() === 'current'
      }

      // Extract description (remaining lines)
      const descriptionLines = lines.slice(2).filter(line => line.trim())
      experience.description = descriptionLines.join(' ').trim()

      experiences.push(experience)
    }

    return experiences
  }

  private static parseEducation(text: string): ResumeEducation[] {
    const match = text.match(this.SECTION_PATTERNS.education)
    if (!match) return []

    const educationText = match[1]
    const education: ResumeEducation[] = []
    
    const entries = educationText.split(/\n(?=[A-Z])/g)
    
    for (const entry of entries) {
      const lines = entry.trim().split('\n')
      if (lines.length < 2) continue

      const edu: ResumeEducation = {
        degree: lines[0].trim(),
        school: lines[1]?.trim() || ''
      }

      // Extract graduation date
      const dateMatch = entry.match(/(\d{4})/g)
      if (dateMatch) {
        edu.graduationDate = dateMatch[dateMatch.length - 1]
      }

      // Extract GPA
      const gpaMatch = entry.match(/gpa\s*:?\s*(\d+\.?\d*)/i)
      if (gpaMatch) {
        edu.gpa = gpaMatch[1]
      }

      education.push(edu)
    }

    return education
  }

  private static parseSkills(text: string): string[] {
    const match = text.match(this.SECTION_PATTERNS.skills)
    if (!match) return []

    const skillsText = match[1]
    const skills: string[] = []
    
    // Split by common delimiters
    const skillItems = skillsText.split(/[,•·\n]/).map(s => s.trim()).filter(s => s.length > 0)
    
    for (const item of skillItems) {
      // Remove common prefixes/suffixes
      const cleanItem = item.replace(/^[-•·\s]+/, '').replace(/[-•·\s]+$/, '')
      if (cleanItem.length > 1) {
        skills.push(cleanItem)
      }
    }

    return skills
  }

  private static parseProjects(text: string): ResumeProject[] {
    const match = text.match(this.SECTION_PATTERNS.projects)
    if (!match) return []

    const projectsText = match[1]
    const projects: ResumeProject[] = []
    
    const entries = projectsText.split(/\n(?=[A-Z])/g)
    
    for (const entry of entries) {
      const lines = entry.trim().split('\n')
      if (lines.length < 2) continue

      const project: ResumeProject = {
        name: lines[0].trim(),
        description: lines.slice(1).join(' ').trim()
      }

      // Extract URL
      const urlMatch = entry.match(this.URL_PATTERN)
      if (urlMatch) {
        project.url = urlMatch[0]
      }

      projects.push(project)
    }

    return projects
  }

  private static parseCertifications(text: string): string[] {
    const match = text.match(this.SECTION_PATTERNS.certifications)
    if (!match) return []

    return match[1]
      .split(/[,\n]/)
      .map(cert => cert.trim())
      .filter(cert => cert.length > 0)
  }

  private static parseLanguages(text: string): string[] {
    const match = text.match(this.SECTION_PATTERNS.languages)
    if (!match) return []

    return match[1]
      .split(/[,\n]/)
      .map(lang => lang.trim())
      .filter(lang => lang.length > 0)
  }
}