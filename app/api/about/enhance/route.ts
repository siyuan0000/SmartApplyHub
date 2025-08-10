import { NextRequest, NextResponse } from 'next/server'
import { ContentEnhancerService } from '@/lib/ai/content-enhancer'
import { ResumeContent } from '@/lib/resume/parser'

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resumeData, section, content }: { 
      resumeData: ResumeContent, 
      section: string, 
      content: string 
    } = body
    
    if (!resumeData || !section || !content) {
      return NextResponse.json(
        { error: 'Resume data, section, and content are required' },
        { 
          status: 400,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
        }
      )
    }
    
    // Enhance the about content
    const result = await ContentEnhancerService.enhanceSection(section, content)
    
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
    console.error('Content enhancement API error:', error)
    
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