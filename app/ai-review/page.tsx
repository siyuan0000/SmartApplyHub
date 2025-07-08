'use client'

export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Brain, FileText, Target, TrendingUp, CheckCircle } from 'lucide-react'

export default function AIReview() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">AI Resume Review</h1>
            <p className="text-muted-foreground">
              Get AI-powered insights to optimize your resume
            </p>
          </div>
          <Button className="gap-2">
            <Brain className="h-4 w-4" />
            Start Review
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis
            </CardTitle>
            <CardDescription>
              Upload your resume to get detailed feedback and optimization suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
              <p className="text-muted-foreground mb-4">
                Get instant AI-powered feedback on your resume
              </p>
              <Button>Choose File</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                ATS Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ensure your resume passes Applicant Tracking Systems
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Keywords</span>
                  <span className="text-sm">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Content Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Improve your resume content and structure
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Writing Quality</span>
                  <span className="text-sm">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                Format Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Professional formatting and layout analysis
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Formatting</span>
                  <span className="text-sm">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}