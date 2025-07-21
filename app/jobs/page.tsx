'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { JobCard } from '@/components/jobs/JobCard'
import { JobSearchFilters } from '@/components/jobs/JobSearchFilters'
import { JobDetailsModal } from '@/components/jobs/JobDetailsModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

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

interface SearchFilters {
  query: string
  location: string
  industry: string
  remote: string
  jobType: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    industry: '',
    remote: '',
    jobType: ''
  })
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Load jobs on component mount and when filters change
  useEffect(() => {
    loadJobs(currentFilters, 1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadJobs = async (filters: SearchFilters, page: number = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.query && { q: filters.query }),
        ...(filters.location && { location: filters.location }),
        ...(filters.industry && { industry: filters.industry }),
        ...(filters.remote && { remote: filters.remote }),
        ...(filters.jobType && { jobType: filters.jobType })
      })

      const response = await fetch(`/api/jobs?${searchParams}`)
      
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs)
        setPagination(data.pagination)
        setCurrentPage(page)
      } else {
        setError('Failed to load jobs')
      }
    } catch (error) {
      setError('Network error occurred')
      console.error('Failed to load jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (filters: SearchFilters) => {
    setCurrentFilters(filters)
    loadJobs(filters, 1)
  }

  const handlePageChange = (page: number) => {
    loadJobs(currentFilters, page)
  }

  const handleJobClick = (job: Job) => {
    setSelectedJobId(job.id)
    setIsModalOpen(true)
  }

  const hasActiveFilters = Object.values(currentFilters).some(value => value !== '')

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">职位搜索</h1>
            <p className="text-muted-foreground">
              {hasActiveFilters 
                ? `找到 ${pagination.total.toLocaleString()} 个匹配的职位`
                : `发现您的下一个职业机会 - 已有 ${pagination.total.toLocaleString()} 个职位等您申请`
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search Filters Sidebar */}
          <div className="lg:col-span-1">
            <JobSearchFilters onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {/* Job Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {hasActiveFilters ? '筛选结果' : '全部职位'}
                </h2>
                <Badge variant={hasActiveFilters ? "default" : "secondary"}>
                  {pagination.total.toLocaleString()} 个职位
                </Badge>
              </div>
              
              {pagination.pages > 1 && (
                <div className="text-sm text-muted-foreground">
                  第 {pagination.page} 页，共 {pagination.pages} 页
                </div>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-muted-foreground">搜索职位中...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => loadJobs(currentFilters, currentPage)}>
                    重试
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!isLoading && !error && jobs.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {hasActiveFilters ? '没有找到匹配的职位' : '开始搜索职位'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters 
                      ? '尝试调整搜索条件或清除筛选条件以查看更多结果' 
                      : '使用左侧的搜索工具来查找您感兴趣的职位'
                    }
                  </p>
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleSearch({
                        query: '',
                        location: '',
                        industry: '',
                        remote: '',
                        jobType: ''
                      })}
                    >
                      查看所有职位
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Job Results Grid */}
            {!isLoading && !error && jobs.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onViewDetails={handleJobClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Job Details Modal */}
        <JobDetailsModal
          jobId={selectedJobId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedJobId(null)
          }}
        />
      </div>
    </AppLayout>
  )
}