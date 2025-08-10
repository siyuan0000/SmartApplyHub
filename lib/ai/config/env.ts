/**
 * Environment configuration for AI providers
 * This file ensures environment variables are properly loaded and validated
 */

export interface AIEnvironmentConfig {
  openai: {
    apiKey: string
    model: string
    baseURL?: string
  }
  deepseek: {
    apiKey: string
    model: string
    baseURL: string
  }
  local: {
    baseURL: string
    model: string
  }
  qwen: {
    baseURL: string
    model: string
  }
}

/**
 * Load and validate AI provider environment variables
 */
export function loadAIEnvironmentConfig(): AIEnvironmentConfig {
  // Load environment variables
  const config: AIEnvironmentConfig = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      baseURL: process.env.OPENAI_BASE_URL
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    },
    local: {
      baseURL: process.env.LOCAL_AI_URL || '',
      model: process.env.LOCAL_AI_MODEL || 'qwen2.5:7b'
    },
    qwen: {
      baseURL: process.env.QWEN_API_URL || '',
      model: process.env.QWEN_MODEL || 'qwen2.5:14b'
    }
  }

  // Validate configuration
  const validationErrors: string[] = []
  
  if (!config.openai.apiKey) {
    validationErrors.push('OPENAI_API_KEY not set')
  }
  
  if (!config.deepseek.apiKey) {
    validationErrors.push('DEEPSEEK_API_KEY not set')
  }
  
  if (!config.local.baseURL) {
    validationErrors.push('LOCAL_AI_URL not set')
  }
  
  if (!config.qwen.baseURL) {
    validationErrors.push('QWEN_API_URL not set')
  }

  // Log configuration status
  console.log('[AI Config] Environment variables loaded:')
  console.log(`  OpenAI: ${config.openai.apiKey ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`  DeepSeek: ${config.deepseek.apiKey ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`  Local AI: ${config.local.baseURL ? '✅ Configured' : '❌ Not configured'}`)
  console.log(`  Qwen: ${config.qwen.baseURL ? '✅ Configured' : '❌ Not configured'}`)
  
  if (validationErrors.length > 0) {
    console.warn('[AI Config] Configuration warnings:', validationErrors.join(', '))
    console.warn('[AI Config] The system will use local fallback generation when AI providers are unavailable')
  }

  return config
}

/**
 * Check if any AI providers are available
 */
export function hasAvailableAIProviders(): boolean {
  const config = loadAIEnvironmentConfig()
  return !!(config.openai.apiKey || config.deepseek.apiKey || config.local.baseURL || config.qwen.baseURL)
}

/**
 * Get a summary of available providers
 */
export function getAvailableProvidersSummary(): string[] {
  const config = loadAIEnvironmentConfig()
  const available: string[] = []
  
  if (config.openai.apiKey) available.push('OpenAI')
  if (config.deepseek.apiKey) available.push('DeepSeek')
  if (config.local.baseURL) available.push('Local AI')
  if (config.qwen.baseURL) available.push('Qwen')
  
  return available
} 