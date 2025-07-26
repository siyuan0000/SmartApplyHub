'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText, 
  Star, 
  Calendar,
  ChevronRight,
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
        
        <div className="max-w-md mx-auto">
          <Card className="border-green-200 bg-green-50 h-64 overflow-hidden">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="p-4 h-full flex flex-col overflow-hidden">
              {/* Header with icon and action button */}
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedResume(null)}
                  className="text-xs"
                >
                  Change
                </Button>
              </div>
              
              {/* Title and active badge */}
              <div className="mb-2 min-w-0">
                <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 truncate">
                  {selectedResume.title}
                </h3>
                <div className="flex items-center gap-2 min-w-0">
                  {selectedResume.is_active && (
                    <Badge variant="outline" className="text-xs py-0 px-2 h-5 bg-green-100 border-green-300 flex-shrink-0">
                      <Star className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Contact info */}
              <div className="mb-3 flex-1 min-w-0 overflow-hidden">
                <div className="text-xs text-muted-foreground mb-1">Contact</div>
                <div className="space-y-1">
                  <div className="font-medium text-sm truncate">
                    {preview.contact.name || 'Name not set'}
                  </div>
                  {preview.contact.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{preview.contact.email}</span>
                    </div>
                  )}
                  {preview.contact.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{preview.contact.phone}</span>
                    </div>
                  )}
                  {preview.contact.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{preview.contact.location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Summary at bottom */}
              <div className="mt-auto pt-2 border-t border-green-200 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">Summary</div>
                <div className="text-xs">
                  <div className="font-medium mb-1 truncate">{preview.skillsCount} skills</div>
                  <div className="text-muted-foreground line-clamp-2 break-words">
                    {preview.recentJob}
                  </div>
                </div>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
      <div className="grid-responsive">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-64">
              <CardContent className="p-4 h-full">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : resumes.length === 0 ? (
          <div className="col-span-full text-center py-12">
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
                className="cursor-pointer hover:shadow-md transition-shadow h-64 relative group overflow-hidden"
                onClick={() => handleSelectResume(resume)}
              >
                <CardContent className="p-0 h-full flex flex-col">
                  <div className="p-4 h-full flex flex-col overflow-hidden">
                  {/* Header with icon and action button */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Title and active badge */}
                  <div className="mb-2 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 truncate">
                      {resume.title}
                    </h3>
                    <div className="flex items-center gap-2 min-w-0">
                      {resume.is_active && (
                        <Badge variant="outline" className="text-xs py-0 px-2 h-5 flex-shrink-0">
                          <Star className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{formatDate(resume.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact info */}
                  <div className="mb-3 flex-1 min-w-0 overflow-hidden">
                    <div className="text-xs text-muted-foreground mb-1">Contact</div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm truncate">
                        {preview.contact.name || 'Name not set'}
                      </div>
                      {preview.contact.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{preview.contact.email}</span>
                        </div>
                      )}
                      {preview.contact.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{preview.contact.phone}</span>
                        </div>
                      )}
                      {preview.contact.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{preview.contact.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Summary at bottom */}
                  <div className="mt-auto pt-2 border-t border-gray-100 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Summary</div>
                    <div className="text-xs">
                      <div className="font-medium mb-1 truncate">{preview.skillsCount} skills</div>
                      <div className="text-muted-foreground line-clamp-2 break-words">
                        {preview.recentJob}
                      </div>
                    </div>
                  </div>
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