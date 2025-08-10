export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          linkedin: string | null
          github: string | null
          bio: string | null
          job_titles: string[]
          preferred_location: string | null
          salary_min: number | null
          salary_max: number | null
          job_type: string[]
          experience_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | null
          skills: string[]
          industries: string[]
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          linkedin?: string | null
          github?: string | null
          bio?: string | null
          job_titles?: string[]
          preferred_location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          job_type?: string[]
          experience_level?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | null
          skills?: string[]
          industries?: string[]
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          linkedin?: string | null
          github?: string | null
          bio?: string | null
          job_titles?: string[]
          preferred_location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          job_type?: string[]
          experience_level?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | null
          skills?: string[]
          industries?: string[]
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: Json
          file_url: string | null
          language: 'en' | 'zh' | 'auto'
          detected_language: 'en' | 'zh' | null
          original_headers: Json | null
          job_roles: string[]
          industries: string[]
          optimization_tags: Json
          target_roles: string[]
          applied_to: string[]
          version: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: Json
          file_url?: string | null
          language?: 'en' | 'zh' | 'auto'
          detected_language?: 'en' | 'zh' | null
          original_headers?: Json | null
          job_roles?: string[]
          industries?: string[]
          optimization_tags?: Json
          target_roles?: string[]
          applied_to?: string[]
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: Json
          file_url?: string | null
          language?: 'en' | 'zh' | 'auto'
          detected_language?: 'en' | 'zh' | null
          original_headers?: Json | null
          job_roles?: string[]
          industries?: string[]
          optimization_tags?: Json
          target_roles?: string[]
          applied_to?: string[]
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          user_id: string
          job_posting_id: string | null
          company_name: string
          position_title: string
          status: 'pending' | 'applied' | 'interview' | 'offer' | 'rejected'
          applied_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_posting_id?: string | null
          company_name: string
          position_title: string
          status?: 'pending' | 'applied' | 'interview' | 'offer' | 'rejected'
          applied_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_posting_id?: string | null
          company_name?: string
          position_title?: string
          status?: 'pending' | 'applied' | 'interview' | 'offer' | 'rejected'
          applied_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_postings: {
        Row: {
          id: string
          title: string
          company_name: string
          location: string
          description: string
          requirements: string | null
          salary_range: string | null
          job_type: 'full-time' | 'part-time' | 'contract' | 'internship'
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          company_name: string
          location: string
          description: string
          requirements?: string | null
          salary_range?: string | null
          job_type: 'full-time' | 'part-time' | 'contract' | 'internship'
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          company_name?: string
          location?: string
          description?: string
          requirements?: string | null
          salary_range?: string | null
          job_type?: 'full-time' | 'part-time' | 'contract' | 'internship'
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_reviews: {
        Row: {
          id: string
          user_id: string
          resume_id: string
          review_type: 'optimization' | 'ats_analysis' | 'skill_gap'
          feedback: Json
          score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resume_id: string
          review_type: 'optimization' | 'ats_analysis' | 'skill_gap'
          feedback: Json
          score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resume_id?: string
          review_type?: 'optimization' | 'ats_analysis' | 'skill_gap'
          feedback?: Json
          score?: number | null
          created_at?: string
        }
      }
      application_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          subject: string
          content: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          subject: string
          content: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          subject?: string
          content?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_settings: {
        Row: {
          id: string
          user_id: string
          email_address: string
          email_password: string | null
          smtp_host: string
          smtp_port: number
          use_tls: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_address: string
          email_password?: string | null
          smtp_host?: string
          smtp_port?: number
          use_tls?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_address?: string
          email_password?: string | null
          smtp_host?: string
          smtp_port?: number
          use_tls?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_logs: {
        Row: {
          id: string
          user_id: string
          job_application_id: string | null
          to_email: string
          subject: string
          body: string
          attachments: Json
          status: 'pending' | 'sent' | 'failed' | 'bounced'
          error_message: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_application_id?: string | null
          to_email: string
          subject: string
          body: string
          attachments?: Json
          status?: 'pending' | 'sent' | 'failed' | 'bounced'
          error_message?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_application_id?: string | null
          to_email?: string
          subject?: string
          body?: string
          attachments?: Json
          status?: 'pending' | 'sent' | 'failed' | 'bounced'
          error_message?: string | null
          sent_at?: string | null
          created_at?: string
        }
      }
    }
  }
}