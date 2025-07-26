'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText, 
  Star, 
  Calendar,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import { useApplicationWorkflowStore } from '@/store/application-workflow'
import { Database } from '@/types/database.types'
import { ResumeContent } from '@/lib/resume/parser'
import { ResumeService } from '@/lib/resume/service'
import { useAuth } from '@/hooks/useAuth'
import { ensureUserExists } from '@/lib/supabase/user'

type Resume = Database['public']['Tables']['resumes']['Row'] & {
  content: ResumeContent
}

export function ResumeSelectionStep() {
  const { selectedResume, setSelectedResume } = useApplicationWorkflowStore()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const loadResumes = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Ensure user profile exists before loading resumes
      await ensureUserExists(user)
      const userResumes = await ResumeService.getUserResumes(user.id)
      setResumes(userResumes as Resume[])
    } catch (err) {
      console.error('Failed to load resumes:', err)
      setError(err instanceof Error ? err.message : 'Failed to load resumes')
      setResumes([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadResumes()
    }
  }, [user, loadResumes])

  const handleSelectResume = (resume: Resume) => {
    setSelectedResume(resume)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getResumePreview = (content: ResumeContent) => {
    const experience = content.experience?.[0]
    const education = content.education?.[0]
    const skillsCount = content.skills?.length || 0
    
    return {
      recentJob: experience ? `${experience.title} at ${experience.company}` : 'No experience listed',
      education: education ? `${education.degree} from ${education.school}` : 'No education listed',
      skillsCount,
      contact: content.contact
    }
  }

  if (selectedResume) {
    const preview = getResumePreview(selectedResume.content)
    
    return (
      <div className="space-y-6">
        <div className="text-center text-green-600">
          <div className="text-lg font-medium mb-2">✓ Resume Selected</div>
          <p className="text-sm text-muted-foreground">
            You can proceed to the next step or choose a different resume below.
          </p>
        </div>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedResume.title}
                  </h3>
                  {selectedResume.is_active && (
                    <Badge variant="outline" className="text-xs mt-1">
                      <Star className="h-3 w-3 mr-1" />
                      Active Resume
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedResume(null)}
              >
                Change Resume
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Contact Info</h4>
                <div className="space-y-1">
                  {preview.contact.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {preview.contact.name}
                    </div>
                  )}
                  {preview.contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {preview.contact.email}
                    </div>
                  )}
                  {preview.contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {preview.contact.phone}
                    </div>
                  )}
                  {preview.contact.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {preview.contact.location}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Resume Summary</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Recent Role:</span>
                    <div className="font-medium">{preview.recentJob}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Education:</span>
                    <div className="font-medium">{preview.education}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skills:</span>
                    <div className="font-medium">{preview.skillsCount} skills listed</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground mb-2">
          Choose Your Resume
        </h3>
        <p className="text-sm text-muted-foreground">
          Select the resume you want to use for this job application
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadResumes}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Resumes List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : resumes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground mb-2">No resumes found</div>
            <p className="text-sm text-muted-foreground mb-4">
              You need to create a resume before applying for jobs
            </p>
            <Button variant="outline" size="sm">
              Create Resume
            </Button>
          </div>
        ) : (
          resumes.map((resume) => {
            const preview = getResumePreview(resume.content)
            
            return (
              <Card 
                key={resume.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectResume(resume)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-blue-50 rounded-lg flex-shrink-0">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {resume.title}
                          </h3>
                          {resume.is_active && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Last updated {formatDate(resume.updated_at)}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Contact</div>
                            <div className="font-medium">
                              {preview.contact.name || 'Name not set'}
                            </div>
                            {preview.contact.email && (
                              <div className="text-muted-foreground text-xs">
                                {preview.contact.email}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="text-muted-foreground">Summary</div>
                            <div className="font-medium text-xs">
                              {preview.skillsCount} skills • Recent: {preview.recentJob.length > 40 ? preview.recentJob.substring(0, 40) + '...' : preview.recentJob}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="ml-4 flex-shrink-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Resume CTA */}
      {!loading && resumes.length > 0 && (
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Don&apos;t see the right resume?
          </p>
          <Button variant="outline" size="sm">
            Create New Resume
          </Button>
        </div>
      )}
    </div>
  )
}