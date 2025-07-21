'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, MapPin, Clock, DollarSign, Users, Briefcase } from 'lucide-react'
import { useState } from 'react'

interface Job {
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
}

interface JobCardProps {
  job: Job
  onViewDetails?: (job: Job) => void
}

export function JobCard({ job, onViewDetails }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  const getRemoteWorkBadge = (remoteType?: string) => {
    if (!remoteType) return null
    
    // Handle exact database values
    if (remoteType === '远程') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">远程工作</Badge>
    } else if (remoteType === '部分远程') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">混合办公</Badge>
    } else if (remoteType === '不能远程') {
      return <Badge variant="outline">现场办公</Badge>
    }
    
    // Legacy support for longer strings
    if (remoteType.includes('远程')) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">远程工作</Badge>
    } else if (remoteType.includes('部分远程')) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">混合办公</Badge>
    } else if (remoteType.includes('不能远程')) {
      return <Badge variant="outline">现场办公</Badge>
    }
    
    // Fallback to display original value
    return <Badge variant="outline">{remoteType}</Badge>
  }
  
  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
  
  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          onClick={() => onViewDetails?.(job)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold mb-1 overflow-hidden" 
                       style={{
                         display: '-webkit-box',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical',
                         lineHeight: '1.3em',
                         maxHeight: '2.6em'
                       }}>
              {job.title}
            </CardTitle>
            <div className="flex items-center text-muted-foreground text-sm gap-1">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{job.company_name}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {getRemoteWorkBadge(job.remote_work_type)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Location and Department */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {job.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}
            {job.department && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{job.department}</span>
              </div>
            )}
          </div>
          
          {/* Industry and Job Level */}
          <div className="flex flex-wrap gap-2">
            {job.industry && (
              <Badge variant="outline" className="text-xs">
                <Briefcase className="h-3 w-3 mr-1" />
                {job.industry}
              </Badge>
            )}
            {job.job_level && (
              <Badge variant="outline" className="text-xs">
                {job.job_level}
              </Badge>
            )}
          </div>
          
          {/* Salary and Work Schedule */}
          <div className="flex flex-wrap gap-3 text-sm">
            {job.salary_range && (
              <div className="flex items-center gap-1 text-green-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">{job.salary_range}</span>
              </div>
            )}
            {job.work_days_per_week && (
              <div className="flex items-center gap-1 text-blue-600">
                <Clock className="h-4 w-4" />
                <span>{job.work_days_per_week}</span>
              </div>
            )}
          </div>
          
          {/* Job Description */}
          <CardDescription className="text-sm leading-relaxed">
            {isExpanded ? job.description : truncateDescription(job.description)}
            {job.description.length > 150 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
              >
                {isExpanded ? '收起' : '展开'}
              </button>
            )}
          </CardDescription>
          
          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              发布于 {formatDate(job.created_at)}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle save job functionality
                }}
              >
                收藏
              </Button>
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails?.(job)
                }}
              >
                查看详情
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}