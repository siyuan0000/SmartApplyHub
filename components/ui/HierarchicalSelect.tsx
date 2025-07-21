'use client'

import * as React from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export interface HierarchicalOption {
  group: string
  label: string
  value: string
}

export interface HierarchicalGroup {
  groupKey: string
  groupLabel: string
  options: { label: string; value: string }[]
}

interface HierarchicalSelectProps {
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  groups: HierarchicalGroup[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  multiple?: boolean
  maxSelected?: number
  disabled?: boolean
  className?: string
  showSearch?: boolean
  showGroupCounts?: boolean
}

export function HierarchicalSelect({
  placeholder = '请选择',
  emptyText = '未找到选项',
  searchPlaceholder = '搜索...',
  groups,
  value = [],
  onValueChange,
  multiple = false,
  maxSelected,
  disabled = false,
  className,
  showSearch = true,
  showGroupCounts = true,
}: HierarchicalSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  // Filter groups based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchValue) return groups

    return groups.map(group => ({
      ...group,
      options: group.options.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.value.toLowerCase().includes(searchValue.toLowerCase())
      )
    })).filter(group => group.options.length > 0)
  }, [groups, searchValue])

  const handleSelect = (selectedValue: string) => {
    if (!onValueChange) return

    if (multiple) {
      const newValue = value.includes(selectedValue)
        ? value.filter(item => item !== selectedValue)
        : maxSelected && value.length >= maxSelected
        ? value
        : [...value, selectedValue]
      
      onValueChange(newValue)
    } else {
      onValueChange([selectedValue])
      setOpen(false)
    }
  }

  const handleClearAll = () => {
    onValueChange?.([])
  }

  const getDisplayText = () => {
    if (value.length === 0) return placeholder
    
    if (!multiple) {
      const selectedOption = groups
        .flatMap(group => group.options)
        .find(option => option.value === value[0])
      return selectedOption?.label || value[0]
    }

    if (value.length === 1) {
      const selectedOption = groups
        .flatMap(group => group.options)
        .find(option => option.value === value[0])
      return selectedOption?.label || value[0]
    }

    return `已选择 ${value.length} 项`
  }

  const totalOptions = groups.reduce((total, group) => total + group.options.length, 0)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !value.length && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="truncate">{getDisplayText()}</span>
            {multiple && value.length > 1 && (
              <Badge variant="secondary" className="text-xs">
                {value.length}
              </Badge>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-w-[400px] p-0" align="start">
        {showSearch && (
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        )}
        
        {multiple && value.length > 0 && (
          <div className="border-b p-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>已选择 {value.length} 项</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-auto p-1 text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <div className="max-h-[300px] overflow-auto">
          {filteredGroups.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            filteredGroups.map((group, groupIndex) => (
              <DropdownMenuGroup key={group.groupKey}>
                <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold">
                  <span>{group.groupLabel}</span>
                  {showGroupCounts && (
                    <Badge variant="outline" className="text-xs">
                      {group.options.length}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                {group.options.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer px-2 py-1.5"
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <div
                        className={cn(
                          'h-4 w-4 border border-primary rounded-sm flex items-center justify-center',
                          value.includes(option.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50'
                        )}
                      >
                        {value.includes(option.value) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span className="flex-1 truncate">{option.label}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                {groupIndex < filteredGroups.length - 1 && <DropdownMenuSeparator />}
              </DropdownMenuGroup>
            ))
          )}
        </div>

        {totalOptions > 0 && (
          <div className="border-t p-2 text-xs text-muted-foreground text-center">
            共 {totalOptions} 个选项
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Specialized components for location and industry

interface LocationSelectProps extends Omit<HierarchicalSelectProps, 'groups'> {
  locationGroups: { tier: string; label: string; cities: string[] }[]
}

export function LocationSelect({ locationGroups, ...props }: LocationSelectProps) {
  const groups: HierarchicalGroup[] = locationGroups.map(group => ({
    groupKey: group.tier,
    groupLabel: group.label,
    options: group.cities.map(city => ({ label: city, value: city }))
  }))

  return (
    <HierarchicalSelect
      {...props}
      groups={groups}
      placeholder="选择地区"
      emptyText="未找到地区"
      searchPlaceholder="搜索城市..."
    />
  )
}

interface IndustrySelectProps extends Omit<HierarchicalSelectProps, 'groups'> {
  industryGroups: { category: string; label: string; industries: string[] }[]
}

export function IndustrySelect({ industryGroups, ...props }: IndustrySelectProps) {
  const groups: HierarchicalGroup[] = industryGroups.map(group => ({
    groupKey: group.category,
    groupLabel: group.label,
    options: group.industries.map(industry => ({ label: industry, value: industry }))
  }))

  return (
    <HierarchicalSelect
      {...props}
      groups={groups}
      placeholder="选择行业"
      emptyText="未找到行业"
      searchPlaceholder="搜索行业..."
    />
  )
}