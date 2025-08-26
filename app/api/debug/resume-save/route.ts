import { createClient } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const resumeId = searchParams.get('id')
  
  if (!resumeId) {
    return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 })
  }

  const supabase = createClient()
  
  try {
    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 Debug endpoint - User auth status:', {
      authenticated: !!user,
      userId: user?.id,
      authError: authError?.message
    })

    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication failed',
        authError: authError?.message,
        authenticated: false
      }, { status: 401 })
    }

    // Try to fetch the resume
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single()

    console.log('🔍 Debug endpoint - Resume query result:', {
      found: !!resume,
      error: error?.message,
      resumeId,
      lastUpdated: resume?.updated_at
    })

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch resume',
        supabaseError: error.message,
        resumeId
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        title: resume.title,
        updated_at: resume.updated_at,
        version: resume.version,
        content_keys: resume.content ? Object.keys(resume.content) : [],
        content_size: JSON.stringify(resume.content).length
      },
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error) {
    console.error('🚨 Debug endpoint error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeId, testContent } = body
    
    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 })
    }

    const supabase = createClient()
    
    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🧪 Debug save test - User auth:', {
      authenticated: !!user,
      userId: user?.id,
      authError: authError?.message
    })

    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication failed',
        authError: authError?.message
      }, { status: 401 })
    }

    // Try to perform a test save
    const updateData = {
      content: testContent || { test: true, timestamp: new Date().toISOString() },
      updated_at: new Date().toISOString()
    }

    console.log('🧪 Debug save test - Attempting update:', {
      resumeId,
      contentSize: JSON.stringify(updateData.content).length,
      updateData: {
        ...updateData,
        content: 'Content object with ' + Object.keys(updateData.content).length + ' keys'
      }
    })

    const { data: updatedResume, error } = await supabase
      .from('resumes')
      .update(updateData)
      .eq('id', resumeId)
      .select()
      .single()

    if (error) {
      console.error('🚨 Debug save test - Update failed:', error)
      return NextResponse.json({
        error: 'Failed to update resume',
        supabaseError: error.message,
        resumeId
      }, { status: 400 })
    }

    console.log('✅ Debug save test - Update successful:', {
      id: updatedResume.id,
      updated_at: updatedResume.updated_at,
      version: updatedResume.version
    })

    return NextResponse.json({
      success: true,
      message: 'Test save successful',
      resume: {
        id: updatedResume.id,
        updated_at: updatedResume.updated_at,
        version: updatedResume.version
      }
    })

  } catch (error) {
    console.error('🚨 Debug save test error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}