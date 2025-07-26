'use client'

export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
  ArrowRight
} from 'lucide-react'
import { ApplicationWorkflowModal } from '@/components/applications/ApplicationWorkflowModal'
import { useApplicationWorkflowStore } from '@/store/application-workflow'

export default function Dashboard() {
  const { openWorkflow } = useApplicationWorkflowStore()

  const handleNewApplication = () => {
    openWorkflow() // Open workflow without a pre-selected job
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +3 from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                2 scheduled this week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18%</div>
              <p className="text-xs text-muted-foreground">
                +2% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Resumes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Last updated 2 days ago
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
              <div className="space-y-4">
                {[
                  { company: 'TechCorp', position: 'Senior Developer', status: 'pending', time: '2 hours ago' },
                  { company: 'StartupXYZ', position: 'Full Stack Engineer', status: 'interview', time: '1 day ago' },
                  { company: 'BigTech Inc', position: 'Software Engineer', status: 'applied', time: '3 days ago' },
                  { company: 'Innovation Labs', position: 'Frontend Developer', status: 'rejected', time: '5 days ago' },
                ].map((app, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{app.position}</p>
                          <p className="text-sm text-muted-foreground">{app.company}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        app.status === 'pending' ? 'secondary' :
                        app.status === 'interview' ? 'default' :
                        app.status === 'applied' ? 'outline' :
                        'destructive'
                      }>
                        {app.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{app.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Applications
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
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
              <Button className="w-full justify-start gap-3">
                <Plus className="h-4 w-4" />
                Upload Resume
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3">
                <Search className="h-4 w-4" />
                Find Jobs
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3">
                <Brain className="h-4 w-4" />
                AI Review
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

        {/* Goals & Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Goals</CardTitle>
              <CardDescription>
                Track your job search progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Applications Sent</span>
                  <span className="text-sm text-muted-foreground">8/15</span>
                </div>
                <Progress value={53} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Networking Contacts</span>
                  <span className="text-sm text-muted-foreground">5/10</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Skills Practice</span>
                  <span className="text-sm text-muted-foreground">3/5</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>
                Recommendations to improve your success rate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Resume Optimization</p>
                  <p className="text-sm text-muted-foreground">
                    Add more keywords related to React and TypeScript
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Application Timing</p>
                  <p className="text-sm text-muted-foreground">
                    Tuesday-Thursday applications get 23% more responses
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Target className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Cover Letter</p>
                  <p className="text-sm text-muted-foreground">
                    Personalize your template for fintech companies
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ApplicationWorkflowModal />
    </AppLayout>
  )
}