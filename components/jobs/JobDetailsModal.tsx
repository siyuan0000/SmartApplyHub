'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Briefcase,
  Calendar,
  User,
  Mail,
  Heart
} from 'lucide-react'

interface JobDetails {
  id: string
  title: string
  company_name: string
  location: string
  description: string
  requirements?: string
  salary_range?: string
  job_type?: string
  industry?: string
  remote_work_type?: string
  work_days_per_week?: string
  department?: string
  job_level?: string
  contact_method?: string
  special_preferences?: string
  submitter_name?: string
  recruiter_type?: string
  service_types?: string[]
  submission_date?: string
  created_at: string
  updated_at: string
}

interface JobDetailsModalProps {
  jobId: string | null
  isOpen: boolean
  onClose: () => void
}

export function JobDetailsModal({ jobId, isOpen, onClose }: JobDetailsModalProps) {
  const [job, setJob] = useState<JobDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (jobId && isOpen) {
      loadJobDetails(jobId)
    }
  }, [jobId, isOpen])
  
  const loadJobDetails = async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/jobs/${id}`)
      if (response.ok) {
        const data = await response.json()
        setJob(data.job)
      } else {
        setError('职位信息加载失败')
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
      console.error('Failed to load job details:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getRemoteWorkBadge = (remoteType?: string) => {
    if (!remoteType) return null
    
    // Handle exact database values
    if (remoteType === '远程') {
      return <Badge className="bg-green-100 text-green-800">远程工作</Badge>
    } else if (remoteType === '部分远程') {
      return <Badge className="bg-blue-100 text-blue-800">混合办公</Badge>
    } else if (remoteType === '不能远程') {
      return <Badge variant="outline">现场办公</Badge>
    }
    
    // Legacy support for longer strings
    if (remoteType.includes('远程')) {
      return <Badge className="bg-green-100 text-green-800">远程工作</Badge>
    } else if (remoteType.includes('部分远程')) {
      return <Badge className="bg-blue-100 text-blue-800">混合办公</Badge>
    } else if (remoteType.includes('不能远程')) {
      return <Badge variant="outline">现场办公</Badge>
    }
    
    // Fallback to display original value
    return <Badge variant="outline">{remoteType}</Badge>
  }
  
  const extractEmailFromDescription = (description: string) => {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
    const matches = description.match(emailRegex)
    return matches ? matches[0] : null
  }
  
  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] lg:w-[90vw] lg:max-w-[1400px] max-h-[90vh] overflow-y-auto p-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30 scroll-smooth" showCloseButton={true}>
        
        {isLoading && (
          <div className="flex flex-col justify-center items-center py-12 px-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 animate-spin [animation-direction:reverse] [animation-duration:0.8s]"></div>
            </div>
            <p className="mt-4 text-muted-foreground font-medium">正在加载职位详情...</p>
            <p className="text-sm text-muted-foreground/70 mt-1">请稍候</p>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col justify-center items-center py-12 px-6 text-center">
            <div className="bg-red-50 dark:bg-red-950/20 rounded-full p-3 mb-4">
              <div className="w-8 h-8 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">加载失败</h3>
            <p className="text-red-600 mb-4 max-w-md">{error}</p>
            <Button 
              onClick={() => jobId && loadJobDetails(jobId)} 
              className="bg-blue-600 hover:bg-blue-700 shadow-md"
              size="lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新加载
            </Button>
          </div>
        )}
        
        {job && (
          <div className="flex flex-col h-full">
            {/* Sticky Header */}
            <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-6 pt-6 pb-4 border-b border-border shadow-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-3xl font-bold leading-tight mb-3 text-foreground">
                      {job.title}
                    </DialogTitle>
                    <div className="flex items-center gap-3 text-xl text-muted-foreground mb-2">
                      <Building className="h-6 w-6" />
                      <span className="font-medium">{job.company_name}</span>
                    </div>
                    {/* Work type badge prominently displayed */}
                    <div className="mt-2">
                      {getRemoteWorkBadge(job.remote_work_type)}
                    </div>
                  </div>
                  {/* Action buttons with improved styling */}
                  <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                    <Button variant="outline" size="lg" className="shadow-sm">
                      <Heart className="h-4 w-4 mr-2" />
                      收藏职位
                    </Button>
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                      立即申请
                    </Button>
                  </div>
                </div>
                
                {/* Essential Info Summary */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  {job.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">{job.location}</span>
                    </div>
                  )}
                  
                  {job.salary_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">{job.salary_range}</span>
                    </div>
                  )}
                  
                  {/* Additional badges */}
                  {job.industry && (
                    <Badge variant="outline" className="font-medium">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {job.industry}
                    </Badge>
                  )}
                  {job.job_level && <Badge variant="outline" className="font-medium">{job.job_level}</Badge>}
                </div>
              </div>
            </DialogHeader>
            
            {/* Multi-column layout for wide screens */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              {/* Main content area (left column on desktop) */}
              <div className="flex-1 lg:w-[60%] lg:overflow-y-auto px-6 py-4 space-y-6 lg:[&::-webkit-scrollbar]:w-2 lg:[&::-webkit-scrollbar-track]:bg-transparent lg:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30 lg:scroll-smooth">
                  {/* Job Description */}
                  <div className="bg-muted/30 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-foreground">职位描述</h3>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                        {job.description}
                      </pre>
                    </div>
                  </div>
                  
                  {/* Requirements */}
                  {job.requirements && (
                    <div className="bg-muted/30 rounded-xl p-6">
                      <h3 className="text-xl font-semibold mb-4 text-foreground">招聘需求</h3>
                      <div className="text-sm text-foreground/90 leading-relaxed">
                        <pre className="whitespace-pre-wrap font-sans">{job.requirements}</pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Special Preferences - Redesigned */}
                  {job.special_preferences && job.special_preferences !== '无' && (
                    <div className="border border-border/50 rounded-xl p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">特殊偏好</h4>
                          <p className="text-sm text-foreground/80 line-clamp-2">{job.special_preferences}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar (right column on desktop) */}
                <div className="lg:w-[40%] lg:border-l border-border/50 lg:overflow-y-auto lg:min-h-0 lg:scroll-smooth lg:[&::-webkit-scrollbar]:w-2 lg:[&::-webkit-scrollbar-track]:bg-transparent lg:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30">
                  <div className="p-6 space-y-6">
                    {/* Key Metrics Dashboard */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl p-5 border border-green-200/50 dark:border-green-800/30">
                      <h3 className="text-lg font-semibold mb-4 text-foreground">关键信息</h3>
                      <div className="space-y-3">
                        {job.salary_range && (
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-black/20">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">薪资范围</p>
                              <p className="text-sm font-medium text-green-600">{job.salary_range}</p>
                            </div>
                          </div>
                        )}
                        
                        {job.location && (
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-black/20">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">工作地点</p>
                              <p className="text-sm font-medium">{job.location}</p>
                            </div>
                          </div>
                        )}
                        
                        {job.work_days_per_week && (
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-black/20">
                            <Clock className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">工作时间</p>
                              <p className="text-sm font-medium">{job.work_days_per_week}</p>
                            </div>
                          </div>
                        )}
                        
                        {job.department && (
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-black/20">
                            <Users className="h-5 w-5 text-orange-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">部门</p>
                              <p className="text-sm font-medium">{job.department}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-muted/30 rounded-xl p-5">
                      <h3 className="text-lg font-semibold mb-4">联系方式</h3>
                      <div className="space-y-3">
                        {job.submitter_name && (
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">联系人</p>
                              <p className="text-sm font-medium">{job.submitter_name}</p>
                            </div>
                          </div>
                        )}
                        
                        {job.recruiter_type && (
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">招聘方</p>
                              <p className="text-sm font-medium">{job.recruiter_type}</p>
                            </div>
                          </div>
                        )}
                        
                        {job.contact_method && (
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">联系方式</p>
                              <p className="text-sm font-medium">{job.contact_method}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Extract email from description */}
                        {(() => {
                          const email = extractEmailFromDescription(job.description)
                          return email ? (
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-xs text-muted-foreground">邮箱地址</p>
                                <a href={`mailto:${email}`} className="text-sm font-medium text-blue-600 hover:underline">
                                  {email}
                                </a>
                              </div>
                            </div>
                          ) : null
                        })()}
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="bg-muted/30 rounded-xl p-5">
                      <h3 className="text-lg font-semibold mb-4">发布信息</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-2 rounded-lg">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">发布时间</p>
                            <p className="text-sm font-medium">{formatDate(job.created_at)}</p>
                          </div>
                        </div>
                        
                        {job.submission_date && (
                          <div className="flex items-center gap-3 p-2 rounded-lg">
                            <Calendar className="h-4 w-4 text-red-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">投递截止</p>
                              <p className="text-sm font-medium text-red-600">{formatDate(job.submission_date)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {job.service_types && job.service_types.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-sm font-medium mb-2 text-muted-foreground">服务类型</p>
                          <div className="flex flex-wrap gap-1">
                            {job.service_types.map((service, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  )
}