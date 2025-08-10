import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/ai/openai'
import { getAuthenticatedUser, createAuthenticatedResponse } from '@/lib/supabase/api'

export async function POST(request: NextRequest) {
  try {
    // Create response object to handle cookies properly
    const response = NextResponse.next()
    
    const { sectionType, content, jobDescription } = await request.json()

    if (!sectionType || !content) {
      return NextResponse.json({ error: 'Section type and content are required' }, { status: 400 })
    }

    // Authenticate user
    try {
      await getAuthenticatedUser(request, response)
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Enhance section content with OpenAI
    const enhancement = await OpenAIService.enhanceSection(sectionType, content, jobDescription)

    return createAuthenticatedResponse({ enhancement }, response)
  } catch (error) {
    console.error('Content enhancement failed:', error)
    return NextResponse.json(
      { error: 'Content enhancement failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}