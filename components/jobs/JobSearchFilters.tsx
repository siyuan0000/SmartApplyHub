'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Building, Briefcase, X, RotateCcw } from 'lucide-react'
import { LocationSelect, IndustrySelect } from '@/components/ui/HierarchicalSelect'

interface FilterOptions {
  industries: string[]
  locations: string[]
  remoteTypes: string[]
  jobTypes: string[]
  hierarchical?: {
    locationGroups: { tier: string; label: string; cities: string[] }[]
    industryGroups: { category: string; label: string; industries: string[] }[]
    remoteWorkTypes: { label: string; value: string }[]
    jobTypes: { label: string; value: string }[]
  }
}

interface SearchFilters {
  query: string
  location: string
  industry: string
  remote: string
  jobType: string
}

interface JobSearchFiltersProps {
  onSearch: (filters: SearchFilters) => void
  isLoading?: boolean
}

export function JobSearchFilters({ onSearch, isLoading }: JobSearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    industry: '',
    remote: '',
    jobType: ''
  })
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    industries: [],
    locations: [],
    remoteTypes: [],
    jobTypes: [],
    hierarchical: {
      locationGroups: [],
      industryGroups: [],
      remoteWorkTypes: [],
      jobTypes: []
    }
  })
  
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  
  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/jobs/filters')
        if (response.ok) {
          const data = await response.json()
          setFilterOptions(data)
        }
      } catch (error) {
        console.error('Failed to load filter options:', error)
      } finally {
        setIsLoadingOptions(false)
      }
    }
    
    loadFilterOptions()
  }, [])
  
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    // Convert "all" value back to empty string for API calls
    const filterValue = value === 'all' ? '' : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
  }
  
  const handleSearch = () => {
    onSearch(filters)
  }
  
  const handleClearFilter = (key: keyof SearchFilters) => {
    const updatedFilters = { ...filters, [key]: '' }
    setFilters(updatedFilters)
    // Immediately trigger search with updated filters
    onSearch(updatedFilters)
  }
  
  const handleClearAll = () => {
    const clearedFilters = {
      query: '',
      location: '',
      industry: '',
      remote: '',
      jobType: ''
    }
    setFilters(clearedFilters)
    onSearch(clearedFilters)
  }
  
  const hasActiveFilters = Object.values(filters).some(value => value !== '')
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">职位搜索</CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="h-8 px-3 text-xs hover:bg-destructive hover:text-destructive-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              清除筛选
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Query */}
        <div className="space-y-2">
          <Label htmlFor="search">搜索职位</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="输入职位名称、公司名称或关键词..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        
        {/* Location Filter */}
        <div className="space-y-2">
          <Label>工作地点</Label>
          {filterOptions.hierarchical?.locationGroups.length ? (
            <LocationSelect
              locationGroups={filterOptions.hierarchical.locationGroups}
              value={filters.location ? [filters.location] : []}
              onValueChange={(value) => handleFilterChange('location', value[0] || '')}
              disabled={isLoadingOptions}
              multiple={false}
            />
          ) : (
            <Select 
              value={filters.location || 'all'} 
              onValueChange={(value) => handleFilterChange('location', value)}
              disabled={isLoadingOptions}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <SelectValue placeholder="选择工作地点" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有地点</SelectItem>
                {filterOptions.locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {/* Industry Filter */}
        <div className="space-y-2">
          <Label>行业分类</Label>
          {filterOptions.hierarchical?.industryGroups.length ? (
            <IndustrySelect
              industryGroups={filterOptions.hierarchical.industryGroups}
              value={filters.industry ? [filters.industry] : []}
              onValueChange={(value) => handleFilterChange('industry', value[0] || '')}
              disabled={isLoadingOptions}
              multiple={false}
            />
          ) : (
            <Select 
              value={filters.industry || 'all'} 
              onValueChange={(value) => handleFilterChange('industry', value)}
              disabled={isLoadingOptions}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <SelectValue placeholder="选择行业" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有行业</SelectItem>
                {filterOptions.industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {/* Remote Work Filter */}
        <div className="space-y-2">
          <Label>工作方式</Label>
          <Select 
            value={filters.remote || 'all'} 
            onValueChange={(value) => handleFilterChange('remote', value)}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <SelectValue placeholder="选择工作方式" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有方式</SelectItem>
              <SelectItem value="remote">远程工作</SelectItem>
              <SelectItem value="onsite">现场办公</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label>当前筛选条件</Label>
            <div className="flex flex-wrap gap-2">
              {filters.query && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  搜索: {filters.query}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearFilter('query')
                    }}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                    aria-label="清除搜索条件"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  地点: {filters.location}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearFilter('location')
                    }}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                    aria-label="清除地点筛选"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.industry && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  行业: {filters.industry}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearFilter('industry')
                    }}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                    aria-label="清除行业筛选"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.remote && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  工作方式: {filters.remote === 'remote' ? '远程工作' : '现场办公'}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearFilter('remote')
                    }}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                    aria-label="清除工作方式筛选"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Search Button */}
        <Button 
          onClick={handleSearch} 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? '搜索中...' : '搜索职位'}
        </Button>
      </CardContent>
    </Card>
  )
}