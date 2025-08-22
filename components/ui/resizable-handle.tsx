'use client'

import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface ResizableHandleProps {
  onMouseDown: (e: React.MouseEvent) => void
  isResizing: boolean
  className?: string
  position?: 'left' | 'right'
}

export function ResizableHandle({ 
  onMouseDown, 
  isResizing, 
  className,
  position = 'left'
}: ResizableHandleProps) {
  return (
    <div
      className={cn(
        "group relative flex items-center justify-center bg-border hover:bg-border/80 transition-colors cursor-col-resize select-none",
        "w-1 h-full z-50",
        isResizing && "bg-primary",
        position === 'left' && "border-r",
        position === 'right' && "border-l", 
        className
      )}
      onMouseDown={onMouseDown}
    >
      {/* Hover area for better UX */}
      <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
      
      {/* Visual indicator on hover */}
      <div className={cn(
        "absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity",
        isResizing && "opacity-100 bg-primary/30"
      )} />
      
      {/* Grip icon */}
      <GripVertical className={cn(
        "h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute",
        isResizing && "opacity-100 text-primary"
      )} />
    </div>
  )
}