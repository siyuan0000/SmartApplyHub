import { TemplateConfig } from './types'

export const chineseProfessionalTemplate: TemplateConfig = {
  id: 'chinese-professional',
  name: '专业中文简历',
  description: '适合中文简历的专业模板，符合中国求职文化',
  language: 'zh',
  style: 'professional',
  layout: {
    pageSize: 'A4',
    margins: {
      top: '2.5cm',
      right: '2cm',
      bottom: '2.5cm',
      left: '2cm'
    },
    columns: 1,
    sectionSpacing: '1.5rem',
    headerSpacing: '1rem'
  },
  typography: {
    fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif',
    fontSize: {
      name: '2rem',         // 32px - slightly smaller for Chinese names
      title: '1rem',        // 16px
      subtitle: '0.875rem', // 14px
      body: '0.8125rem',    // 13px - slightly smaller for Chinese text density
      caption: '0.75rem'    // 12px
    },
    lineHeight: {
      tight: '1.3',         // Tighter for Chinese characters
      normal: '1.6',        // Better for Chinese readability
      relaxed: '1.8'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  colors: {
    primary: '#1a1a1a',     // Darker for Chinese text
    secondary: '#333333',   
    accent: '#c41e3a',      // Chinese red accent
    text: {
      primary: '#000000',   // Pure black for Chinese characters
      secondary: '#555555', 
      muted: '#888888'      
    },
    background: '#ffffff',
    border: '#cccccc'       
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    section: '1.75rem',     // Slightly tighter section spacing
    page: '2.5rem'
  },
  sectionOrder: {
    contact: 1,             // 联系方式
    summary: 2,             // 个人简介
    education: 3,           // 教育背景 (often comes before experience in China)
    experience: 4,          // 工作经历
    skills: 5,              // 技能特长
    projects: 6,            // 项目经验
    certifications: 7,      // 资格证书
    languages: 8            // 语言能力
  },
  cultural: {
    showPhoto: true,        // Chinese resumes traditionally include photos
    nameFormat: 'eastern',  // 张三 format
    dateFormat: 'chinese',  // YYYY年MM月 format
    addressFormat: 'chinese' // Chinese address format
  },
  ats: {
    friendly: true,
    score: 88              // Slightly lower due to photo inclusion
  }
}