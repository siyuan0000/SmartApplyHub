'use client'

export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, Edit, Download, Eye, Plus, Star } from 'lucide-react'

export default function Resumes() {
  const mockResumes = [
    {
      id: 1,
      title: 'Software Engineer Resume',
      version: 3,
      isActive: true,
      lastUpdated: '2 days ago',
      aiScore: 85,
      fileSize: '245 KB'
    },
    {
      id: 2,
      title: 'Full Stack Developer Resume',
      version: 2,
      isActive: false,
      lastUpdated: '1 week ago',
      aiScore: 78,
      fileSize: '198 KB'
    },
    {
      id: 3,
      title: 'Frontend Specialist Resume',
      version: 1,
      isActive: false,
      lastUpdated: '2 weeks ago',
      aiScore: 92,
      fileSize: '156 KB'
    }
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Resume Manager</h1>
            <p className="text-muted-foreground">
              Upload, optimize, and manage your resumes with AI assistance
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Upload Resume
          </Button>
        </div>

        {/* Upload Area */}
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop your resume file or click to browse
            </p>
            <div className="flex gap-2">
              <Button>Browse Files</Button>
              <Button variant="outline">Import from LinkedIn</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supports PDF, DOC, DOCX files up to 10MB
            </p>
          </CardContent>
        </Card>

        {/* Resume List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockResumes.map((resume) => (
            <Card key={resume.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{resume.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        Version {resume.version} • {resume.fileSize}
                      </CardDescription>
                    </div>
                  </div>
                  {resume.isActive && (
                    <Badge variant="default" className="gap-1">
                      <Star className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Score */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">AI Optimization Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                        style={{ width: `${resume.aiScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{resume.aiScore}%</span>
                  </div>
                </div>

                {/* Last Updated */}
                <p className="text-sm text-muted-foreground">
                  Last updated {resume.lastUpdated}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common resume optimization tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start gap-3 h-auto py-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">ATS Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Check compatibility with applicant tracking systems
                  </p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-auto py-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Keyword Optimization</p>
                  <p className="text-sm text-muted-foreground">
                    Enhance with industry-specific keywords
                  </p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-auto py-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Edit className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Content Suggestions</p>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered writing improvements
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}