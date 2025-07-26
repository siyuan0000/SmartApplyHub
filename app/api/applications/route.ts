import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient } from '@/lib/supabase/api'
import { Database } from '@/types/database.types'

type JobApplication = Database['public']['Tables']['job_applications']['Row']
type JobApplicationInsert = Database['public']['Tables']['job_applications']['Insert']
type JobApplicationUpdate = Database['public']['Tables']['job_applications']['Update']

// GET /api/applications - Fetch user's applications with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get search parameters
    const status = searchParams.get('status') || ''
    const company = searchParams.get('company') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Authenticate user
    const user = await getAuthenticatedUser(request)
    const supabase = await createApiClient(request)
    
    // Start building the query
    let queryBuilder = supabase
      .from('job_applications')
      .select(`
        *,
        job_postings!inner (
          id,
          title,
          company_name,
          location,
          description,
          salary_range,
          job_type
        )
      `)
      .eq('user_id', user.id)
    
    // Apply status filter
    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }
    
    // Apply company filter
    if (company) {
      queryBuilder = queryBuilder.ilike('company_name', `%${company}%`)
    }
    
    // Apply pagination and ordering
    const offset = (page - 1) * limit
    queryBuilder = queryBuilder
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })
    
    const { data: applications, error } = await queryBuilder
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }
    
    // Get total count for pagination
    let countQueryBuilder = supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    if (status) {
      countQueryBuilder = countQueryBuilder.eq('status', status)
    }
    
    if (company) {
      countQueryBuilder = countQueryBuilder.ilike('company_name', `%${company}%`)
    }
    
    const { count: totalCount } = await countQueryBuilder
    
    return NextResponse.json({
      applications: applications || [],
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

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      job_posting_id, 
      company_name, 
      position_title, 
      status = 'pending', 
      notes 
    }: Partial<JobApplicationInsert> = body

    if (!company_name || !position_title) {
      return NextResponse.json(
        { error: 'Company name and position title are required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request)
    const supabase = await createApiClient(request)

    // If job_posting_id is provided, validate it exists
    if (job_posting_id) {
      const { data: jobPosting, error: jobError } = await supabase
        .from('job_postings')
        .select('id')
        .eq('id', job_posting_id)
        .single()

      if (jobError || !jobPosting) {
        return NextResponse.json(
          { error: 'Job posting not found' },
          { status: 404 }
        )
      }
    }

    // Create application
    const applicationData: JobApplicationInsert = {
      user_id: user.id,
      job_posting_id: job_posting_id || null,
      company_name,
      position_title,
      status: status as JobApplication['status'],
      notes: notes || null,
      applied_at: status === 'applied' ? new Date().toISOString() : null
    }

    const { data: application, error } = await supabase
      .from('job_applications')
      .insert(applicationData)
      .select(`
        *,
        job_postings (
          id,
          title,
          company_name,
          location,
          description,
          salary_range,
          job_type
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
    }

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/applications - Update existing application (requires id in body)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id,
      status,
      notes,
      applied_at
    }: { id: string } & Partial<JobApplicationUpdate> = body

    if (!id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request)
    const supabase = await createApiClient(request)

    // Build update data
    const updateData: JobApplicationUpdate = {}
    if (status !== undefined) {
      updateData.status = status
      // Set applied_at when status changes to 'applied'
      if (status === 'applied' && !applied_at) {
        updateData.applied_at = new Date().toISOString()
      }
    }
    if (notes !== undefined) updateData.notes = notes
    if (applied_at !== undefined) updateData.applied_at = applied_at

    // Update application (with RLS ensuring user can only update their own)
    const { data: application, error } = await supabase
      .from('job_applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        job_postings (
          id,
          title,
          company_name,
          location,
          description,
          salary_range,
          job_type
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/applications - Delete application (requires id in body)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id }: { id: string } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request)
    const supabase = await createApiClient(request)

    // Delete application (with RLS ensuring user can only delete their own)
    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}