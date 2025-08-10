'use client'

export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText, 
  Briefcase, 
  Search, 
  Brain, 
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Plus,
  ArrowRight,
  AlertCircle,
  Settings,
  Sparkles
} from 'lucide-react'
import { ApplicationWorkflowModal } from '@/components/applications/ApplicationWorkflowModal'
import { useApplicationWorkflowStore } from '@/store/application-workflow'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useRecommendedJobs } from '@/hooks/useRecommendedJobs'
import { RecommendedJobCard } from '@/components/jobs/RecommendedJobCard'
import { formatRelativeTime } from '@/lib/utils/time'
import Link from 'next/link'

export default function Dashboard() {
  const { openWorkflow } = useApplicationWorkflowStore()
  const { recentApplications, stats, loading, error, refresh } = useDashboardData()
  const { 
    recommendations, 
    loading: recommendationsLoading, 
    error: recommendationsError,
    refresh: refreshRecommendations 
  } = useRecommendedJobs({ limit: 4 })

  const handleNewApplication = () => {
    openWorkflow() // Open workflow without a pre-selected job
  }

  const handleViewJobDetails = (job: typeof recommendations[0]) => {
    // TODO: Implement job details modal or navigation
    console.log('View job details:', job)
  }

  const handleSaveJob = (job: typeof recommendations[0]) => {
    // TODO: Implement save job functionality
    console.log('Save job:', job)
  }

  const handleApplyToJob = (job: typeof recommendations[0]) => {
    // TODO: Open application workflow with pre-selected job
    openWorkflow()
    console.log('Apply to job:', job)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your job search overview.
          </p>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalApplications}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Total submitted
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stats.interviews}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Interview stage
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stats.responseRate}%</div>
              )}
              <p className="text-xs text-muted-foreground">
                Interview + offer rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resumes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stats.activeResumes}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Available resumes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Applications
              </CardTitle>
              <CardDescription>
                Your latest job applications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                  <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">
                    Retry
                  </Button>
                </div>
              )}
              
              <div className="space-y-4">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : recentApplications.length === 0 ? (
                  // Empty state
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No applications yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start your job search by creating your first application
                    </p>
                    <Button onClick={handleNewApplication} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Application
                    </Button>
                  </div>
                ) : (
                  // Real applications
                  recentApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                            <Briefcase className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{app.position_title}</p>
                            <p className="text-sm text-muted-foreground">{app.company_name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          app.status === 'pending' ? 'secondary' :
                          app.status === 'interview' ? 'default' :
                          app.status === 'applied' ? 'outline' :
                          app.status === 'offer' ? 'default' :
                          'destructive'
                        }>
                          {app.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(app.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {!loading && recentApplications.length > 0 && (
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/applications">
                    View All Applications
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Shortcuts to common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start gap-3">
                <Link href="/resumes">
                  <Plus className="h-4 w-4" />
                  Upload Resume
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3">
                <Link href="/jobs">
                  <Search className="h-4 w-4" />
                  Find Jobs
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3">
                <Link href="/ai-review">
                  <Brain className="h-4 w-4" />
                  AI Review
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={handleNewApplication}
              >
                <Briefcase className="h-4 w-4" />
                New Application
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Jobs Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <CardTitle>Recommended Jobs</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/jobs?recommended=true">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
            <CardDescription>
              Jobs matching your preferences and skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendationsError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700">{recommendationsError}</p>
                <Button variant="outline" size="sm" onClick={refreshRecommendations} className="ml-auto">
                  Retry
                </Button>
              </div>
            )}

            {recommendationsLoading ? (
              // Loading skeleton
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="h-48">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="flex gap-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <div className="flex gap-2 mt-4">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No job recommendations yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your profile and set your job preferences to get personalized recommendations
                </p>
                <div className="flex gap-2 justify-center">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/settings">
                      Update Profile
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/jobs">
                      Browse Jobs
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              // Recommended jobs grid
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((job) => (
                  <RecommendedJobCard
                    key={job.id}
                    job={job}
                    onViewDetails={handleViewJobDetails}
                    onSave={handleSaveJob}
                    onApply={handleApplyToJob}
                    isSaved={false} // TODO: Implement saved jobs tracking
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
      <ApplicationWorkflowModal />
    </AppLayout>
  )
}