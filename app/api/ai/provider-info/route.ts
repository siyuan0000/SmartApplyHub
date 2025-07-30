import { NextResponse } from 'next/server'
import { AIService } from '@/lib/ai/ai-service'

// GET /api/ai/provider-info - Get current AI provider information  
export async function GET() {
  try {
    const providerInfo = AIService.getProviderInfo()
    
    return NextResponse.json({
      provider: providerInfo.provider,
      model: providerInfo.model,
      status: 'active',
      message: `Using ${providerInfo.provider} with model ${providerInfo.model}`
    })
  } catch (error) {
    console.error('Failed to get AI provider info:', error)
    return NextResponse.json(
      { 
        provider: 'unknown',
        model: 'unknown',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'No AI provider configured'
      },
      { status: 500 }
    )
  }
}