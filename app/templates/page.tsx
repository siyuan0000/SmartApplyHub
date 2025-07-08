'use client'

export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileCheck, Plus, Edit, Copy } from 'lucide-react'

export default function Templates() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Cover Letter Templates</h1>
            <p className="text-muted-foreground">
              Create and manage cover letter templates for different job types
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Software Engineer</CardTitle>
                </div>
                <Badge variant="default">Default</Badge>
              </div>
              <CardDescription>
                Perfect for software engineering positions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A professional template highlighting technical skills and project experience.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Product Manager</CardTitle>
                </div>
              </div>
              <CardDescription>
                Tailored for product management roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Emphasizes strategic thinking and cross-functional collaboration.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">Data Scientist</CardTitle>
                </div>
              </div>
              <CardDescription>
                For data science and analytics positions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Highlights analytical skills and data-driven achievements.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
            <CardDescription>
              Start from scratch or customize an existing template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Custom Templates Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom cover letter template
              </p>
              <Button>Create Template</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}