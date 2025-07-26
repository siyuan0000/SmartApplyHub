import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient } from '@/lib/supabase/api'

// GET /api/resumes - Fetch user's resumes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get search parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Authenticate user
    const user = await getAuthenticatedUser(request)
    const supabase = await createApiClient(request)
    
    // Build the query
    let queryBuilder = supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
    
    // Include all resumes by default, or apply filtering if specifically requested
    // Since we want to show resumes in the selection step, don't filter by default
    // The includeInactive=false would be used when we only want active resumes
    
    // Apply pagination and ordering
    const offset = (page - 1) * limit
    queryBuilder = queryBuilder
      .range(offset, offset + limit - 1)
      .order('updated_at', { ascending: false })
    
    const { data: resumes, error } = await queryBuilder
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch resumes' },
        { status: 500 }
      )
    }
    
    // Get total count for pagination
    const countQueryBuilder = supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    const { count: totalCount } = await countQueryBuilder
    
    return NextResponse.json({
      resumes: resumes || [],
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

// POST /api/resumes - Create new resume (if needed for future features)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      content, 
      file_url,
      language = 'auto',
      job_roles = [],
      industries = [],
      target_roles = []
    } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request)
    const supabase = await createApiClient(request)

    // Create resume
    const resumeData = {
      user_id: user.id,
      title,
      content,
      file_url: file_url || null,
      language,
      job_roles,
      industries,
      target_roles,
      is_active: false, // New resumes start as inactive
      version: 1
    }

    const { data: resume, error } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create resume' },
        { status: 500 }
      )
    }

    return NextResponse.json({ resume }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}