import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/ai/openai'
import { getAuthenticatedUser, createApiClient, createAuthenticatedResponse } from '@/lib/supabase/api'

export async function POST(request: NextRequest) {
  try {
    // Create response object to handle cookies properly
    const response = NextResponse.next()
    
    const { resumeId, jobDescription } = await request.json()

    if (!resumeId || !jobDescription) {
      return NextResponse.json({ error: 'Resume ID and job description are required' }, { status: 400 })
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

    // Get keyword suggestions
    const keywords = await OpenAIService.generateKeywordSuggestions(resume.content, jobDescription)

    return createAuthenticatedResponse({ keywords }, response)
  } catch (error) {
    console.error('Keyword suggestions failed:', error)
    return NextResponse.json(
      { error: 'Keyword suggestions failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}