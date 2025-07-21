// Template system types for resume formatting and styling

export type ResumeLanguage = 'en' | 'zh'
export type TemplateStyle = 'professional' | 'modern' | 'classic' | 'creative'

export interface TemplateTypography {
  fontFamily: string
  fontSize: {
    name: string
    title: string
    subtitle: string
    body: string
    caption: string
  }
  lineHeight: {
    tight: string
    normal: string
    relaxed: string
  }
  fontWeight: {
    normal: string
    medium: string
    semibold: string
    bold: string
  }
}

export interface TemplateColors {
  primary: string
  secondary: string
  accent: string
  text: {
    primary: string
    secondary: string
    muted: string
  }
  background: string
  border: string
}

export interface TemplateSpacing {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  section: string
  page: string
}

export interface TemplateSectionOrder {
  contact: number
  summary: number
  experience: number
  education: number
  skills: number
  projects: number
  certifications: number
  languages: number
}

export interface TemplateLayout {
  pageSize: 'A4' | 'Letter'
  margins: {
    top: string
    right: string
    bottom: string
    left: string
  }
  columns: 1 | 2
  sectionSpacing: string
  headerSpacing: string
}

export interface TemplateConfig {
  id: string
  name: string
  description: string
  language: ResumeLanguage
  style: TemplateStyle
  layout: TemplateLayout
  typography: TemplateTypography
  colors: TemplateColors
  spacing: TemplateSpacing
  sectionOrder: TemplateSectionOrder
  cultural: {
    showPhoto: boolean // Chinese resumes often include photos
    nameFormat: 'western' | 'eastern' // John Doe vs 张三
    dateFormat: 'western' | 'chinese' // MM/YYYY vs YYYY年MM月
    addressFormat: 'western' | 'chinese'
  }
  ats: {
    friendly: boolean
    score: number // 1-100, how ATS-friendly this template is
  }
}

export interface TemplatePreview {
  id: string
  name: string
  thumbnail: string
  language: ResumeLanguage
  style: TemplateStyle
  atsScore: number
}

// Section mapping for dynamic headers
export interface SectionMapping {
  [key: string]: string // Maps section types to display names
}

// Template context for rendering
export interface TemplateContext {
  template: TemplateConfig
  originalHeaders?: Record<string, string>
  language: ResumeLanguage
  culturalPreferences?: Partial<TemplateConfig['cultural']>
}