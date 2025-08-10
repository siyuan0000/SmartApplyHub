'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, MapPin, Clock, Bookmark, Eye } from 'lucide-react'
import { useState } from 'react'

interface RecommendedJob {
  id: string
  title: string
  company_name: string
  location: string
  description: string
  salary_range?: string
  job_type?: string
  industry?: string
  remote_work_type?: string
  work_days_per_week?: string
  department?: string
  job_level?: string
  created_at: string
  match_reasons?: string[]
}

interface RecommendedJobCardProps {
  job: RecommendedJob
  onViewDetails?: (job: RecommendedJob) => void
  onSave?: (job: RecommendedJob) => void
  onApply?: (job: RecommendedJob) => void
  isSaved?: boolean
}

export function RecommendedJobCard({ 
  job, 
  onViewDetails, 
  onSave, 
  onApply,
  isSaved = false 
}: RecommendedJobCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const formatDate = (dateString: string) => {
    const now = new Date()
    const jobDate = new Date(dateString)
    const diffTime = Math.abs(now.getTime() - jobDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今天发布'
    } else if (diffDays === 1) {
      return '1天前'
    } else if (diffDays <= 7) {
      return `${diffDays}天前`
    } else {
      return jobDate.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      })
    }
  }
  
  const getRemoteWorkBadge = (remoteType?: string) => {
    if (!remoteType) return null
    
    if (remoteType === '远程' || remoteType.includes('远程')) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">远程</Badge>
    } else if (remoteType === '部分远程' || remoteType.includes('部分远程')) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">混合</Badge>
    }
    
    return null
  }
  
  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
  
  return (
    <Card 
      className="h-full transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails?.(job)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold mb-1 line-clamp-2 leading-5">
              {job.title}
            </CardTitle>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Building className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{job.company_name}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {getRemoteWorkBadge(job.remote_work_type)}
            {job.salary_range && (
              <Badge variant="outline" className="text-xs text-green-600">
                {job.salary_range}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Match Reasons */}
        {job.match_reasons && job.match_reasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.match_reasons.slice(0, 2).map((reason, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                {reason}
              </Badge>
            ))}
          </div>
        )}

        {/* Location and Department */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{job.location}</span>
          </div>
          {job.created_at && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(job.created_at)}</span>
            </div>
          )}
        </div>
        
        {/* Industry and Job Level */}
        {(job.industry || job.job_level) && (
          <div className="flex flex-wrap gap-1">
            {job.industry && (
              <Badge variant="outline" className="text-xs">
                {job.industry}
              </Badge>
            )}
            {job.job_level && (
              <Badge variant="outline" className="text-xs">
                {job.job_level}
              </Badge>
            )}
          </div>
        )}
        
        {/* Job Description */}
        <CardDescription className="text-xs leading-relaxed">
          {truncateDescription(job.description)}
        </CardDescription>
        
        {/* Actions */}
        <div className={`flex gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-80'}`}>
          <Button 
            variant="outline" 
            size="sm"
            className="h-7 px-2 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onSave?.(job)
            }}
          >
            <Bookmark className={`h-3 w-3 mr-1 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? '已收藏' : '收藏'}
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails?.(job)
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            详情
          </Button>
          <Button 
            size="sm"
            className="h-7 px-2 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onApply?.(job)
            }}
          >
            申请
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}