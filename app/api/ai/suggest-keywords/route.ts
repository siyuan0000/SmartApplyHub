import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/ai/openai'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { resumeId, jobDescription } = await request.json()

    if (!resumeId || !jobDescription) {
      return NextResponse.json({ error: 'Resume ID and job description are required' }, { status: 400 })
    }

    // Get user from session
    const cookieStore = await cookies()
    const supabaseAdmin = supabase

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      cookieStore.get('sb-access-token')?.value
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get resume data
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Get keyword suggestions
    const keywords = await OpenAIService.generateKeywordSuggestions(resume.content, jobDescription)

    return NextResponse.json({ keywords })
  } catch (error) {
    console.error('Keyword suggestions failed:', error)
    return NextResponse.json(
      { error: 'Keyword suggestions failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}