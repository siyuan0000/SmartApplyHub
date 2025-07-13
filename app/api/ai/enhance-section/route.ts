import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/ai/openai'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { sectionType, content, jobDescription } = await request.json()

    if (!sectionType || !content) {
      return NextResponse.json({ error: 'Section type and content are required' }, { status: 400 })
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

    // Enhance section content with OpenAI
    const enhancement = await OpenAIService.enhanceSection(sectionType, content, jobDescription)

    return NextResponse.json({ enhancement })
  } catch (error) {
    console.error('Content enhancement failed:', error)
    return NextResponse.json(
      { error: 'Content enhancement failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}