import { NextRequest, NextResponse } from 'next/server'
import { AboutGenerator } from '@/lib/ai/about-generator'
import { ResumeContent } from '@/lib/resume/parser'

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { resumeData }: { resumeData: ResumeContent } = body
    
    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { 
          status: 400,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
        }
      )
    }
    
    // Generate fresh about content
    const result = await AboutGenerator.generateAbout(resumeData)
    
    return NextResponse.json(result, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('About generation API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate about section',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
      }
    )
  }
} 