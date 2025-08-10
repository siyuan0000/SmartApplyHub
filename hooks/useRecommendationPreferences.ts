import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

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

export interface UpdateRecommendationPreferencesInput {
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

interface UseRecommendationPreferencesOptions {
  autoFetch?: boolean
}

interface UseRecommendationPreferencesReturn {
  preferences: RecommendationPreferences | null
  loading: boolean
  error: string | null
  updating: boolean
  updateError: string | null
  fetchPreferences: () => Promise<void>
  updatePreferences: (preferences: UpdateRecommendationPreferencesInput) => Promise<void>
  resetToDefaults: () => Promise<void>
  deletePreferences: () => Promise<void>
}

export function useRecommendationPreferences(
  options: UseRecommendationPreferencesOptions = {}
): UseRecommendationPreferencesReturn {
  const { autoFetch = true } = options
  const { user } = useAuth()
  
  const [preferences, setPreferences] = useState<RecommendationPreferences | null>(null)
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/recommendations/preferences', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error('Failed to fetch preferences')
      }

      setPreferences(data.preferences)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recommendation preferences'
      console.error('Error fetching recommendation preferences:', err)
      setError(errorMessage)
      setPreferences(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  const updatePreferences = useCallback(async (newPreferences: UpdateRecommendationPreferencesInput) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setUpdating(true)
      setUpdateError(null)

      const response = await fetch('/api/recommendations/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newPreferences)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error('Failed to update preferences')
      }

      setPreferences(data.preferences)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recommendation preferences'
      console.error('Error updating recommendation preferences:', err)
      setUpdateError(errorMessage)
      throw err // Re-throw so caller can handle
    } finally {
      setUpdating(false)
    }
  }, [user])

  const resetToDefaults = useCallback(async () => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setUpdating(true)
      setUpdateError(null)

      const response = await fetch('/api/recommendations/preferences', {
        method: 'PATCH',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error('Failed to reset preferences')
      }

      setPreferences(data.preferences)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset recommendation preferences'
      console.error('Error resetting recommendation preferences:', err)
      setUpdateError(errorMessage)
      throw err
    } finally {
      setUpdating(false)
    }
  }, [user])

  const deletePreferences = useCallback(async () => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setUpdating(true)
      setUpdateError(null)

      const response = await fetch('/api/recommendations/preferences', {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error('Failed to delete preferences')
      }

      // Set to defaults after deletion
      setPreferences({
        user_id: user.id,
        location_filter: [],
        location_flexible: true,
        remote_only: false,
        recency_filter: '1week',
        company_size_preference: [],
        job_level_override: [],
        excluded_companies: [],
        excluded_industries: [],
        is_active: true
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recommendation preferences'
      console.error('Error deleting recommendation preferences:', err)
      setUpdateError(errorMessage)
      throw err
    } finally {
      setUpdating(false)
    }
  }, [user])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchPreferences()
    }
  }, [fetchPreferences, autoFetch])

  // Reset state when user changes
  useEffect(() => {
    if (!user) {
      setPreferences(null)
      setLoading(false)
      setError(null)
      setUpdating(false)
      setUpdateError(null)
    }
  }, [user])

  return {
    preferences,
    loading,
    error,
    updating,
    updateError,
    fetchPreferences,
    updatePreferences,
    resetToDefaults,
    deletePreferences
  }
}

// Helper hook for form handling with validation
export function useRecommendationPreferencesForm(
  initialValues?: Partial<UpdateRecommendationPreferencesInput>
) {
  const { preferences, updatePreferences, updating, updateError } = useRecommendationPreferences()
  const [formValues, setFormValues] = useState<UpdateRecommendationPreferencesInput>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Update form values when preferences load
  useEffect(() => {
    if (preferences) {
      setFormValues({
        location_filter: preferences.location_filter || [],
        location_flexible: preferences.location_flexible,
        remote_only: preferences.remote_only,
        recency_filter: preferences.recency_filter,
        salary_min_override: preferences.salary_min_override,
        salary_max_override: preferences.salary_max_override,
        company_size_preference: preferences.company_size_preference || [],
        job_level_override: preferences.job_level_override || [],
        excluded_companies: preferences.excluded_companies || [],
        excluded_industries: preferences.excluded_industries || [],
        ...initialValues
      })
    }
  }, [preferences, initialValues])

  const updateFormValue = useCallback((key: keyof UpdateRecommendationPreferencesInput, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Clear validation errors when user makes changes
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }, [validationErrors.length])

  const validateForm = useCallback((): boolean => {
    const errors: string[] = []

    // Validate salary range
    if (formValues.salary_min_override && formValues.salary_max_override) {
      if (formValues.salary_min_override > formValues.salary_max_override) {
        errors.push('最低薪资不能高于最高薪资')
      }
    }

    // Validate salary values
    if (formValues.salary_min_override && formValues.salary_min_override < 0) {
      errors.push('最低薪资必须为正数')
    }
    if (formValues.salary_max_override && formValues.salary_max_override < 0) {
      errors.push('最高薪资必须为正数')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }, [formValues])

  const submitForm = useCallback(async () => {
    if (!validateForm()) {
      return false
    }

    try {
      await updatePreferences(formValues)
      return true
    } catch (err) {
      return false
    }
  }, [validateForm, updatePreferences, formValues])

  return {
    formValues,
    validationErrors,
    updateFormValue,
    submitForm,
    updating,
    updateError,
    isValid: validationErrors.length === 0
  }
}