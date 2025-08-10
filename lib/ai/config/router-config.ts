// Configuration for the AI router system
import { AIRouterConfig, AIProviderType } from '../types'

// Default router configuration
export const defaultRouterConfig: AIRouterConfig = {
  defaultProvider: 'openai',
  fallbackProviders: ['deepseek', 'local'],
  enableFallback: true,
  logRequests: process.env.NODE_ENV === 'development',
  providers: {
    openai: {
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      maxTokens: 4000,
      retries: 3,
      timeout: 30000
    },
    deepseek: {
      name: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseURL: 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      maxTokens: 8000,
      retries: 3,
      timeout: 30000
    },
    local: {
      name: 'local',
      apiKey: 'not-required',
      baseURL: process.env.LOCAL_AI_URL || 'http://localhost:11434',
      model: process.env.LOCAL_AI_MODEL || 'qwen2.5:7b',
      maxTokens: 16000,
      retries: 2,
      timeout: 60000
    },
    qwen: {
      name: 'qwen',
      apiKey: 'not-required', 
      baseURL: process.env.QWEN_API_URL || 'http://localhost:11434',
      model: process.env.QWEN_MODEL || 'qwen2.5:14b',
      maxTokens: 32000,
      retries: 2,
      timeout: 90000
    },
    anthropic: {
      name: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      baseURL: 'https://api.anthropic.com',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: 4000,
      retries: 3,
      timeout: 30000
    },
    gemini: {
      name: 'gemini',
      apiKey: process.env.GEMINI_API_KEY || '',
      baseURL: 'https://generativelanguage.googleapis.com',
      model: process.env.GEMINI_MODEL || 'gemini-pro',
      maxTokens: 4000,
      retries: 3,
      timeout: 30000
    }
  }
}

// Task-specific provider preferences
export const taskProviderPreferences: Record<string, AIProviderType[]> = {
  parsing: ['deepseek', 'local', 'openai'],      // DeepSeek is good at structured tasks
  analysis: ['openai', 'deepseek', 'anthropic'], // OpenAI excels at analysis
  generation: ['openai', 'anthropic', 'deepseek'], // Creative content generation
  enhancement: ['deepseek', 'openai', 'local'],  // Content improvement
  translation: ['local', 'qwen', 'deepseek'],    // Local models often good at translation
  coding: ['deepseek', 'local', 'openai']        // DeepSeek has coding models
}

// Model-specific configurations
export const modelConfigs = {
  // OpenAI models
  'gpt-4o': { maxTokens: 4096, contextWindow: 128000 },
  'gpt-4o-mini': { maxTokens: 4096, contextWindow: 128000 },
  'gpt-4-turbo': { maxTokens: 4096, contextWindow: 128000 },
  'gpt-4': { maxTokens: 2048, contextWindow: 8192 },
  'gpt-3.5-turbo': { maxTokens: 4096, contextWindow: 16384 },
  
  // DeepSeek models
  'deepseek-chat': { maxTokens: 8192, contextWindow: 32768 },
  'deepseek-coder': { maxTokens: 8192, contextWindow: 32768 },
  'deepseek-reasoner': { maxTokens: 8192, contextWindow: 32768 },
  
  // Local/Qwen models  
  'qwen2.5:7b': { maxTokens: 16384, contextWindow: 32768 },
  'qwen2.5:14b': { maxTokens: 32768, contextWindow: 65536 },
  'qwen2.5:32b': { maxTokens: 32768, contextWindow: 131072 },
  'llama3.1:7b': { maxTokens: 8192, contextWindow: 128000 },
  'llama3.1:13b': { maxTokens: 8192, contextWindow: 128000 },
  
  // Anthropic models
  'claude-3-sonnet-20240229': { maxTokens: 4096, contextWindow: 200000 },
  'claude-3-opus-20240229': { maxTokens: 4096, contextWindow: 200000 },
  
  // Google models
  'gemini-pro': { maxTokens: 4096, contextWindow: 32768 },
  'gemini-pro-vision': { maxTokens: 4096, contextWindow: 16384 }
}

// Environment-based configuration builder
export function buildConfigFromEnv(): Partial<AIRouterConfig> {
  const config: Partial<AIRouterConfig> = {}
  
  // Determine default provider based on available API keys
  if (process.env.DEEPSEEK_API_KEY) {
    config.defaultProvider = 'deepseek'
  } else if (process.env.OPENAI_API_KEY) {
    config.defaultProvider = 'openai'
  } else if (process.env.LOCAL_AI_URL || process.env.QWEN_API_URL) {
    config.defaultProvider = 'local'
  }
  
  // Enable logging in development
  config.logRequests = process.env.NODE_ENV === 'development' || process.env.AI_DEBUG === 'true'
  
  // Fallback configuration
  config.enableFallback = process.env.AI_DISABLE_FALLBACK !== 'true'
  
  return config
}

// Provider priority based on cost and performance
export const providerPriority: Record<AIProviderType, number> = {
  local: 1,      // Cheapest (free local inference)
  qwen: 1,       // Also local/free
  deepseek: 2,   // Very cost-effective
  openai: 3,     // More expensive but reliable
  anthropic: 4,  // Premium option
  gemini: 3      // Competitive with OpenAI
}

// Cost estimates (tokens per dollar, approximate)
export const providerCosts: Record<AIProviderType, { input: number; output: number }> = {
  local: { input: Infinity, output: Infinity }, // Free
  qwen: { input: Infinity, output: Infinity },  // Free
  deepseek: { input: 1000000, output: 500000 }, // Very cheap
  openai: { input: 500000, output: 125000 },    // GPT-4o-mini rates
  anthropic: { input: 250000, output: 125000 }, // Claude-3 rates
  gemini: { input: 500000, output: 125000 }     // Gemini Pro rates
}

export { defaultRouterConfig as default }