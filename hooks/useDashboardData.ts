import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface Application {
  id: string
  company_name: string
  position_title: string
  status: 'pending' | 'applied' | 'interview' | 'offer' | 'rejected'
  created_at: string
  applied_at: string | null
  job_postings?: {
    id: string
    title: string
    company_name: string
    location: string
  } | null
}

interface DashboardStats {
  totalApplications: number
  interviews: number
  responseRate: number
  activeResumes: number
}

interface DashboardData {
  recentApplications: Application[]
  stats: DashboardStats
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDashboardData(): DashboardData {
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    interviews: 0,
    responseRate: 0,
    activeResumes: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch recent applications (last 4 for dashboard)
      const applicationsResponse = await fetch('/api/applications?limit=4', {
        credentials: 'include'
      })

      if (!applicationsResponse.ok) {
        throw new Error('Failed to fetch applications')
      }

      const applicationsData = await applicationsResponse.json()
      const applications = applicationsData.applications || []
      
      setRecentApplications(applications)

      // Fetch all applications for statistics
      const allApplicationsResponse = await fetch('/api/applications?limit=1000', {
        credentials: 'include'
      })

      if (!allApplicationsResponse.ok) {
        throw new Error('Failed to fetch application statistics')
      }

      const allApplicationsData = await allApplicationsResponse.json()
      const allApplications = allApplicationsData.applications || []

      // Fetch resumes count
      const resumesResponse = await fetch('/api/resumes', {
        credentials: 'include'
      })

      let resumesCount = 0
      if (resumesResponse.ok) {
        const resumesData = await resumesResponse.json()
        resumesCount = resumesData.resumes?.length || 0
      }

      // Calculate statistics
      const totalApplications = allApplications.length
      const interviews = allApplications.filter((app: Application) => app.status === 'interview').length
      const responses = allApplications.filter((app: Application) => 
        ['interview', 'offer'].includes(app.status)
      ).length
      const responseRate = totalApplications > 0 ? Math.round((responses / totalApplications) * 100) : 0

      setStats({
        totalApplications,
        interviews,
        responseRate,
        activeResumes: resumesCount
      })

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const refresh = () => {
    fetchDashboardData()
  }

  return {
    recentApplications,
    stats,
    loading,
    error,
    refresh
  }
}