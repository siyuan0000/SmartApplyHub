import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient } from '@/lib/supabase/api'
import { JobRecommendationService } from '@/lib/services/jobRecommendationService'
import { RecommendationPreferencesService } from '@/lib/services/recommendationPreferencesService'

/**
 * GET - Fetch recommended jobs for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.next()
    const user = await getAuthenticatedUser(request, response)
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam), 20) : 6 // Max 20, default 6

    const supabase = createApiClient(request, response)

    // 1. Get user preferences
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select(`
        job_titles,
        preferred_location,
        salary_min,
        salary_max,
        job_type,
        experience_level,
        skills,
        industries
      `)
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user profile:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // 2. Get user's recommendation preferences
    const recommendationPrefs = await RecommendationPreferencesService.getPreferences(user.id)

    // 3. Get applied job IDs
    const { data: applications, error: applicationsError } = await supabase
      .from('job_applications')
      .select('job_posting_id')
      .eq('user_id', user.id)
      .not('job_posting_id', 'is', null)

    if (applicationsError) {
      console.error('Error fetching applied jobs:', applicationsError)
      return NextResponse.json(
        { error: 'Failed to fetch applied jobs' },
        { status: 500 }
      )
    }

    const appliedJobIds = applications
      ?.map(app => app.job_posting_id)
      .filter((id): id is string => id !== null) || []

    // 4. Build job query based on preferences
    let jobQuery = supabase
      .from('job_postings')
      .select(`
        id,
        title,
        company_name,
        location,
        description,
        requirements,
        salary_range,
        job_type,
        industry,
        remote_work_type,
        work_days_per_week,
        department,
        job_level,
        created_at
      `)

    // Apply recency filter
    if (recommendationPrefs?.recency_filter) {
      const daysBack = getMaxDaysFromFilter(recommendationPrefs.recency_filter)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      
      jobQuery = jobQuery.gte('created_at', cutoffDate.toISOString())
    }

    // Apply excluded companies filter
    if (recommendationPrefs?.excluded_companies && recommendationPrefs.excluded_companies.length > 0) {
      jobQuery = jobQuery.not('company_name', 'in', `(${recommendationPrefs.excluded_companies.join(',')})`)
    }

    // Apply excluded industries filter
    if (recommendationPrefs?.excluded_industries && recommendationPrefs.excluded_industries.length > 0) {
      jobQuery = jobQuery.not('industry', 'in', `(${recommendationPrefs.excluded_industries.join(',')})`)
    }

    // Get more jobs than needed for better matching
    jobQuery = jobQuery.limit(limit * 10).order('created_at', { ascending: false })

    const { data: jobs, error: jobsError } = await jobQuery

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        total: 0,
        message: 'No jobs found matching your criteria'
      })
    }

    // 5. Calculate job matches using the recommendation service
    const matches = JobRecommendationService.calculateJobMatches(
      {
        job_titles: userProfile.job_titles || [],
        preferred_location: userProfile.preferred_location || undefined,
        salary_min: userProfile.salary_min || undefined,
        salary_max: userProfile.salary_max || undefined,
        job_type: userProfile.job_type || [],
        experience_level: userProfile.experience_level || undefined,
        skills: userProfile.skills || [],
        industries: userProfile.industries || []
      },
      recommendationPrefs,
      jobs.map(job => ({
        ...job,
        requirements: job.requirements || undefined,
        salary_range: job.salary_range || undefined,
        job_type: job.job_type || undefined,
        industry: job.industry || undefined,
        remote_work_type: job.remote_work_type || undefined,
        work_days_per_week: job.work_days_per_week || undefined,
        department: job.department || undefined,
        job_level: job.job_level || undefined
      })),
      appliedJobIds
    )

    // 6. Get top matches and add match reason labels
    const topMatches = matches.slice(0, limit).map(match => ({
      ...match.job,
      match_reasons: match.matchReasons.map(reason => 
        JobRecommendationService.getMatchReasonLabel(reason)
      ),
      // Don't expose internal score
      // sort_score: match.sortScore (removed for user privacy)
    }))

    return NextResponse.json({
      success: true,
      recommendations: topMatches,
      total: topMatches.length,
      applied_jobs_count: appliedJobIds.length,
      filters_applied: {
        recency_filter: recommendationPrefs?.recency_filter || '1week',
        excluded_companies_count: recommendationPrefs?.excluded_companies?.length || 0,
        excluded_industries_count: recommendationPrefs?.excluded_industries?.length || 0,
        location_flexible: recommendationPrefs?.location_flexible !== false
      }
    })

  } catch (error) {
    console.error('Error fetching job recommendations:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch job recommendations' },
      { status: 500 }
    )
  }
}

// Helper function to convert recency filter to days
function getMaxDaysFromFilter(filter: string): number {
  switch (filter) {
    case '1day': return 1
    case '3days': return 3
    case '1week': return 7
    case '2weeks': return 14
    case '1month': return 30
    default: return 7
  }
}