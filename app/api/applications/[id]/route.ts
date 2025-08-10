import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient, createAuthenticatedResponse } from '@/lib/supabase/api'

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
    // Create response object to handle cookies properly

    const response = NextResponse.next()

    

    const user = await getAuthenticatedUser(request, response)
    const supabase = createApiClient(request, response)

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

    return createAuthenticatedResponse({ application }, response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}