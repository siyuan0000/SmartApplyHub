import { createServerComponentClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerComponentClient()
    const resolvedParams = await params
    
    const { data: job, error } = await supabase
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
        contact_method,
        special_preferences,
        submitter_name,
        recruiter_type,
        service_types,
        submission_date,
        created_at,
        updated_at
      `)
      .eq('id', resolvedParams.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch job' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ job })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}