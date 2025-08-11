'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Wifi, 
  RefreshCw, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

export interface AIErrorHandlerProps {
  error: string | null
  isLoading: boolean
  onRetry: () => void
  onDismiss: () => void
  feature: string
  className?: string
}

export function AIErrorHandler({
  error,
  isLoading,
  onRetry,
  onDismiss,
  feature,
  className = ''
}: AIErrorHandlerProps) {
  if (!error) return null

  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('connectivity') || errorMessage.includes('network')) {
      return 'connectivity'
    }
    if (errorMessage.includes('timeout')) {
      return 'timeout'
    }
    if (errorMessage.includes('rate limit')) {
      return 'rate-limit'
    }
    if (errorMessage.includes('authentication')) {
      return 'auth'
    }
    return 'general'
  }

  const errorType = getErrorType(error)

  const getErrorIcon = () => {
    switch (errorType) {
      case 'connectivity':
        return <Wifi className="h-4 w-4" />
      case 'timeout':
        return <Clock className="h-4 w-4" />
      case 'rate-limit':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <XCircle className="h-4 w-4" />
    }
  }

  const getErrorBadge = () => {
    switch (errorType) {
      case 'connectivity':
        return <Badge variant="destructive" className="text-xs">Connection Issue</Badge>
      case 'timeout':
        return <Badge variant="outline" className="text-xs">Timeout</Badge>
      case 'rate-limit':
        return <Badge variant="secondary" className="text-xs">Rate Limited</Badge>
      case 'auth':
        return <Badge variant="destructive" className="text-xs">Authentication</Badge>
      default:
        return <Badge variant="outline" className="text-xs">AI Service Error</Badge>
    }
  }

  const getRetryDelay = () => {
    switch (errorType) {
      case 'rate-limit':
        return 'Try again in 1-2 minutes'
      case 'timeout':
        return 'Try again immediately'
      case 'connectivity':
        return 'Check connection and retry'
      default:
        return 'Try again in a moment'
    }
  }

  const getSuggestions = () => {
    const suggestions = []
    
    switch (errorType) {
      case 'connectivity':
        suggestions.push('Check your internet connection')
        suggestions.push('Verify VPN or proxy settings')
        break
      case 'timeout':
        suggestions.push('The AI service may be busy')
        suggestions.push('Try breaking your request into smaller parts')
        break
      case 'rate-limit':
        suggestions.push('You\'ve reached the usage limit')
        suggestions.push('Wait a moment before trying again')
        break
      case 'auth':
        suggestions.push('Please refresh the page')
        suggestions.push('You may need to log in again')
        break
      default:
        suggestions.push('The AI service is temporarily unavailable')
        suggestions.push('You can continue editing manually')
    }
    
    return suggestions
  }

  return (
    <Alert variant="destructive" className={className}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getErrorIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">AI {feature} Failed</span>
              {getErrorBadge()}
            </div>
            
            <AlertDescription className="text-sm mb-3">
              {error.includes('I apologize, but I\'m currently unable to process') 
                ? `AI services are temporarily unavailable for ${feature.toLowerCase()}.`
                : error
              }
            </AlertDescription>
            
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">What to try:</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-3">
                {getSuggestions().map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
              
              {errorType !== 'auth' && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Retry timing:</span> {getRetryDelay()}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isLoading}
            className="h-8 px-3 text-xs"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-8 px-3 text-xs"
          >
            Dismiss
          </Button>
        </div>
      </div>
      
      {/* Offline indicator */}
      {errorType === 'connectivity' && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-dashed">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Working Offline</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You can continue editing your resume. Changes will be saved locally until connection is restored.
          </p>
        </div>
      )}
    </Alert>
  )
}

export function AIServiceStatus({ 
  isOnline = true, 
  lastError = null,
  className = ''
}: {
  isOnline?: boolean
  lastError?: string | null
  className?: string
}) {
  if (isOnline && !lastError) return null

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {!isOnline ? (
        <>
          <XCircle className="h-3 w-3 text-destructive" />
          <span className="text-destructive">AI services offline</span>
        </>
      ) : lastError ? (
        <>
          <AlertTriangle className="h-3 w-3 text-orange-500" />
          <span className="text-orange-600">AI services degraded</span>
        </>
      ) : (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="text-green-600">AI services online</span>
        </>
      )}
    </div>
  )
}