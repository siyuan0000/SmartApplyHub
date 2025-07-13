import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/ai/openai'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { resumeId } = await request.json()

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 })
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

    // Analyze resume with OpenAI
    const analysis = await OpenAIService.analyzeResume(resume.content)

    // Save analysis to database
    const { error: saveError } = await supabaseAdmin
      .from('ai_reviews')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        review_type: 'optimization',
        feedback: analysis,
        score: analysis.score
      })

    if (saveError) {
      console.error('Failed to save AI analysis:', saveError)
      // Don't fail the request if we can't save to DB
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('AI analysis failed:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}