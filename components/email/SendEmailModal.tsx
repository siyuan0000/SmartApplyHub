'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Send, Settings, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EmailConfigModal } from './EmailConfigModal'

interface SendEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTo?: string
  initialSubject?: string
  initialBody?: string
  jobApplicationId?: string
  onEmailSent?: () => void
}

interface EmailConfig {
  email_address: string
  smtp_host: string
  smtp_port: number
  use_tls: boolean
  has_password: boolean
}

export function SendEmailModal({ 
  open, 
  onOpenChange, 
  initialTo = '', 
  initialSubject = '', 
  initialBody = '',
  jobApplicationId,
  onEmailSent 
}: SendEmailModalProps) {
  const [to, setTo] = useState(initialTo)
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const { toast } = useToast()

  // Load email configuration and set initial values when modal opens
  useEffect(() => {
    if (open) {
      loadEmailConfig()
      setTo(initialTo)
      setSubject(initialSubject)
      setBody(initialBody)
      setError('')
    }
  }, [open, initialTo, initialSubject, initialBody])

  const loadEmailConfig = async () => {
    try {
      setConfigLoading(true)
      const response = await fetch('/api/email/config', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setEmailConfig(data.config)
      }
    } catch (error) {
      console.error('Failed to load email config:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  const handleSend = async () => {
    if (!emailConfig) {
      setError('Please configure your email settings first')
      return
    }

    if (!to || !subject || !body) {
      setError('Please fill in all required fields')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      setError('Please enter a valid recipient email address')
      return
    }

    setSending(true)
    setError('')

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          to,
          subject,
          body,
          jobApplicationId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast({
        title: 'Email Sent',
        description: `Your email has been sent successfully to ${to}`
      })

      onEmailSent?.()
      onOpenChange(false)

      // Reset form
      setTo('')
      setSubject('')
      setBody('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleConfigSaved = () => {
    loadEmailConfig()
  }

  if (configLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading email configuration...
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!emailConfig) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Email
              </DialogTitle>
              <DialogDescription>
                Configure your email settings to send messages.
              </DialogDescription>
            </DialogHeader>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Email Configuration Required
                </CardTitle>
                <CardDescription>
                  You need to configure your email settings before you can send emails.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setConfigModalOpen(true)} className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Email Settings
                </Button>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <EmailConfigModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          onConfigSaved={handleConfigSaved}
        />
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email
            </DialogTitle>
            <DialogDescription>
              Send your cover letter and application via email from {emailConfig.email_address}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="from">
                From {(emailConfig as EmailConfig & { from_env?: boolean }).from_env && <span className="text-xs text-green-600">(from environment)</span>}
              </Label>
              <Input
                id="from"
                value={emailConfig.email_address}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">To <span className="text-red-500">*</span></Label>
              <Input
                id="to"
                type="email"
                placeholder="hr@company.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={sending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
              <Input
                id="subject"
                placeholder="Application for [Position] - [Your Name]"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message <span className="text-red-500">*</span></Label>
              <Textarea
                id="body"
                placeholder="Dear Hiring Manager,

I am writing to express my interest in the [position] role at [company]. Please find my resume attached for your consideration.

Best regards,
[Your Name]"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sending}
                rows={15}
                className="resize-y min-h-[200px] max-h-[400px]"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• Your active resume will be automatically attached to this email</p>
              <p>• Make sure to personalize the subject and message for the specific company</p>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfigModalOpen(true)}
              disabled={sending}
              className="w-full sm:w-auto"
            >
              <Settings className="mr-2 h-4 w-4" />
              Email Settings
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sending}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !to || !subject || !body}
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmailConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        onConfigSaved={handleConfigSaved}
      />
    </>
  )
}