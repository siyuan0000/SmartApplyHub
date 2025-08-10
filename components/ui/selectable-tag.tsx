'use client'

import { cn } from '@/lib/utils'

interface SelectableTagProps {
  label: string
  selected: boolean
  onClick: () => void
  className?: string
}

export function SelectableTag({ label, selected, onClick, className }: SelectableTagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
        "border border-border hover:border-primary/50",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {label}
    </button>
  )
}