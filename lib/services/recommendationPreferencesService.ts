import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)

export interface RecommendationPreferences {
  id?: string
  user_id: string
  location_filter?: string[]
  location_flexible?: boolean
  remote_only?: boolean
  recency_filter?: string
  salary_min_override?: number
  salary_max_override?: number
  company_size_preference?: string[]
  job_level_override?: string[]
  excluded_companies?: string[]
  excluded_industries?: string[]
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateRecommendationPreferencesInput {
  location_filter?: string[]
  location_flexible?: boolean
  remote_only?: boolean
  recency_filter?: string
  salary_min_override?: number
  salary_max_override?: number
  company_size_preference?: string[]
  job_level_override?: string[]
  excluded_companies?: string[]
  excluded_industries?: string[]
}

export interface UpdateRecommendationPreferencesInput extends CreateRecommendationPreferencesInput {
  is_active?: boolean
}

export class RecommendationPreferencesService {
  /**
   * Get user's recommendation preferences
   */
  static async getPreferences(userId: string): Promise<RecommendationPreferences | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('recommendation_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching recommendation preferences:', error)
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Failed to get recommendation preferences:', error)
      throw error
    }
  }

  /**
   * Create new recommendation preferences for a user
   */
  static async createPreferences(
    userId: string,
    preferences: CreateRecommendationPreferencesInput
  ): Promise<RecommendationPreferences> {
    try {
      // First, deactivate any existing preferences
      await this.deactivateExistingPreferences(userId)

      const { data, error } = await supabaseAdmin
        .from('recommendation_preferences')
        .insert({
          user_id: userId,
          ...preferences,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating recommendation preferences:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to create recommendation preferences:', error)
      throw error
    }
  }

  /**
   * Update existing recommendation preferences
   */
  static async updatePreferences(
    userId: string,
    preferences: UpdateRecommendationPreferencesInput
  ): Promise<RecommendationPreferences> {
    try {
      const { data, error } = await supabaseAdmin
        .from('recommendation_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)
        .select()
        .single()

      if (error) {
        console.error('Error updating recommendation preferences:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to update recommendation preferences:', error)
      throw error
    }
  }

  /**
   * Delete (deactivate) recommendation preferences
   */
  static async deletePreferences(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('recommendation_preferences')
        .update({ is_active: false })
        .eq('user_id', userId)

      if (error) {
        console.error('Error deactivating recommendation preferences:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to delete recommendation preferences:', error)
      throw error
    }
  }

  /**
   * Upsert recommendation preferences (create if doesn't exist, update if exists)
   */
  static async upsertPreferences(
    userId: string,
    preferences: CreateRecommendationPreferencesInput
  ): Promise<RecommendationPreferences> {
    try {
      const existing = await this.getPreferences(userId)

      if (existing) {
        return await this.updatePreferences(userId, preferences)
      } else {
        return await this.createPreferences(userId, preferences)
      }
    } catch (error) {
      console.error('Failed to upsert recommendation preferences:', error)
      throw error
    }
  }

  /**
   * Get default recommendation preferences
   */
  static getDefaultPreferences(): CreateRecommendationPreferencesInput {
    return {
      location_filter: [],
      location_flexible: true,
      remote_only: false,
      recency_filter: '1week',
      salary_min_override: undefined,
      salary_max_override: undefined,
      company_size_preference: [],
      job_level_override: [],
      excluded_companies: [],
      excluded_industries: []
    }
  }

  /**
   * Validate recommendation preferences input
   */
  static validatePreferences(preferences: CreateRecommendationPreferencesInput): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Validate recency_filter
    if (preferences.recency_filter) {
      const validFilters = ['1day', '3days', '1week', '2weeks', '1month']
      if (!validFilters.includes(preferences.recency_filter)) {
        errors.push('Invalid recency_filter. Must be one of: ' + validFilters.join(', '))
      }
    }

    // Validate salary overrides
    if (preferences.salary_min_override && preferences.salary_max_override) {
      if (preferences.salary_min_override > preferences.salary_max_override) {
        errors.push('salary_min_override cannot be greater than salary_max_override')
      }
    }

    // Validate salary values are positive
    if (preferences.salary_min_override && preferences.salary_min_override < 0) {
      errors.push('salary_min_override must be a positive number')
    }
    if (preferences.salary_max_override && preferences.salary_max_override < 0) {
      errors.push('salary_max_override must be a positive number')
    }

    // Validate company size preferences
    if (preferences.company_size_preference) {
      const validSizes = ['startup', 'mid-size', 'enterprise']
      const invalidSizes = preferences.company_size_preference.filter(
        size => !validSizes.includes(size)
      )
      if (invalidSizes.length > 0) {
        errors.push(`Invalid company_size_preference values: ${invalidSizes.join(', ')}`)
      }
    }

    // Validate arrays are not too large (prevent abuse)
    const arrayFields = [
      'location_filter',
      'company_size_preference', 
      'job_level_override',
      'excluded_companies',
      'excluded_industries'
    ] as const

    arrayFields.forEach(field => {
      const value = preferences[field]
      if (value && Array.isArray(value) && value.length > 50) {
        errors.push(`${field} cannot contain more than 50 items`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Private helper to deactivate existing preferences
   */
  private static async deactivateExistingPreferences(userId: string): Promise<void> {
    await supabaseAdmin
      .from('recommendation_preferences')
      .update({ is_active: false })
      .eq('user_id', userId)
  }

  /**
   * Get preferences with fallback to defaults
   */
  static async getPreferencesWithDefaults(userId: string): Promise<RecommendationPreferences> {
    const existing = await this.getPreferences(userId)
    
    if (existing) {
      return existing
    }

    // Return defaults with user_id
    const defaults = this.getDefaultPreferences()
    return {
      user_id: userId,
      ...defaults,
      is_active: true
    }
  }
}