'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { History, Mail, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface EmailLog {
  id: string
  to_email: string
  subject: string
  body: string
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  error_message: string | null
  sent_at: string | null
  created_at: string
}

interface EmailLogsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailLogsModal({ open, onOpenChange }: EmailLogsModalProps) {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadEmailLogs()
    }
  }, [open])

  const loadEmailLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/logs', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to load email logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'sent':
        return 'default'
      case 'failed':
      case 'bounced':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Email History
          </DialogTitle>
          <DialogDescription>
            View your sent emails and their delivery status
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-6 w-[80px] rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-[150px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No emails sent</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your email history will appear here once you start sending emails.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        To: {log.to_email}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <Badge variant={getStatusVariant(log.status)}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      <strong>Subject:</strong> {log.subject}
                    </CardDescription>
                    <div className="text-xs text-muted-foreground">
                      {log.sent_at ? (
                        <>Sent {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })}</>
                      ) : (
                        <>Created {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <div className="font-medium mb-1">Message:</div>
                        <div className="bg-muted p-2 rounded text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">
                          {log.body}
                        </div>
                      </div>
                      {log.error_message && (
                        <div className="text-sm">
                          <div className="font-medium mb-1 text-red-600">Error:</div>
                          <div className="bg-red-50 border border-red-200 p-2 rounded text-xs text-red-700">
                            {log.error_message}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}