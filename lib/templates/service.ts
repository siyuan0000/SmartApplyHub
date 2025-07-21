import { TemplateConfig, TemplatePreview, ResumeLanguage, TemplateContext } from './types'
import { englishProfessionalTemplate } from './english-professional'
import { chineseProfessionalTemplate } from './chinese-professional'

export class TemplateService {
  private static templates: TemplateConfig[] = [
    englishProfessionalTemplate,
    chineseProfessionalTemplate,
  ]

  // Get all available templates
  static getAllTemplates(): TemplatePreview[] {
    return this.templates.map(template => ({
      id: template.id,
      name: template.name,
      thumbnail: `/templates/${template.id}-preview.png`,
      language: template.language,
      style: template.style,
      atsScore: template.ats.score
    }))
  }

  // Get templates filtered by language
  static getTemplatesByLanguage(language: ResumeLanguage): TemplatePreview[] {
    return this.getAllTemplates().filter(template => template.language === language)
  }

  // Get a specific template by ID
  static getTemplate(id: string): TemplateConfig | null {
    return this.templates.find(template => template.id === id) || null
  }

  // Get template configuration with context
  static getTemplateContext(templateId: string, language: ResumeLanguage, originalHeaders?: Record<string, string>): TemplateContext | null {
    const template = this.getTemplate(templateId)
    if (!template) return null

    return {
      template,
      originalHeaders,
      language,
      culturalPreferences: template.cultural
    }
  }

  // Get recommended template based on detected language
  static getRecommendedTemplate(detectedLanguage: ResumeLanguage): TemplateConfig {
    const languageTemplates = this.templates.filter(t => t.language === detectedLanguage)
    
    if (languageTemplates.length === 0) {
      // Fallback to English professional template
      return this.templates.find(t => t.id === 'english-professional') || this.templates[0]
    }

    // Return the first professional template for the language
    return languageTemplates.find(t => t.style === 'professional') || languageTemplates[0]
  }

  // Get section display name based on original headers or fallback to template defaults
  static getSectionDisplayName(
    sectionType: string, 
    templateContext: TemplateContext
  ): string {
    // Use original header if available
    if (templateContext.originalHeaders && templateContext.originalHeaders[sectionType]) {
      return templateContext.originalHeaders[sectionType]
    }

    // Fallback to template-specific default headers
    const defaultHeaders = this.getDefaultSectionHeaders(templateContext.template.language)
    return defaultHeaders[sectionType] || sectionType
  }

  // Get default section headers for a language
  private static getDefaultSectionHeaders(language: ResumeLanguage): Record<string, string> {
    if (language === 'zh') {
      return {
        contact: '联系方式',
        summary: '个人简介',
        experience: '工作经历',
        education: '教育背景',
        skills: '技能特长',
        projects: '项目经验',
        certifications: '资格证书',
        languages: '语言能力'
      }
    }

    // English defaults
    return {
      contact: 'Contact Information',
      summary: 'Professional Summary',
      experience: 'Work Experience',
      education: 'Education',
      skills: 'Skills',
      projects: 'Projects',
      certifications: 'Certifications',
      languages: 'Languages'
    }
  }

  // Generate CSS classes for template styling
  static generateTemplateCSS(template: TemplateConfig): string {
    const { typography, colors, spacing, layout } = template

    return `
      .resume-template-${template.id} {
        font-family: ${typography.fontFamily};
        color: ${colors.text.primary};
        background-color: ${colors.background};
        line-height: ${typography.lineHeight.normal};
        margin: ${layout.margins.top} ${layout.margins.right} ${layout.margins.bottom} ${layout.margins.left};
      }

      .resume-template-${template.id} .resume-name {
        font-size: ${typography.fontSize.name};
        font-weight: ${typography.fontWeight.bold};
        color: ${colors.primary};
        margin-bottom: ${spacing.sm};
      }

      .resume-template-${template.id} .resume-title {
        font-size: ${typography.fontSize.title};
        font-weight: ${typography.fontWeight.semibold};
        color: ${colors.secondary};
        margin-bottom: ${spacing.md};
      }

      .resume-template-${template.id} .section-header {
        font-size: ${typography.fontSize.subtitle};
        font-weight: ${typography.fontWeight.semibold};
        color: ${colors.primary};
        border-bottom: 1px solid ${colors.border};
        padding-bottom: ${spacing.xs};
        margin-bottom: ${spacing.md};
        margin-top: ${spacing.section};
      }

      .resume-template-${template.id} .section-content {
        font-size: ${typography.fontSize.body};
        margin-bottom: ${spacing.lg};
      }

      .resume-template-${template.id} .job-title {
        font-weight: ${typography.fontWeight.medium};
        color: ${colors.text.primary};
      }

      .resume-template-${template.id} .company-name {
        color: ${colors.secondary};
        font-weight: ${typography.fontWeight.medium};
      }

      .resume-template-${template.id} .date-range {
        color: ${colors.text.muted};
        font-size: ${typography.fontSize.caption};
      }

      .resume-template-${template.id} .achievement-list {
        list-style: none;
        padding-left: 0;
      }

      .resume-template-${template.id} .achievement-item {
        margin-bottom: ${spacing.xs};
        padding-left: ${spacing.md};
        position: relative;
      }

      .resume-template-${template.id} .achievement-item::before {
        content: "•";
        color: ${colors.accent};
        position: absolute;
        left: 0;
      }

      .resume-template-${template.id} .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: ${spacing.sm};
      }

      .resume-template-${template.id} .contact-info {
        display: flex;
        flex-wrap: wrap;
        gap: ${spacing.md};
        font-size: ${typography.fontSize.caption};
        color: ${colors.text.secondary};
      }
    `
  }
}