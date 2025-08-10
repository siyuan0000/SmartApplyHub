'use client'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BadgeList } from '@/components/ui/badge-list'
import { Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreferenceDisplayProps {
  label: string
  value?: string | number | null
  items?: string[]
  maxVisible?: number
  onEdit: () => void
  className?: string
  required?: boolean
}

export function PreferenceDisplay({ 
  label, 
  value, 
  items, 
  maxVisible = 8,
  onEdit, 
  className, 
  required = false 
}: PreferenceDisplayProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-auto p-1 text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="min-h-[24px] flex items-center">
        {items ? (
          <BadgeList 
            items={items} 
            maxVisible={maxVisible}
            onOverflowClick={onEdit}
          />
        ) : value !== null && value !== undefined && value !== '' ? (
          <div className="text-sm">{value}</div>
        ) : (
          <div className="text-sm text-muted-foreground">Not specified</div>
        )}
      </div>
    </div>
  )
}