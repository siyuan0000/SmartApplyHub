'use client'

import { X } from 'lucide-react'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

export type TagType = 'job-role' | 'industry' | 'status' | 'optimization'

interface ResumeTagProps {
  children: React.ReactNode
  type: TagType
  onRemove?: () => void
  className?: string
}

const tagStyles: Record<TagType, string> = {
  'job-role': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  'industry': 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  'status': 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  'optimization': 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
}

export function ResumeTag({ children, type, onRemove, className }: ResumeTagProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 text-xs font-medium border transition-colors',
        tagStyles[type],
        className
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label="Remove tag"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}

interface TagGroupProps {
  title: string
  tags: string[]
  type: TagType
  onRemove?: (tag: string) => void
  className?: string
  maxDisplay?: number
}

export function TagGroup({ 
  title, 
  tags, 
  type, 
  onRemove, 
  className,
  maxDisplay = 3 
}: TagGroupProps) {
  if (!tags || tags.length === 0) return null

  const displayTags = tags.slice(0, maxDisplay)
  const remainingCount = tags.length - maxDisplay

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1">
        {displayTags.map((tag) => (
          <ResumeTag
            key={tag}
            type={type}
            onRemove={onRemove ? () => onRemove(tag) : undefined}
          >
            {tag}
          </ResumeTag>
        ))}
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            +{remainingCount} more
          </Badge>
        )}
      </div>
    </div>
  )
}