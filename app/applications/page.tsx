'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase, Plus, Search, Filter, Eye, Edit, Trash2, Calendar, MapPin, Clock, Loader2 } from 'lucide-react'
import { ApplicationWorkflowModal } from '@/components/applications/ApplicationWorkflowModal'
import { useApplicationWorkflowStore } from '@/store/application-workflow'
import { Database } from '@/types/database.types'

type JobApplication = Database['public']['Tables']['job_applications']['Row'] & {
  job_postings?: Database['public']['Tables']['job_postings']['Row'] | null
}

export default function Applications() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { openWorkflow } = useApplicationWorkflowStore()
  const { user, loading: authLoading } = useAuth()
  
  const supabase = createClient()

  const fetchApplications = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 [Applications Page] Fetching applications with Supabase client...')
      
      // Build query
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job_postings (
            id,
            title,
            company_name,
            location,
            description,
            salary_range,
            job_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      
      const { data: applications, error } = await query
      
      if (error) {
        console.error('❌ [Applications Page] Supabase error:', error)
        throw new Error(error.message)
      }
      
      console.log('✅ [Applications Page] Received data:', { applicationCount: applications?.length || 0 })
      setApplications(applications || [])
    } catch (err) {
      console.error('💥 [Applications Page] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load applications')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, user, supabase])

  // Fetch applications when user is available
  useEffect(() => {
    if (user) {
      fetchApplications()
    } else if (!authLoading) {
      // User not authenticated and auth loading is done
      setLoading(false)
    }
  }, [fetchApplications, user, authLoading])

  const handleNewApplication = () => {
    openWorkflow()
  }

  // Filter applications by search term
  const filteredApplications = applications.filter(app => 
    app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.position_title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    applied: applications.filter(app => app.status === 'applied').length,
    interview: applications.filter(app => app.status === 'interview').length,
    offer: applications.filter(app => app.status === 'offer').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'applied':
        return <Badge variant="outline">Applied</Badge>
      case 'interview':
        return <Badge variant="default">Interview</Badge>
      case 'offer':
        return <Badge className="bg-green-600">Offer</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-l-yellow-500'
      case 'applied': return 'border-l-blue-500'
      case 'interview': return 'border-l-purple-500'
      case 'offer': return 'border-l-green-500'
      case 'rejected': return 'border-l-red-500'
      default: return 'border-l-gray-500'
    }
  }

  // Show login prompt if not authenticated
  if (!user && !authLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-2xl font-bold">Please Log In</h2>
          <p className="text-muted-foreground">You need to log in to view your applications.</p>
          <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Job Applications</h1>
            <p className="text-muted-foreground">
              Track and manage your job applications
            </p>
          </div>
          <Button className="gap-2" onClick={handleNewApplication}>
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{loading ? '-' : stats.total}</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{loading ? '-' : stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Interviews</p>
                  <p className="text-2xl font-bold text-purple-600">{loading ? '-' : stats.interview}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Offers</p>
                  <p className="text-2xl font-bold text-green-600">{loading ? '-' : stats.offer}</p>
                </div>
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Response Rate</p>
                  <p className="text-2xl font-bold">{loading ? '-' : stats.total > 0 ? Math.round((stats.interview + stats.offer) / stats.total * 100) + '%' : '0%'}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applications..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchApplications} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchApplications} className="mt-2">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
                <p className="text-muted-foreground mb-4">
                  {applications.length === 0 
                    ? "You haven't created any job applications yet."
                    : "No applications match your search criteria."
                  }
                </p>
                <Button onClick={handleNewApplication}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Application
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((app) => (
              <Card key={app.id} className={`border-l-4 ${getStatusColor(app.status)}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                          <Briefcase className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{app.position_title}</h3>
                          <p className="text-sm text-muted-foreground">{app.company_name}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{app.job_postings?.location || 'Location not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-medium">
                            {app.job_postings?.salary_range || 'Salary not specified'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {app.notes?.substring(0, 50) || 'No notes'}
                            {app.notes && app.notes.length > 50 ? '...' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <ApplicationWorkflowModal />
      </div>
    </AppLayout>
  )
}