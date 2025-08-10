'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BadgeListProps {
  items: string[]
  maxVisible?: number
  className?: string
  onOverflowClick?: () => void
}

export function BadgeList({ items, maxVisible = 8, className, onOverflowClick }: BadgeListProps) {
  if (items.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        None selected
      </div>
    )
  }

  const visibleItems = items.slice(0, maxVisible)
  const hiddenCount = Math.max(0, items.length - maxVisible)

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {visibleItems.map((item, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {item}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <button
          onClick={onOverflowClick}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-dashed border-muted-foreground/30 hover:border-foreground/30 rounded px-2 py-1"
        >
          +{hiddenCount} more
        </button>
      )}
    </div>
  )
}