'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { StorageService } from '@/lib/supabase/storage'
import { useAuth } from '@/hooks/useAuth'

interface ResumeUploadProps {
  onUploadComplete?: (filePath: string, fileName: string) => void
  onUploadError?: (error: string) => void
}

export function ResumeUpload({ onUploadComplete, onUploadError }: ResumeUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const { user } = useAuth()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      setErrorMessage('Please log in to upload files')
      setUploadStatus('error')
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    // Validate file
    const validation = StorageService.validateResumeFile(file)
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid file')
      setUploadStatus('error')
      onUploadError?.(validation.error || 'Invalid file')
      return
    }

    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const filePath = await StorageService.uploadResumeFile(file, user.id)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('success')
      onUploadComplete?.(filePath, file.name)
    } catch (error) {
      setUploadStatus('error')
      const errorMsg = error instanceof Error ? error.message : 'Upload failed'
      setErrorMessage(errorMsg)
      onUploadError?.(errorMsg)
    }
  }, [user, onUploadComplete, onUploadError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const resetUpload = () => {
    setUploadStatus('idle')
    setUploadProgress(0)
    setErrorMessage('')
  }

  return (
    <Card className={`border-2 border-dashed transition-colors ${
      isDragActive ? 'border-blue-500 bg-blue-50' : 
      uploadStatus === 'error' ? 'border-red-300 bg-red-50' :
      uploadStatus === 'success' ? 'border-green-300 bg-green-50' :
      'border-muted-foreground/25 hover:border-muted-foreground/50'
    }`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {uploadStatus === 'idle' && (
          <>
            <div {...getRootProps()} className="cursor-pointer w-full">
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {isDragActive ? 'Drop your resume here' : 'Drag and drop your resume file or click to browse'}
              </p>
              
              {/* Professional 1-page requirement notice */}
              <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 max-w-lg mx-auto">
                <Info className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-1">
                    Single-page resumes only
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    We process one-page resumes for optimal ATS compatibility and faster processing. 
                    Multi-page documents will be rejected during validation.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-center mb-4">
                <Button>Browse Files</Button>
                <Button variant="outline">Import from LinkedIn</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports PDF, DOC, DOCX files up to 10MB
              </p>
            </div>
          </>
        )}

        {uploadStatus === 'uploading' && (
          <>
            <FileText className="h-12 w-12 text-blue-600 mb-4 mx-auto" />
            <h3 className="text-lg font-medium mb-2">Uploading Resume</h3>
            <div className="w-full max-w-xs mb-4">
              <Progress value={uploadProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please wait while we process your resume...
            </p>
          </>
        )}

        {uploadStatus === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mb-4 mx-auto" />
            <h3 className="text-lg font-medium mb-2">Upload Successful!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your resume has been uploaded and is ready for processing.
            </p>
            <Button onClick={resetUpload} variant="outline">
              Upload Another Resume
            </Button>
          </>
        )}

        {uploadStatus === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-600 mb-4 mx-auto" />
            <h3 className="text-lg font-medium mb-2">Upload Failed</h3>
            <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
            <Button onClick={resetUpload} variant="outline">
              Try Again
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}