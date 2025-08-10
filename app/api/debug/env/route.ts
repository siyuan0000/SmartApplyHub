import { NextResponse } from 'next/server'

export async function GET() {
  // Check environment variables
  const envVars = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? 'SET' : 'NOT SET',
    LOCAL_AI_URL: process.env.LOCAL_AI_URL ? 'SET' : 'NOT SET',
    QWEN_API_URL: process.env.QWEN_API_URL ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  }

  // Check if any AI providers are available
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY
  const hasLocal = !!process.env.LOCAL_AI_URL
  const hasQwen = !!process.env.QWEN_API_URL

  const availableProviders = []
  if (hasOpenAI) availableProviders.push('OpenAI')
  if (hasDeepSeek) availableProviders.push('DeepSeek')
  if (hasLocal) availableProviders.push('Local AI')
  if (hasQwen) availableProviders.push('Qwen')

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    environmentVariables: envVars,
    aiProviders: {
      available: availableProviders,
      count: availableProviders.length,
      hasAny: availableProviders.length > 0
    },
    recommendations: availableProviders.length === 0 ? [
      'No AI providers configured',
      'Check your .env.local file',
      'Restart your development server',
      'Verify API keys are valid'
    ] : [
      'AI providers are configured',
      'If you still get errors, check network connectivity',
      'Verify API key validity'
    ]
  })
} 