import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get search parameters
    const query = searchParams.get('q') || ''
    const location = searchParams.get('location') || ''
    const industry = searchParams.get('industry') || ''
    const remoteWork = searchParams.get('remote') || ''
    const jobType = searchParams.get('jobType') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const supabase = supabaseAdmin
    
    // Start building the query
    let queryBuilder = supabase
      .from('job_postings')
      .select(`
        id,
        title,
        company_name,
        location,
        description,
        salary_range,
        job_type,
        industry,
        remote_work_type,
        work_days_per_week,
        department,
        job_level,
        created_at
      `)
    
    // Apply text search if query provided  
    if (query) {
      console.log('Applying text search for query:', query)
      // Try using textSearch instead of ilike
      queryBuilder = queryBuilder.textSearch('title', query, {
        type: 'plain',
        config: 'simple'
      })
    }
    
    // Apply location filter
    if (location) {
      queryBuilder = queryBuilder.ilike('location', `%${location}%`)
    }
    
    // Apply industry filter
    if (industry) {
      queryBuilder = queryBuilder.eq('industry', industry)
    }
    
    // Apply remote work filter
    if (remoteWork) {
      if (remoteWork === 'remote') {
        queryBuilder = queryBuilder.or('remote_work_type.ilike.%远程%,remote_work_type.ilike.%部分远程%')
      } else if (remoteWork === 'onsite') {
        queryBuilder = queryBuilder.eq('remote_work_type', '不能远程')
      }
    }
    
    // Apply job type filter
    if (jobType) {
      queryBuilder = queryBuilder.eq('job_type', jobType)
    }
    
    // Apply pagination
    const offset = (page - 1) * limit
    queryBuilder = queryBuilder
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })
    
    const { data: jobs, error } = await queryBuilder
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }
    
    // Build the same query for counting (without pagination)
    let countQueryBuilder = supabaseAdmin
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
    
    // Apply the same filters as the main query
    if (query) {
      countQueryBuilder = countQueryBuilder.or(`title.ilike.%${query}%,company_name.ilike.%${query}%,description.ilike.%${query}%`)
    }
    
    if (location) {
      countQueryBuilder = countQueryBuilder.ilike('location', `%${location}%`)
    }
    
    if (industry) {
      countQueryBuilder = countQueryBuilder.eq('industry', industry)
    }
    
    if (remoteWork) {
      if (remoteWork === 'remote') {
        countQueryBuilder = countQueryBuilder.or('remote_work_type.ilike.%远程%,remote_work_type.ilike.%部分远程%')
      } else if (remoteWork === 'onsite') {
        countQueryBuilder = countQueryBuilder.eq('remote_work_type', '不能远程')
      }
    }
    
    if (jobType) {
      countQueryBuilder = countQueryBuilder.eq('job_type', jobType)
    }
    
    const { count: totalCount } = await countQueryBuilder
    
    return NextResponse.json({
      jobs: jobs || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}