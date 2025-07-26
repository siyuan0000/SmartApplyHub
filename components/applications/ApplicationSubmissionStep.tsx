'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle,
  Send,
  Loader2,
  FileText,
  Mail,
  Building,
  User,
  MapPin,
  DollarSign,
  Copy,
  AlertCircle
} from 'lucide-react'
import { useApplicationWorkflowStore } from '@/store/application-workflow'

export function ApplicationSubmissionStep() {
  const {
    selectedJob,
    selectedResume,
    generatedEmail,
    isSubmittingApplication,
    setSubmittingApplication,
    setError,
    resetWorkflow
  } = useApplicationWorkflowStore()

  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean
    applicationId?: string
    message: string
  } | null>(null)

  const submitApplication = async () => {
    if (!selectedJob || !selectedResume || !generatedEmail) {
      setError('Missing required information')
      return
    }

    setSubmittingApplication(true)
    setError(null)

    try {
      // Create the job application record
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          job_posting_id: selectedJob.id,
          company_name: selectedJob.company_name,
          position_title: selectedJob.title,
          status: 'applied',
          notes: notes || `Application email generated:\n\nSubject: ${generatedEmail.subject}\n\n${generatedEmail.body}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      const data = await response.json()
      
      setSubmissionResult({
        success: true,
        applicationId: data.application.id,
        message: 'Application successfully submitted and tracked!'
      })
      setSubmitted(true)
      
      // Update applied_to array in resume (optional)
      try {
        await fetch(`/api/resumes/${selectedResume.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applied_to: [...(selectedResume.applied_to || []), selectedJob.id]
          })
        })
      } catch (resumeUpdateError) {
        // Don't fail the whole process if resume update fails
        console.warn('Failed to update resume applied_to list:', resumeUpdateError)
      }

    } catch (err) {
      setSubmissionResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to submit application'
      })
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setSubmittingApplication(false)
    }
  }

  const copyEmailToClipboard = async () => {
    if (!generatedEmail) return

    const emailText = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`
    
    try {
      await navigator.clipboard.writeText(emailText)
    } catch (err) {
      console.error('Failed to copy email:', err)
    }
  }

  const handleFinish = () => {
    resetWorkflow()
  }

  if (!selectedJob || !selectedResume || !generatedEmail) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <div className="text-muted-foreground mb-2">Missing Information</div>
        <p className="text-sm text-muted-foreground">
          Please complete all previous steps before submitting your application
        </p>
      </div>
    )
  }

  if (submitted && submissionResult?.success) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-600 mb-2">Application Submitted!</h3>
          <p className="text-muted-foreground">
            {submissionResult.message}
          </p>
        </div>

        <Card className="max-w-md mx-auto bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">Application ID</div>
            <div className="font-mono text-lg font-semibold">
              {submissionResult.applicationId?.slice(0, 8)}...
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Your application has been tracked and you can monitor its progress in the Applications dashboard.
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <a href="/applications">
                View Applications
              </a>
            </Button>
            <Button onClick={handleFinish}>
              Create Another Application
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Application Summary */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Review Your Application
        </h3>
        <p className="text-muted-foreground">
          Double-check all details before submitting your application
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-600" />
              <span>Job Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-lg">{selectedJob.title}</h4>
                <p className="text-muted-foreground">{selectedJob.company_name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedJob.location}
                  </div>
                  {selectedJob.salary_range && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {selectedJob.salary_range}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end">
                <Badge variant="outline" className="capitalize">
                  {selectedJob.job_type || 'full-time'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resume Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Resume</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">{selectedResume.title}</h4>
                {selectedResume.is_active && (
                  <Badge variant="outline" className="text-xs mt-1">
                    Active Resume
                  </Badge>
                )}
              </div>
              <div>
                <div className="text-sm">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedResume.content.contact.name || 'Name not set'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedResume.content.contact.email || 'Email not set'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <span>Application Email</span>
              </div>
              <Button variant="outline" size="sm" onClick={copyEmailToClipboard}>
                <Copy className="h-3 w-3 mr-1" />
                Copy Email
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Subject Line
                </Label>
                <div className="p-3 bg-gray-50 rounded-md font-medium text-sm">
                  {generatedEmail.subject}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Email Preview
                </Label>
                <div className="p-3 bg-gray-50 rounded-md text-sm max-h-40 overflow-y-auto">
                  <div className="whitespace-pre-wrap font-mono">
                    {generatedEmail.body.length > 300 
                      ? generatedEmail.body.substring(0, 300) + '...'
                      : generatedEmail.body}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {generatedEmail.tone} tone
                </Badge>
                {generatedEmail.keypoints && (
                  <Badge variant="outline">
                    {generatedEmail.keypoints.length} key points
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="notes" className="text-sm text-muted-foreground">
            Add any personal notes about this application for your reference
          </Label>
          <Textarea
            id="notes"
            placeholder="e.g., Applied through referral from John, Follow up in 1 week..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2"
          />
        </CardContent>
      </Card>

      {/* Error Display */}
      {submissionResult && !submissionResult.success && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-medium text-red-600">Submission Failed</div>
                <div className="text-sm text-red-700 mt-1">
                  {submissionResult.message}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={submitApplication}
          disabled={isSubmittingApplication}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-8"
        >
          {isSubmittingApplication ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting Application...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Application
            </>
          )}
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t">
        <p>
          By submitting, you confirm that all information is accurate and you&apos;re ready to send this application.
          The generated email will be saved to your application history for future reference.
        </p>
      </div>
    </div>
  )
}