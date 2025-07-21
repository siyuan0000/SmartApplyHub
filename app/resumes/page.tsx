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
import { FileText, Edit, Download, Plus, Star, Trash2, Pencil } from 'lucide-react'
import { TagGroup } from '@/components/ui/resume-tag'

type ResumeRow = Database['public']['Tables']['resumes']['Row']

export default function Resumes() {
  const [resumes, setResumes] = useState<ResumeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; resume: ResumeRow | null }>({ open: false, resume: null })
  const [deleting, setDeleting] = useState(false)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [tempTitle, setTempTitle] = useState('')
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

  const handleTitleEdit = (resume: ResumeRow) => {
    setEditingTitle(resume.id)
    setTempTitle(resume.title)
  }

  const handleTitleSave = async (resumeId: string) => {
    if (!tempTitle.trim()) return
    
    try {
      await ResumeService.updateResume(resumeId, { title: tempTitle.trim() })
      await loadResumes()
      setEditingTitle(null)
      setTempTitle('')
    } catch (error) {
      console.error('Failed to update title:', error)
      alert('Failed to update resume title')
    }
  }

  const handleTitleCancel = () => {
    setEditingTitle(null)
    setTempTitle('')
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
              <Card key={resume.id} className="group hover:shadow-lg transition-all duration-200 border border-slate-200 hover:border-slate-300">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingTitle === resume.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tempTitle}
                              onChange={(e) => setTempTitle(e.target.value)}
                              className="text-lg font-semibold bg-transparent border-b border-blue-500 focus:outline-none flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleTitleSave(resume.id)
                                if (e.key === 'Escape') handleTitleCancel()
                              }}
                              onBlur={() => handleTitleSave(resume.id)}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/title">
                            <h3 className="text-lg font-semibold text-slate-900 leading-tight">
                              {resume.title}
                            </h3>
                            <button
                              onClick={() => handleTitleEdit(resume)}
                              className="opacity-0 group-hover/title:opacity-100 p-1 hover:bg-slate-100 rounded transition-all"
                              title="Rename resume"
                            >
                              <Pencil className="h-3 w-3 text-slate-500" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-slate-500">Version {resume.version}</span>
                          <span className="text-sm text-slate-400">•</span>
                          <span className="text-sm text-slate-500">
                            {getRelativeTime(resume.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {resume.is_active && (
                      <Badge variant="default" className="gap-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                        <Star className="h-3 w-3 fill-current" />
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-4">
                  {/* Tag Groups */}
                  <div className="space-y-3">
                    <TagGroup 
                      title="Optimized for"
                      tags={resume.job_roles || ['Software Engineer', 'Full Stack Developer']}
                      type="job-role"
                      maxDisplay={2}
                    />
                    <TagGroup 
                      title="Industries"
                      tags={resume.industries || ['Technology', 'Startups']}
                      type="industry"
                      maxDisplay={2}
                    />
                    {resume.applied_to && resume.applied_to.length > 0 && (
                      <TagGroup 
                        title="Applied to"
                        tags={resume.applied_to}
                        type="status"
                        maxDisplay={2}
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <Button 
                      size="sm" 
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={() => window.location.href = `/resumes/${resume.id}`}
                    >
                      <Edit className="h-4 w-4" />
                      View & Edit
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        title="Download Resume"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteClick(resume)}
                        title="Delete Resume"
                      >
                        <Trash2 className="h-4 w-4" />
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