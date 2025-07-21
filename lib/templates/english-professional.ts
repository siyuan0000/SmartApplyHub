import { TemplateConfig } from './types'

export const englishProfessionalTemplate: TemplateConfig = {
  id: 'english-professional',
  name: 'Professional English',
  description: 'Clean, ATS-friendly professional template for English resumes',
  language: 'en',
  style: 'professional',
  layout: {
    pageSize: 'Letter',
    margins: {
      top: '1in',
      right: '0.75in',
      bottom: '1in',
      left: '0.75in'
    },
    columns: 1,
    sectionSpacing: '1.5rem',
    headerSpacing: '1rem'
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      name: '2.25rem',      // 36px
      title: '1.125rem',    // 18px
      subtitle: '1rem',     // 16px
      body: '0.875rem',     // 14px
      caption: '0.75rem'    // 12px
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  colors: {
    primary: '#1f2937',     // Gray-800
    secondary: '#374151',   // Gray-700
    accent: '#3b82f6',      // Blue-500
    text: {
      primary: '#111827',   // Gray-900
      secondary: '#6b7280', // Gray-500
      muted: '#9ca3af'      // Gray-400
    },
    background: '#ffffff',
    border: '#e5e7eb'       // Gray-200
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    section: '2rem',
    page: '3rem'
  },
  sectionOrder: {
    contact: 1,
    summary: 2,
    experience: 3,
    education: 4,
    skills: 5,
    projects: 6,
    certifications: 7,
    languages: 8
  },
  cultural: {
    showPhoto: false,
    nameFormat: 'western',
    dateFormat: 'western',
    addressFormat: 'western'
  },
  ats: {
    friendly: true,
    score: 95
  }
}