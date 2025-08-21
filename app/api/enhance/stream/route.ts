import { NextRequest } from 'next/server'
import { aiRouter } from '@/lib/ai/route2all'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 [Stream Enhancement API Debug] Starting stream enhance request...')
    
    const body = await req.json()
    const { sectionType, originalContent, customPrompt, jobDescription, hrInsights, systemPrompt: customSystemPrompt, userPrompt: customUserPrompt } = body
    
    console.log('🔧 [Stream Enhancement API Debug] Request data:', {
      sectionType,
      hasOriginalContent: !!originalContent,
      hasCustomPrompt: !!customPrompt,
      hasJobDescription: !!jobDescription,
      hasHrInsights: !!hrInsights,
      hasCustomSystemPrompt: !!customSystemPrompt,
      hasCustomUserPrompt: !!customUserPrompt
    })
    
    if (!sectionType) {
      console.log('🔧 [Stream Enhancement API Debug] Missing sectionType')
      return new Response('Section type is required', { status: 400 })
    }
    
    // Use custom prompts if provided, otherwise create default prompts
    const systemPrompt = customSystemPrompt || createSystemPrompt(sectionType, hrInsights)
    const userPrompt = customUserPrompt || createUserPrompt({
      sectionType,
      originalContent: originalContent || '',
      customPrompt,
      jobDescription,
      hrInsights
    })
    
    console.log('🔧 [Stream Enhancement API Debug] Prompts created successfully')
    console.log('🔧 [Stream Enhancement API Debug] Router status:', {
      availableProviders: aiRouter.getAvailableProviders(),
      providerStatus: aiRouter.getProviderStatus()
    })
    
    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamGenerator = aiRouter.routeStream([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ], {
            task: 'enhancement',
            temperature: 0.5,
            maxTokens: 1000
          })
          
          console.log('🔧 [Stream Enhancement API Debug] Stream generator created, starting stream...')
          
          let chunkCount = 0
          for await (const chunk of streamGenerator) {
            chunkCount++
            controller.enqueue(new TextEncoder().encode(chunk.content))
            
            if (chunkCount === 1) {
              console.log('🔧 [Stream Enhancement API Debug] First chunk sent successfully')
            }
          }
          
          console.log(`🔧 [Stream Enhancement API Debug] Stream completed with ${chunkCount} chunks`)
          controller.close()
        } catch (error) {
          console.error('🔧 [Stream Enhancement API Debug] Stream failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorStack: error instanceof Error ? error.stack : undefined,
            routerStatus: aiRouter.getProviderStatus(),
            availableProviders: aiRouter.getAvailableProviders()
          })
          
          controller.error(error)
        }
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('🔧 [Stream Enhancement API Debug] Request failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorStack: error instanceof Error ? error.stack : undefined
    })
    
    return new Response(
      error instanceof Error ? error.message : 'Enhancement failed',
      { status: 500 }
    )
  }
}

// Helper functions (copied from the hook)
function createSystemPrompt(sectionType: string, hrInsights?: string[]): string {
  const insights = hrInsights || getDefaultHRInsights(sectionType)
  const insightText = insights.length > 0 ? insights.join('\n• ') : ''
  
  return `You are an expert resume writer and career consultant. Help enhance a ${sectionType} section.

Key guidelines:
• Use action verbs and quantifiable achievements
• Optimize for ATS (Applicant Tracking Systems)
• Keep content truthful and professional
• Tailor language to the job market

${insightText ? `HR Insights:\n• ${insightText}` : ''}

Always provide practical, implementable suggestions that improve the candidate's marketability.`
}

function createUserPrompt(context: any): string {
  const { sectionType, originalContent, customPrompt, jobDescription } = context
  
  let prompt = `Please enhance this ${sectionType} section:`
  
  if (customPrompt) {
    prompt += `\n\nSpecific Request: ${customPrompt}`
  }
  
  if (jobDescription) {
    prompt += `\n\nTarget Job Description:\n${jobDescription}`
  }
  
  if (!originalContent || !originalContent.trim()) {
    prompt += `\n\nCurrent Content: [Empty - please create content from scratch]
    
Please provide:
1. Professional content appropriate for this section
2. Industry-standard formatting and language
3. Realistic but compelling information (use placeholder data where needed)
4. Content optimized for ATS (Applicant Tracking Systems)

Note: Since starting from scratch, create professional placeholder content that the user can customize with their specific details.`
  } else {
    prompt += `\n\nCurrent Content: ${originalContent}
    
Please provide:
1. Enhanced version of the content
2. Key improvements made
3. Additional suggestions for optimization

Focus on making this section stand out while remaining truthful and professional.`
  }
  
  prompt += `\n\n###
Output *exactly* in this format – no markdown fences:

=== ANALYSIS ===
<bullet-point analysis of current content (or of empty state)>

=== ENHANCED_CONTENT ===
<fully improved ${sectionType} section, ready to paste verbatim>
###`
  
  return prompt
}

function getDefaultHRInsights(sectionType: string): string[] {
  const insightMap: Record<string, string[]> = {
    summary: [
      'Use 2-3 sentences that highlight your unique value proposition',
      'Include years of experience and key technical skills',
      'End with your career goal or what you bring to employers'
    ],
    experience: [
      'Start each bullet with strong action verbs (Led, Developed, Implemented)',
      'Include quantified results (increased by X%, managed team of Y)',
      'Focus on achievements, not just responsibilities'
    ],
    skills: [
      'Group skills by category (Technical, Leadership, Languages)',
      'List most relevant skills first',
      'Include both hard and soft skills'
    ],
    projects: [
      'Highlight projects relevant to your target role',
      'Include technologies used and your specific contributions',
      'Mention measurable outcomes or impact'
    ],
    education: [
      'Include relevant coursework for recent graduates',
      'Add GPA if 3.5 or higher',
      'Mention academic honors or leadership roles'
    ]
  }
  
  return insightMap[sectionType] || [
    'Keep content clear and professional',
    'Use keywords relevant to your industry',
    'Ensure information is current and accurate'
  ]
}