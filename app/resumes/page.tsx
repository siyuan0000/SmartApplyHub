'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ResumeProcessor } from '@/components/resumes/ResumeProcessor'
import { ResumeService } from '@/lib/resume/service'
import { useAuth } from '@/hooks/useAuth'
import { ensureUserExists } from '@/lib/supabase/user'
import { Database } from '@/types/database.types'
import { FileText, Edit, Download, Eye, Plus, Star, Trash2 } from 'lucide-react'

type ResumeRow = Database['public']['Tables']['resumes']['Row']

export default function Resumes() {
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; resume: ResumeRow | null }>({ open: false, resume: null })
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()

  const loadResumes = useCallback(async () => {
    if (!user) return
    try {
      // Ensure user profile exists before loading resumes
      await ensureUserExists(user)
      const userResumes = await ResumeService.getUserResumes(user.id)
      setResumes(userResumes)
      setSetupError(null)
    } catch (error) {
      console.error('Failed to load resumes:', error)
      if (error instanceof Error && error.message.includes('Database setup required')) {
        setSetupError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadResumes()
    }
  }, [user, loadResumes])

  const handleProcessingComplete = async () => {
    setShowUploader(false)
    await loadResumes()
  }

  const handleDeleteClick = (resume: ResumeRow) => {
    setDeleteDialog({ open: true, resume })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.resume) return
    
    setDeleting(true)
    try {
      await ResumeService.deleteResume(deleteDialog.resume.id)
      await loadResumes()
      setDeleteDialog({ open: false, resume: null })
    } catch (error) {
      console.error('Failed to delete resume:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete resume')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, resume: null })
  }

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return `${Math.floor(diffInSeconds / 2592000)} months ago`
  }

  return (
    <AppLayout>
      <div className="section-spacing">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Resume Manager</h1>
            <p className="text-muted-foreground">
              Upload, optimize, and manage your resumes with AI assistance
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowUploader(true)}>
            <Plus className="h-4 w-4" />
            Upload Resume
          </Button>
        </div>


        {/* Upload Area */}
        {showUploader && (
          <ResumeProcessor onProcessingComplete={handleProcessingComplete} />
        )}

        {/* Setup Error */}
        {setupError && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-orange-600">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800 mb-2">Database Setup Required</h3>
                  <p className="text-orange-700 mb-4">
                    Your Supabase database needs to be set up before you can use resume features.
                  </p>
                  <div className="space-y-2 text-sm text-orange-700">
                    <p><strong>Step 1:</strong> Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></p>
                    <p><strong>Step 2:</strong> Navigate to &quot;SQL Editor&quot;</p>
                    <p><strong>Step 3:</strong> Copy and run the contents of <code className="bg-orange-100 px-1 rounded">supabase/schema.sql</code></p>
                    <p><strong>Step 4:</strong> Create a storage bucket called &quot;resumes&quot; in Storage settings</p>
                  </div>
                  <Button 
                    onClick={loadResumes} 
                    className="mt-4" 
                    size="sm"
                  >
                    Retry Connection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resume List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No resumes yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first resume to get started with AI-powered optimization
              </p>
              <Button onClick={() => setShowUploader(true)}>
                Upload Your First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid-responsive">
            {resumes.map((resume) => (
              <Card key={resume.id} className="group hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg truncate leading-tight" title={resume.title}>
                          {resume.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          Version {resume.version}
                        </CardDescription>
                      </div>
                    </div>
                    {resume.is_active && (
                      <Badge variant="default" className="gap-1 shrink-0">
                        <Star className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  {/* AI Score Placeholder */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">AI Optimization Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-destructive via-yellow-500 to-green-600 rounded-full"
                          style={{ width: '75%' }}
                        />
                      </div>
                      <span className="text-sm font-bold">75%</span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <p className="text-sm text-muted-foreground">
                    Last updated {getRelativeTime(resume.updated_at)}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-auto">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1 min-w-0"
                        onClick={() => window.open(`/resumes/${resume.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline truncate">View</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1 min-w-0"
                        onClick={() => window.location.href = `/resumes/${resume.id}`}
                      >
                        <Edit className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline truncate">Edit</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1 min-w-0"
                        title="Download Resume"
                      >
                        <Download className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline truncate">Download</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1 min-w-0"
                        onClick={() => handleDeleteClick(resume)}
                        title="Delete Resume"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline truncate">Delete</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
              <Button variant="outline" className="justify-start gap-3 h-auto py-4 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium truncate">ATS Analysis</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Check compatibility with applicant tracking systems
                  </p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-auto py-4 min-w-0">
                <div className="p-2 bg-green-100 rounded-lg shrink-0">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium truncate">Keyword Optimization</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Enhance with industry-specific keywords
                  </p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-auto py-4 min-w-0">
                <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                  <Edit className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium truncate">Content Suggestions</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Get AI-powered writing improvements
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Resume</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{deleteDialog.resume?.title}&quot;? 
                {deleteDialog.resume?.is_active && (
                  <span className="text-orange-600 font-medium">
                    {' '}This is your active resume.
                  </span>
                )}
                {' '}This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Resume'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}