import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient } from '@/lib/supabase/api'
import { Database } from '@/types/database.types'

type ResumeUpdate = Database['public']['Tables']['resumes']['Update']

// GET /api/resumes/[id] - Get single resume
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request)
    const supabase = await createApiClient(request)

    // Get resume
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch resume' },
        { status: 500 }
      )
    }

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ resume })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/resumes/[id] - Update resume
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request)
    const supabase = await createApiClient(request)

    // Build update data - only include fields that are provided
    const updateData: ResumeUpdate = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) updateData.content = body.content
    if (body.file_url !== undefined) updateData.file_url = body.file_url
    if (body.language !== undefined) updateData.language = body.language
    if (body.job_roles !== undefined) updateData.job_roles = body.job_roles
    if (body.industries !== undefined) updateData.industries = body.industries
    if (body.target_roles !== undefined) updateData.target_roles = body.target_roles
    if (body.applied_to !== undefined) updateData.applied_to = body.applied_to
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    // Update resume (with RLS ensuring user can only update their own)
    const { data: resume, error } = await supabase
      .from('resumes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update resume' },
        { status: 500 }
      )
    }

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ resume })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}