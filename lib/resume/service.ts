import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { ResumeContent } from './parser'
import { getCurrentUserProfile } from '@/lib/supabase/user'

type ResumeRow = Database['public']['Tables']['resumes']['Row']
type ResumeInsert = Database['public']['Tables']['resumes']['Insert']
type ResumeUpdate = Database['public']['Tables']['resumes']['Update']

export interface CreateResumeData {
  title: string
  content: ResumeContent
  file_url?: string
  user_id: string
}

export interface UpdateResumeData {
  title?: string
  content?: ResumeContent
  file_url?: string
  version?: number
  is_active?: boolean
}

export class ResumeService {
  static async createResume(data: CreateResumeData): Promise<ResumeRow> {

    // Ensure user profile exists before creating resume
    await getCurrentUserProfile()

    const insertData: ResumeInsert = {
      title: data.title,
      content: data.content as unknown as Database['public']['Tables']['resumes']['Insert']['content'],
      file_url: data.file_url,
      user_id: data.user_id,
      version: 1,
      is_active: false
    }


    const { data: resume, error } = await supabase
      .from('resumes')
      .insert(insertData)
      .select()
      .single()


    if (error) {
      
      if (error.code === '23503') {
        throw new Error('User profile not found. Please refresh the page and try again.')
      }
      if (error.message.includes('row-level security')) {
        throw new Error('Permission denied. Please ensure you are logged in and try again.')
      }
      throw new Error(`Failed to create resume: ${error.message}`)
    }

    return resume
  }

  static async updateResume(id: string, data: UpdateResumeData): Promise<ResumeRow> {
    const updateData: ResumeUpdate = {
      ...data,
      content: data.content as unknown as Database['public']['Tables']['resumes']['Update']['content'],
      updated_at: new Date().toISOString()
    }

    const { data: resume, error } = await supabase
      .from('resumes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update resume: ${error.message}`)
    }

    return resume
  }

  static async getUserResumes(userId: string): Promise<ResumeRow[]> {
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        throw new Error('Database setup required: Please run the SQL schema in your Supabase dashboard. Check the console for instructions.')
      }
      throw new Error(`Failed to fetch resumes: ${error.message}`)
    }

    return resumes || []
  }

  static async getResume(id: string): Promise<ResumeRow | null> {
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Resume not found
      }
      throw new Error(`Failed to fetch resume: ${error.message}`)
    }

    return resume
  }

  static async deleteResume(id: string): Promise<void> {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete resume: ${error.message}`)
    }
  }

  static async setActiveResume(id: string, userId: string): Promise<void> {
    // First, set all resumes to inactive
    const { error: deactivateError } = await supabase
      .from('resumes')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (deactivateError) {
      throw new Error(`Failed to deactivate resumes: ${deactivateError.message}`)
    }

    // Then, set the specific resume to active
    const { error: activateError } = await supabase
      .from('resumes')
      .update({ is_active: true })
      .eq('id', id)

    if (activateError) {
      throw new Error(`Failed to activate resume: ${activateError.message}`)
    }
  }

  static async duplicateResume(id: string, newTitle: string): Promise<ResumeRow> {
    const originalResume = await this.getResume(id)
    if (!originalResume) {
      throw new Error('Resume not found')
    }

    const duplicateData: ResumeInsert = {
      title: newTitle,
      content: originalResume.content,
      file_url: originalResume.file_url,
      user_id: originalResume.user_id,
      version: 1,
      is_active: false
    }

    const { data: duplicate, error } = await supabase
      .from('resumes')
      .insert(duplicateData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to duplicate resume: ${error.message}`)
    }

    return duplicate
  }

  static async incrementVersion(id: string): Promise<ResumeRow> {
    const resume = await this.getResume(id)
    if (!resume) {
      throw new Error('Resume not found')
    }

    return await this.updateResume(id, {
      version: resume.version + 1
    })
  }

  static parseResumeContent(resume: ResumeRow): ResumeContent {
    try {
      return resume.content as unknown as ResumeContent
    } catch {
      throw new Error('Invalid resume content format')
    }
  }

  static async getResumeStats(userId: string): Promise<{
    total: number
    active: number
    lastUpdated: string | null
  }> {
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('is_active, updated_at')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to fetch resume stats: ${error.message}`)
    }

    const stats = {
      total: resumes.length,
      active: resumes.filter(r => r.is_active).length,
      lastUpdated: resumes.length > 0 ? resumes[0].updated_at : null
    }

    return stats
  }
}