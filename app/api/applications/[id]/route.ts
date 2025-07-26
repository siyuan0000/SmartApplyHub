import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient } from '@/lib/supabase/api'

// GET /api/applications/[id] - Get single application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request)
    const supabase = await createApiClient(request)

    // Get application with job posting details
    const { data: application, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job_postings (
          id,
          title,
          company_name,
          location,
          description,
          requirements,
          salary_range,
          job_type,
          source_url,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch application' },
        { status: 500 }
      )
    }

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
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