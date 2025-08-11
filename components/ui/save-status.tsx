'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Save, 
  Check, 
  Clock, 
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react'
import { useEffect, useState } from 'react'

export interface SaveStatusProps {
  isDirty: boolean
  saving: boolean
  error: string | null
  autoSaveEnabled: boolean
  autoSaveStatus: 'disabled' | 'saving' | 'up-to-date' | 'recent' | 'pending'
  nextAutoSave?: number | null
  onSave: () => void
  onToggleAutoSave: () => void
  className?: string
}

export function SaveStatus({
  isDirty,
  saving,
  error,
  autoSaveEnabled,
  autoSaveStatus,
  nextAutoSave,
  onSave,
  onToggleAutoSave,
  className = ''
}: SaveStatusProps) {
  const [nextAutoSaveCountdown, setNextAutoSaveCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (nextAutoSave && nextAutoSave > 0) {
      setNextAutoSaveCountdown(nextAutoSave)
      
      const interval = setInterval(() => {
        setNextAutoSaveCountdown(prev => {
          if (!prev || prev <= 1000) {
            clearInterval(interval)
            return null
          }
          return prev - 1000
        })
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setNextAutoSaveCountdown(null)
    }
  }, [nextAutoSave])

  const getStatusIcon = () => {
    if (saving) return <Loader2 className="h-3 w-3 animate-spin" />
    if (error) return <AlertCircle className="h-3 w-3 text-destructive" />
    if (isDirty) return <Clock className="h-3 w-3 text-orange-500" />
    return <Check className="h-3 w-3 text-green-500" />
  }

  const getStatusText = () => {
    if (saving) return 'Saving...'
    if (error) return 'Save failed'
    if (isDirty) return 'Unsaved changes'
    return 'All changes saved'
  }

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (saving) return 'secondary'
    if (error) return 'destructive'
    if (isDirty) return 'outline'
    return 'secondary'
  }

  const formatTimeUntilSave = (ms: number | null) => {
    if (!ms) return null
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Save Status Badge */}
      <Badge 
        variant={getStatusVariant()} 
        className="flex items-center gap-1.5 px-2.5 py-1"
      >
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </Badge>

      {/* Auto-save Status */}
      {autoSaveEnabled && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Auto-save: {autoSaveStatus === 'saving' ? 'Saving...' : 
                      autoSaveStatus === 'up-to-date' ? 'On' :
                      autoSaveStatus === 'recent' ? 'Recent' : 
                      'Pending'}
          </Badge>
          
          {nextAutoSaveCountdown && (
            <span className="text-xs text-muted-foreground">
              Next: {formatTimeUntilSave(nextAutoSaveCountdown)}
            </span>
          )}
        </div>
      )}

      {/* Save Button */}
      <Button
        size="sm"
        variant={isDirty ? "default" : "outline"}
        onClick={onSave}
        disabled={saving || (!isDirty && !error)}
        className="h-8 px-3 gap-1.5"
      >
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Save className="h-3 w-3" />
        )}
        <span className="text-xs">
          {saving ? 'Saving...' : error ? 'Retry Save' : 'Save'}
        </span>
      </Button>

      {/* Auto-save Toggle */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onToggleAutoSave}
        className="h-8 px-2 gap-1"
        title={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
      >
        <Settings className="h-3 w-3" />
        <span className="text-xs">
          Auto: {autoSaveEnabled ? 'On' : 'Off'}
        </span>
      </Button>

      {/* Error Display */}
      {error && (
        <div className="text-xs text-destructive max-w-xs truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  )
}

export function CompactSaveStatus({
  isDirty,
  saving,
  error,
  onSave,
  className = ''
}: {
  isDirty: boolean
  saving: boolean
  error: string | null
  onSave: () => void
  className?: string
}) {
  const getStatusColor = () => {
    if (error) return 'text-destructive'
    if (saving) return 'text-blue-600'
    if (isDirty) return 'text-orange-600'
    return 'text-green-600'
  }

  const getStatusText = () => {
    if (saving) return 'Saving...'
    if (error) return 'Error'
    if (isDirty) return 'Unsaved'
    return 'Saved'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 text-xs ${getStatusColor()}`}>
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : error ? (
          <AlertCircle className="h-3 w-3" />
        ) : isDirty ? (
          <Clock className="h-3 w-3" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        <span>{getStatusText()}</span>
      </div>
      
      {(isDirty || error) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onSave}
          disabled={saving}
          className="h-6 px-2 text-xs"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      )}
    </div>
  )
}