// Core AI types and interfaces for the router system

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIRequest {
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
  stream?: boolean
  requiresStructured?: boolean
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
  provider?: string
}

export interface AIStreamResponse {
  content: string
  done: boolean
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProviderConfig {
  name: string
  apiKey: string
  baseURL?: string
  model: string
  maxTokens?: number
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}

export interface AIProvider {
  name: string
  isAvailable(): boolean
  makeRequest(request: AIRequest): Promise<AIResponse>
  makeStreamingRequest(request: AIRequest): AsyncGenerator<AIStreamResponse>
  getModels(): string[]
  validateConfig(): boolean
}

export type AIProviderType = 'openai' | 'deepseek' | 'local' | 'qwen' | 'anthropic' | 'gemini'

export interface AIRouterConfig {
  defaultProvider: AIProviderType
  fallbackProviders: AIProviderType[]
  providers: Record<AIProviderType, AIProviderConfig>
  enableFallback: boolean
  logRequests: boolean
}

export interface AITaskConfig {
  task: 'parsing' | 'analysis' | 'generation' | 'enhancement' | 'translation'
  preferredProvider?: AIProviderType
  temperature?: number
  maxTokens?: number
  requiresStructured?: boolean
}