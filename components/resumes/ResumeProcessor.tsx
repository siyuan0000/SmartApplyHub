'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ResumeUpload } from './ResumeUpload'
import { OCRProcessor } from '@/lib/ocr/processor'
import { ResumeContent } from '@/lib/resume/parser'
import { ResumeService } from '@/lib/resume/service'
import { ensureUserExists } from '@/lib/supabase/user'
import { useAuth } from '@/hooks/useAuth'
import { useAI } from '@/hooks/useAI'
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ProcessingStep {
  id: string
  title: string
  description?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  estimatedTime?: string
}

interface ResumeProcessorProps {
  onProcessingComplete?: (resumeId: string) => void
}

export function ResumeProcessor({ onProcessingComplete }: ResumeProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedContent, setExtractedContent] = useState<ResumeContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { 
      id: 'upload', 
      title: 'Upload Resume', 
      description: 'File uploaded successfully',
      status: 'pending', 
      progress: 0,
      estimatedTime: '< 1s'
    },
    { 
      id: 'validate-pages', 
      title: 'Validate Page Count', 
      description: 'Ensuring single-page format',
      status: 'pending', 
      progress: 0,
      estimatedTime: '< 1s'
    },
    { 
      id: 'ocr', 
      title: 'Extract Text', 
      description: 'Reading content from your resume',
      status: 'pending', 
      progress: 0,
      estimatedTime: '2-3s'
    },
    { 
      id: 'ai-prepare', 
      title: 'Preparing AI Analysis', 
      description: 'Setting up intelligent processing',
      status: 'pending', 
      progress: 0,
      estimatedTime: '< 1s'
    },
    { 
      id: 'ai-parse', 
      title: 'AI Structure Analysis', 
      description: 'Analyzing and organizing your content',
      status: 'pending', 
      progress: 0,
      estimatedTime: '5-8s'
    },
    { 
      id: 'validate', 
      title: 'Validate Content', 
      description: 'Ensuring all sections are complete',
      status: 'pending', 
      progress: 0,
      estimatedTime: '< 1s'
    },
    { 
      id: 'save', 
      title: 'Save Resume', 
      description: 'Storing your processed resume',
      status: 'pending', 
      progress: 0,
      estimatedTime: '1-2s'
    }
  ])

  const { user } = useAuth()
  const { parseResumeStructure } = useAI()

  const updateStep = (stepId: string, status: ProcessingStep['status'], progress: number = 0) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, progress } : step
    ))
  }

  const handleUploadComplete = async (filePath: string, fileName: string) => {
    if (!user) {
      setError('Please log in to process resumes')
      return
    }


    setIsProcessing(true)
    setError(null)
    updateStep('upload', 'completed', 100)

    try {
      // Ensure user profile exists before processing
      await ensureUserExists(user)
      
      // Step 1: Page Validation
      updateStep('validate-pages', 'processing', 0)
      
      // Get the uploaded file for validation and processing
      const { StorageService } = await import('@/lib/supabase/storage')
      const fileUrl = await StorageService.getResumeFileUrl(filePath)
      
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const file = new File([blob], fileName, { type: blob.type })

      // Validate page count (this will throw an error if multi-page)
      await OCRProcessor.validatePageCount(file)
      updateStep('validate-pages', 'completed', 100)

      // Step 2: OCR Processing
      updateStep('ocr', 'processing', 0)
      const ocrResult = await OCRProcessor.processFile(file)
      updateStep('ocr', 'completed', 100)

      // Step 3: Preparing AI Analysis
      updateStep('ai-prepare', 'processing', 0)
      // Brief pause to show preparation step
      await new Promise(resolve => setTimeout(resolve, 500))
      updateStep('ai-prepare', 'completed', 100)

      // Step 4: AI Structure Analysis with Progress Tracking
      updateStep('ai-parse', 'processing', 0)
      
      // Create progress callback for AI parsing
      const progressCallback = (progress: number) => {
        updateStep('ai-parse', 'processing', progress)
      }
      
      const parsedContent = await parseResumeStructure(ocrResult.text, progressCallback)
      updateStep('ai-parse', 'completed', 100)

      // Step 5: Validate Content
      updateStep('validate', 'processing', 0)
      // Basic validation - ensure required fields exist
      if (!parsedContent.contact || !parsedContent.experience) {
        throw new Error('Failed to extract essential resume sections')
      }
      setExtractedContent(parsedContent)
      updateStep('validate', 'completed', 100)

      // Step 6: Save to Database
      updateStep('save', 'processing', 0)
      const resumeTitle = parsedContent.contact.name 
        ? `${parsedContent.contact.name}'s Resume`
        : 'My Resume'


      let savedResume
      try {
        savedResume = await ResumeService.createResume({
          title: resumeTitle,
          content: parsedContent,
          file_url: filePath,
          user_id: user.id
        })
        updateStep('save', 'completed', 100)
      } catch (dbError) {
        console.error('Database insert failed:', dbError)
        throw dbError
      }
      
      // Cleanup OCR worker
      await OCRProcessor.cleanup()
      
      onProcessingComplete?.(savedResume.id)
    } catch (error) {
      console.error('Resume processing failed:', error)
      let errorMessage = 'Unknown error occurred'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Provide more helpful error messages
        if (error.message.includes('bucket') && error.message.includes('not found')) {
          errorMessage = 'Storage configuration error. Please ensure the "resumes" bucket exists in your Supabase project.'
        } else if (error.message.includes('OCR processing failed')) {
          errorMessage = 'Failed to extract text from your resume. Please try a different file format or ensure the file is not corrupted.'
        } else if (error.message.includes('No readable text found')) {
          errorMessage = 'Your resume appears to be image-based. Please try uploading a text-based PDF or DOC file.'
        } else if (error.message.includes('Failed to save resume')) {
          errorMessage = 'Failed to save your resume to the database. Please check your internet connection and try again.'
        } else if (error.message.includes('Authentication')) {
          errorMessage = 'Authentication error. Please log in again.'
        }
      }
      
      setError(errorMessage)
      
      // Mark current step as error
      const processingStep = steps.find(step => step.status === 'processing')
      if (processingStep) {
        updateStep(processingStep.id, 'error', 0)
      }
      
      // Cleanup OCR worker on error
      try {
        await OCRProcessor.cleanup()
      } catch (cleanupError) {
        console.warn('Failed to cleanup OCR worker:', cleanupError)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUploadError = (error: string) => {
    setError(error)
    updateStep('upload', 'error', 0)
  }

  const resetProcessor = () => {
    setIsProcessing(false)
    setExtractedContent(null)
    setError(null)
    setSteps([
      { 
        id: 'upload', 
        title: 'Upload Resume', 
        description: 'File uploaded successfully',
        status: 'pending', 
        progress: 0,
        estimatedTime: '< 1s'
      },
      { 
        id: 'validate-pages', 
        title: 'Validate Page Count', 
        description: 'Ensuring single-page format',
        status: 'pending', 
        progress: 0,
        estimatedTime: '< 1s'
      },
      { 
        id: 'ocr', 
        title: 'Extract Text', 
        description: 'Reading content from your resume',
        status: 'pending', 
        progress: 0,
        estimatedTime: '2-3s'
      },
      { 
        id: 'ai-prepare', 
        title: 'Preparing AI Analysis', 
        description: 'Setting up intelligent processing',
        status: 'pending', 
        progress: 0,
        estimatedTime: '< 1s'
      },
      { 
        id: 'ai-parse', 
        title: 'AI Structure Analysis', 
        description: 'Analyzing and organizing your content',
        status: 'pending', 
        progress: 0,
        estimatedTime: '5-8s'
      },
      { 
        id: 'validate', 
        title: 'Validate Content', 
        description: 'Ensuring all sections are complete',
        status: 'pending', 
        progress: 0,
        estimatedTime: '< 1s'
      },
      { 
        id: 'save', 
        title: 'Save Resume', 
        description: 'Storing your processed resume',
        status: 'pending', 
        progress: 0,
        estimatedTime: '1-2s'
      }
    ])
  }

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {!isProcessing && steps.every(step => step.status === 'pending') && (
        <ResumeUpload
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      )}

      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Processing Your Resume
            </CardTitle>
            <CardDescription>
              Please wait while we extract and structure your resume content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {getStepIcon(step)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{step.title}</span>
                      {step.description && (
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {step.status === 'completed' ? '✓ Done' : 
                         step.status === 'processing' ? 'Processing...' :
                         step.status === 'error' ? '✗ Failed' : 'Pending'}
                      </span>
                      {step.estimatedTime && step.status === 'processing' && (
                        <p className="text-xs text-muted-foreground">{step.estimatedTime}</p>
                      )}
                    </div>
                  </div>
                  {step.status === 'processing' && (
                    <Progress value={step.progress} className="mt-2" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {extractedContent && steps.every(step => step.status === 'completed') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Processing Complete!
            </CardTitle>
            <CardDescription>
              Your resume has been successfully processed and saved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Name:</strong> {extractedContent.contact.name || 'Not found'}
                </div>
                <div>
                  <strong>Email:</strong> {extractedContent.contact.email || 'Not found'}
                </div>
                <div>
                  <strong>Experience:</strong> {extractedContent.experience.length} positions
                </div>
                <div>
                  <strong>Skills:</strong> {extractedContent.skills.length} skills
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => window.location.href = '/resumes'}>
                  View All Resumes
                </Button>
                <Button variant="outline" onClick={resetProcessor}>
                  Process Another Resume
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}