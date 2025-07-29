'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Settings, Eye, EyeOff, TestTube } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailConfig {
  email_address: string
  smtp_host: string
  smtp_port: number
  use_tls: boolean
  has_password?: boolean
}

interface EmailConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfigSaved?: () => void
}

export function EmailConfigModal({ open, onOpenChange, onConfigSaved }: EmailConfigModalProps) {
  const [config, setConfig] = useState<EmailConfig>({
    email_address: '',
    smtp_host: 'smtp-mail.outlook.com',
    smtp_port: 587,
    use_tls: true
  })
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  // Load existing configuration when modal opens
  useEffect(() => {
    if (open) {
      loadExistingConfig()
    }
  }, [open])

  const loadExistingConfig = async () => {
    try {
      const response = await fetch('/api/email/config', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
          // Don't set password - user needs to enter it again for security
        }
      }
    } catch (error) {
      console.error('Failed to load email config:', error)
    }
  }

  const handleSave = async () => {
    if (!config.email_address || !password) {
      setError('Email address and password are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/email/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...config,
          email_password: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration')
      }

      toast({
        title: 'Success',
        description: 'Email configuration saved successfully'
      })

      onConfigSaved?.()
      onOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!config.email_address || !password) {
      setError('Email address and password are required')
      return
    }

    setTesting(true)
    setError('')

    try {
      const response = await fetch('/api/email/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...config,
          email_password: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Configuration test failed')
      }

      toast({
        title: 'Test Successful',
        description: 'Email configuration is working correctly'
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Configuration test failed')
    } finally {
      setTesting(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/email/config', {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete configuration')
      }

      toast({
        title: 'Configuration Deleted',
        description: 'Email configuration has been removed'
      })

      setConfig({
        email_address: '',
        smtp_host: 'smtp-mail.outlook.com',
        smtp_port: 587,
        use_tls: true
      })
      setPassword('')
      onConfigSaved?.()
      onOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete configuration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your email settings to send cover letters and applications directly from the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@outlook.com"
              value={config.email_address}
              onChange={(e) => setConfig({ ...config, email_address: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={config.has_password ? 'Enter new password (optional)' : 'Enter your email password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              For Outlook/Hotmail, use an app-specific password if you have 2FA enabled.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input
                id="smtp_host"
                value={config.smtp_host}
                onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input
                id="smtp_port"
                type="number"
                value={config.smtp_port}
                onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 587 })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="use_tls"
              checked={config.use_tls}
              onChange={(e) => setConfig({ ...config, use_tls: e.target.checked })}
              disabled={loading}
            />
            <Label htmlFor="use_tls">Use TLS/STARTTLS</Label>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={loading || testing || !config.email_address || !password}
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test
                </>
              )}
            </Button>
            {config.has_password && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Config
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !config.email_address || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}