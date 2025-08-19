import { NextRequest, NextResponse } from 'next/server'
import { ContentEnhancerService } from '@/lib/ai/content-enhancer'
import { ResumeContent } from '@/lib/resume/parser'

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 [About Enhancement API Debug] Starting enhance request...')
    
    const body = await req.json()
    const { resumeData, section, content }: { 
      resumeData: ResumeContent, 
      section: string, 
      content: string 
    } = body
    
    console.log('🔧 [About Enhancement API Debug] Request data:', {
      section,
      hasResumeData: !!resumeData,
      contentLength: content?.length || 0,
      hasContent: !!content
    })
    
    if (!resumeData || !section || !content) {
      console.log('🔧 [About Enhancement API Debug] Missing required data')
      return NextResponse.json(
        { error: 'Resume data, section, and content are required' },
        { 
          status: 400,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
        }
      )
    }
    
    console.log('🔧 [About Enhancement API Debug] Calling ContentEnhancerService...')
    
    // Enhance the about content
    const result = await ContentEnhancerService.enhanceSection(section, content)
    
    console.log('🔧 [About Enhancement API Debug] Enhancement completed:', {
      hasEnhancedText: !!result.enhancedText,
      enhancedTextLength: result.enhancedText?.length || 0,
      suggestionsCount: result.suggestions?.length || 0,
      changesCount: result.changes?.length || 0
    })
    
    // Map the response to match AboutGenerationResult interface
    const aboutResult = {
      aboutText: result.enhancedText,
      wordCount: result.enhancedText.split(/\s+/).length,
      generatedAt: new Date(),
      provider: 'content-enhancer'
    }
    
    return NextResponse.json(aboutResult, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('🔧 [About Enhancement API Debug] Enhancement failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorStack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to enhance content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
      }
    )
  }
} 