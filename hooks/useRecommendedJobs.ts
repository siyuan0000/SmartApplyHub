import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface RecommendedJob {
  id: string
  title: string
  company_name: string
  location: string
  description: string
  salary_range?: string
  job_type?: string
  industry?: string
  remote_work_type?: string
  work_days_per_week?: string
  department?: string
  job_level?: string
  created_at: string
  match_reasons?: string[]
}

interface RecommendedJobsResponse {
  success: boolean
  recommendations: RecommendedJob[]
  total: number
  applied_jobs_count: number
  filters_applied: {
    recency_filter: string
    excluded_companies_count: number
    excluded_industries_count: number
    location_flexible: boolean
  }
}

interface UseRecommendedJobsOptions {
  limit?: number
  autoFetch?: boolean
}

interface UseRecommendedJobsReturn {
  recommendations: RecommendedJob[]
  loading: boolean
  error: string | null
  total: number
  appliedJobsCount: number
  filtersApplied: RecommendedJobsResponse['filters_applied'] | null
  refresh: () => Promise<void>
  fetchRecommendations: () => Promise<void>
}

export function useRecommendedJobs(options: UseRecommendedJobsOptions = {}): UseRecommendedJobsReturn {
  const { limit = 6, autoFetch = true } = options
  const { user } = useAuth()
  
  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([])
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [appliedJobsCount, setAppliedJobsCount] = useState(0)
  const [filtersApplied, setFiltersApplied] = useState<RecommendedJobsResponse['filters_applied'] | null>(null)

  const fetchRecommendations = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const url = new URL('/api/jobs/recommendations', window.location.origin)
      url.searchParams.set('limit', limit.toString())

      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data: RecommendedJobsResponse = await response.json()
      
      if (!data.success) {
        throw new Error('Failed to fetch recommendations')
      }

      setRecommendations(data.recommendations)
      setTotal(data.total)
      setAppliedJobsCount(data.applied_jobs_count)
      setFiltersApplied(data.filters_applied)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recommended jobs'
      console.error('Error fetching recommended jobs:', err)
      setError(errorMessage)
      
      // Reset data on error
      setRecommendations([])
      setTotal(0)
      setAppliedJobsCount(0)
      setFiltersApplied(null)
    } finally {
      setLoading(false)
    }
  }, [user, limit])

  const refresh = useCallback(async () => {
    await fetchRecommendations()
  }, [fetchRecommendations])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchRecommendations()
    }
  }, [fetchRecommendations, autoFetch])

  // Reset state when user changes
  useEffect(() => {
    if (!user) {
      setRecommendations([])
      setLoading(false)
      setError(null)
      setTotal(0)
      setAppliedJobsCount(0)
      setFiltersApplied(null)
    }
  }, [user])

  return {
    recommendations,
    loading,
    error,
    total,
    appliedJobsCount,
    filtersApplied,
    refresh,
    fetchRecommendations
  }
}