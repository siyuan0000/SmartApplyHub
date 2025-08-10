import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/ai/openai'
import { getAuthenticatedUser, createApiClient, createAuthenticatedResponse } from '@/lib/supabase/api'

export async function POST(request: NextRequest) {
  try {
    // Create response object to handle cookies properly
    const response = NextResponse.next()
    
    const { resumeId } = await request.json()

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 })
    }

    // Authenticate user
    const user = await getAuthenticatedUser(request, response)
    const supabase = createApiClient(request, response)

    // Get resume data
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return createAuthenticatedResponse({ error: 'Resume not found' }, response, { status: 404 })
    }

    // Analyze resume with OpenAI
    const analysis = await OpenAIService.analyzeResume(resume.content)

    // Save analysis to database
    const { error: saveError } = await supabase
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

    return createAuthenticatedResponse({ analysis }, response)
  } catch (error) {
    console.error('AI analysis failed:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}