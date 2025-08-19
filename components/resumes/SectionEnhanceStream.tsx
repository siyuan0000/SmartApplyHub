'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, Copy, X, AlertCircle } from 'lucide-react'

interface SectionEnhanceStreamProps {
  streamedText: string
  isEnhancing: boolean
  error: string | null
  sectionType: string
  onCopyEnhanced: () => void
  onClose: () => void
}

export function SectionEnhanceStream({
  streamedText,
  isEnhancing,
  error,
  sectionType,
  onCopyEnhanced,
  onClose
}: SectionEnhanceStreamProps) {
  const extractEnhancedContent = (text: string): string => {
    const match = text.match(/=== ENHANCED_CONTENT ===\s*([\s\S]*)$/i)
    return match ? match[1].trim() : ''
  }

  const hasEnhancedContent = !isEnhancing && streamedText && extractEnhancedContent(streamedText)

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">AI Enhancement: {sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} Section</h3>
                <p className="text-sm text-muted-foreground">
                  {isEnhancing ? 'Model is streaming...' : 'Enhancement complete'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/5 border border-destructive/15 rounded-lg p-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold text-sm">Enhancement Error</span>
              </div>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
          )}

          {/* Streaming Output */}
          <div className="max-h-60 overflow-y-auto">
            <pre className="whitespace-pre-wrap bg-slate-900 text-slate-50 p-4 rounded-lg text-sm leading-relaxed">
              {streamedText || 'Waiting for AI response...'}
            </pre>
          </div>

          {/* Action Buttons */}
          {hasEnhancedContent && (
            <div className="flex justify-end gap-2">
              <Button 
                onClick={onCopyEnhanced}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Copy className="h-4 w-4" />
                Copy Enhanced Content
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}