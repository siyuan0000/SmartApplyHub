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
    <div className="flex-shrink-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg flex flex-col max-h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
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
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto">
        {/* Error Display */}
        {error && (
          <div className="flex-shrink-0 bg-destructive/5 border border-destructive/15 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-semibold text-sm">Enhancement Error</span>
            </div>
            <p className="text-sm text-destructive/90 mt-1">{error}</p>
          </div>
        )}

        {/* Streaming Output */}
        <div className="flex-1 min-h-0">
          <pre className="whitespace-pre-wrap bg-slate-900 text-slate-50 p-3 rounded-lg text-xs leading-relaxed min-h-[200px]">
            {streamedText || 'Waiting for AI response...'}
          </pre>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      {hasEnhancedContent && (
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            onClick={onCopyEnhanced}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white w-full"
            size="sm"
          >
            <Copy className="h-4 w-4" />
            Copy Enhanced Content
          </Button>
        </div>
      )}
    </div>
  )
}