'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectableTag } from '@/components/ui/selectable-tag'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  options: string[]
  selectedItems: string[]
  onSelectionChange: (items: string[]) => void
  onSave: () => void
  searchPlaceholder?: string
  maxSelection?: number
  categories?: { [key: string]: string[] }
}

export function MultiSelectModal({
  open,
  onOpenChange,
  title,
  description,
  options,
  selectedItems,
  onSelectionChange,
  onSave,
  searchPlaceholder = "Search options...",
  maxSelection,
  categories
}: MultiSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options
    return options.filter(option => 
      option.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  // Group options by category if provided
  const categorizedOptions = useMemo(() => {
    if (!categories) return { 'All Options': filteredOptions }
    
    const result: { [key: string]: string[] } = {}
    
    Object.entries(categories).forEach(([category, categoryOptions]) => {
      const filtered = categoryOptions.filter(option => 
        filteredOptions.includes(option)
      )
      if (filtered.length > 0) {
        result[category] = filtered
      }
    })
    
    return result
  }, [categories, filteredOptions])

  const toggleOption = (option: string) => {
    const isSelected = selectedItems.includes(option)
    if (isSelected) {
      onSelectionChange(selectedItems.filter(item => item !== option))
    } else {
      if (maxSelection && selectedItems.length >= maxSelection) return
      onSelectionChange([...selectedItems, option])
    }
  }

  const removeSelected = (option: string) => {
    onSelectionChange(selectedItems.filter(item => item !== option))
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSave = () => {
    onSave()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Selected ({selectedItems.length}{maxSelection ? `/${maxSelection}` : ''})
            </Label>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {selectedItems.map(item => (
                <Badge key={item} variant="default" className="text-xs">
                  {item}
                  <button
                    onClick={() => removeSelected(item)}
                    className="ml-1 hover:bg-primary-foreground/20 rounded-sm p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {Object.entries(categorizedOptions).map(([category, categoryOptions]) => (
            <div key={category}>
              {categories && (
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full text-left mb-2"
                >
                  <Label className="text-sm font-medium cursor-pointer hover:text-primary">
                    {category} ({categoryOptions.length})
                  </Label>
                </button>
              )}
              
              <div className={cn(
                "flex flex-wrap gap-2",
                categories && !expandedCategories.has(category) && "hidden"
              )}>
                {categoryOptions.map(option => {
                  const isSelected = selectedItems.includes(option)
                  const isDisabled = !isSelected && maxSelection && selectedItems.length >= maxSelection
                  
                  return (
                    <SelectableTag
                      key={option}
                      label={option}
                      selected={isSelected}
                      onClick={() => !isDisabled && toggleOption(option)}
                      className={cn(
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}