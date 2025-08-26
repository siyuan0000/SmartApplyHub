import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { ResumeContent } from './parser'
import { getCurrentUserProfile } from '@/lib/supabase/user'
import { StorageService } from '@/lib/supabase/storage'
import { saveLogger } from '@/lib/debug/save-logger'

type ResumeRow = Database['public']['Tables']['resumes']['Row']
type ResumeInsert = Database['public']['Tables']['resumes']['Insert']

export interface CreateResumeData {
  title: string
  content: ResumeContent
  file_url?: string
  user_id: string
  language?: 'en' | 'zh' | 'auto'
  detected_language?: 'en' | 'zh'
  original_headers?: Record<string, string>
}

export interface UpdateResumeData {
  title?: string
  content?: ResumeContent
  file_url?: string
  version?: number
  is_active?: boolean
  language?: 'en' | 'zh' | 'auto'
  detected_language?: 'en' | 'zh'
  original_headers?: Record<string, string>
}

export class ResumeService {
  static async createResume(data: CreateResumeData): Promise<ResumeRow> {
    // Ensure user profile exists before creating resume
    await getCurrentUserProfile()

    const supabase = createClient()
    
    const insertData: ResumeInsert = {
      title: data.title,
      content: data.content as unknown as Database['public']['Tables']['resumes']['Insert']['content'],
      file_url: data.file_url,
      user_id: data.user_id,
      language: data.language || 'auto',
      detected_language: data.detected_language,
      original_headers: data.original_headers as unknown as Database['public']['Tables']['resumes']['Insert']['original_headers'],
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

  static async updateResume(id: string, data: UpdateResumeData, sessionId?: string): Promise<ResumeRow> {
    // Create or use existing session ID
    const currentSessionId = sessionId || saveLogger.generateSessionId()
    if (!sessionId) {
      saveLogger.startSession(currentSessionId, id, undefined)
    }
    
    const serviceStartTime = Date.now()
    saveLogger.logStep(currentSessionId, 'service_update_resume', 'start', { 
      id, 
      hasContent: !!data.content,
      contentSample: data.content ? {
        summary: data.content.summary?.substring(0, 100) + '...',
        skillsCount: data.content.skills?.length || 0,
        contactName: data.content.contact?.name,
        experienceCount: data.content.experience?.length || 0
      } : null
    })
    
    try {
      saveLogger.logStep(currentSessionId, 'service_preparing_request', 'start')
      
      // Use the API route instead of direct Supabase client calls
      const requestData = {
        url: `/api/resumes/${id}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify(data)
      }
      
      saveLogger.logStep(currentSessionId, 'service_making_fetch', 'start', {
        url: requestData.url,
        method: requestData.method,
        bodySize: requestData.body.length
      })
      
      const fetchStartTime = Date.now()
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        credentials: requestData.credentials,
        body: requestData.body
      })
      
      saveLogger.logStep(currentSessionId, 'service_fetch_complete', 'success', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      }, undefined, fetchStartTime)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          saveLogger.logStep(currentSessionId, 'service_error_parsing', 'success', { errorData })
        } catch {
          errorMessage = `${response.status} ${response.statusText}`
          saveLogger.logStep(currentSessionId, 'service_error_parsing', 'warning', { 
            reason: 'failed_to_parse_error_response' 
          })
        }
        
        saveLogger.logStep(currentSessionId, 'service_http_error', 'error', {
          status: response.status,
          statusText: response.statusText,
          errorMessage
        }, errorMessage)
        
        const error = new Error(`Failed to update resume: ${errorMessage}`)
        if (!sessionId) saveLogger.endSession(currentSessionId, 'error')
        throw error
      }

      saveLogger.logStep(currentSessionId, 'service_parsing_response', 'start')
      const parseStartTime = Date.now()
      const result = await response.json()
      const resume = result.resume
      saveLogger.logStep(currentSessionId, 'service_response_parsed', 'success', {
        hasResume: !!resume,
        resultKeys: Object.keys(result)
      }, undefined, parseStartTime)

      if (!resume) {
        const error = 'No resume data returned from server'
        saveLogger.logStep(currentSessionId, 'service_no_resume_data', 'error', null, error)
        if (!sessionId) saveLogger.endSession(currentSessionId, 'error')
        throw new Error(error)
      }

      saveLogger.logStep(currentSessionId, 'service_update_complete', 'success', {
        id: resume.id,
        version: resume.version,
        updatedAt: resume.updated_at,
        contentSize: JSON.stringify(resume.content).length
      }, undefined, serviceStartTime)

      if (!sessionId) saveLogger.endSession(currentSessionId, 'success')
      return resume

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      saveLogger.logStep(currentSessionId, 'service_update_error', 'error', {
        errorMessage,
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined
      }, errorMessage)
      
      if (!sessionId) saveLogger.endSession(currentSessionId, 'error')
      
      if (error instanceof Error) {
        // Re-throw with more context
        throw new Error(`Resume update failed: ${error.message}`)
      }
      
      throw new Error('Resume update failed: Unknown error')
    }
  }

  static async getUserResumes(userId: string): Promise<ResumeRow[]> {
    // Use the proper client context for consistency with the auth session
    const supabase = createClient()
    
    console.log('🔍 [ResumeService] Fetching resumes for user:', userId)
    
    // First, check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 [ResumeService] Current session:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      sessionError: sessionError?.message 
    })
    
    if (!session || !session.user) {
      throw new Error('No valid authentication session. Please log in again.')
    }
    
    if (session.user.id !== userId) {
      throw new Error('Authentication mismatch. Please refresh and try again.')
    }
    
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    console.log('📊 [ResumeService] Query result:', { 
      resumeCount: resumes?.length || 0, 
      error: error?.message 
    })

    if (error) {
      console.error('❌ [ResumeService] Database error details:', error)
      if (error.code === '42P01') {
        throw new Error('Database setup required: Please run the SQL schema in your Supabase dashboard. Check the console for instructions.')
      }
      if (error.message.includes('row-level security')) {
        throw new Error('Permission denied. Please refresh the page and log in again.')
      }
      throw new Error(`Failed to fetch resumes: ${error.message}`)
    }

    return resumes || []
  }

  static async getResume(id: string): Promise<ResumeRow | null> {
    const supabase = createClient()
    
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
    // First, get the resume to access the file_url before deletion
    const resume = await this.getResume(id)
    if (!resume) {
      throw new Error('Resume not found')
    }

    // Delete the file from storage if it exists
    if (resume.file_url) {
      try {
        // Extract the storage path from the file_url
        // The file_url might be a full URL or just the path
        const storagePath = resume.file_url.includes('/') 
          ? resume.file_url.split('/storage/v1/object/public/resumes/')[1] || resume.file_url
          : resume.file_url
        
        await StorageService.deleteResumeFile(storagePath)
      } catch (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the resume record from the database
    const supabase = createClient()
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete resume: ${error.message}`)
    }
  }

  static async setActiveResume(id: string, userId: string): Promise<void> {
    const supabase = createClient()
    
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
      language: originalResume.language,
      detected_language: originalResume.detected_language,
      original_headers: originalResume.original_headers,
      version: 1,
      is_active: false
    }

    const supabase = createClient()
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
    const supabase = createClient()
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