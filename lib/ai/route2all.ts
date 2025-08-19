import { 
  AIProvider, 
  AIRequest, 
  AIResponse, 
  AIStreamResponse, 
  AIProviderType, 
  AIRouterConfig,
  AITaskConfig,
  AIMessage
} from './types'
import { OpenAIProvider } from './providers/openai-provider'
import { DeepSeekProvider } from './providers/deepseek-provider'
import { LocalProvider } from './providers/local-provider'
import { loadAIEnvironmentConfig } from './config/env'

export class AIRouter {
  private providers: Map<AIProviderType, AIProvider> = new Map()
  private config: AIRouterConfig
  private requestCount: number = 0
  private failureCount: Map<AIProviderType, number> = new Map()

  constructor(config?: Partial<AIRouterConfig>) {
    // Load environment configuration first
    const envConfig = loadAIEnvironmentConfig()
    
    this.config = {
      defaultProvider: 'openai',
      fallbackProviders: ['deepseek', 'local'],
      enableFallback: true,
      logRequests: true,
      providers: {
        openai: {
          name: 'openai',
          apiKey: envConfig.openai.apiKey,
          model: envConfig.openai.model,
          maxTokens: 4000,
          retries: 3,
          baseURL: envConfig.openai.baseURL
        },
        deepseek: {
          name: 'deepseek',
          apiKey: envConfig.deepseek.apiKey,
          baseURL: envConfig.deepseek.baseURL,
          model: envConfig.deepseek.model,
          maxTokens: 8000,
          retries: 3
        },
        local: {
          name: 'local',
          apiKey: 'not-required',
          baseURL: envConfig.local.baseURL,
          model: envConfig.local.model,
          maxTokens: 16000,
          retries: 2
        },
        qwen: {
          name: 'qwen',
          apiKey: 'not-required',
          baseURL: envConfig.qwen.baseURL,
          model: envConfig.qwen.model,
          maxTokens: 32000,
          retries: 2
        },
        anthropic: {
          name: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY || '',
          baseURL: 'https://api.anthropic.com',
          model: 'claude-3-sonnet-20240229',
          maxTokens: 4000,
          retries: 3
        },
        gemini: {
          name: 'gemini',
          apiKey: process.env.GEMINI_API_KEY || '',
          baseURL: 'https://generativelanguage.googleapis.com',
          model: 'gemini-pro',
          maxTokens: 4000,
          retries: 3
        }
      },
      ...config
    }

    this.initializeProviders()
  }

  private initializeProviders(): void {
    // Initialize OpenAI provider
    if (this.config.providers.openai.apiKey && this.config.providers.openai.apiKey !== '') {
      try {
        this.providers.set('openai', new OpenAIProvider(this.config.providers.openai))
        this.log('OpenAI provider initialized successfully')
      } catch (error) {
        this.log(`Failed to initialize OpenAI provider: ${error}`)
      }
    } else {
      this.log('OpenAI provider not configured - missing API key')
    }

    // Initialize DeepSeek provider
    if (this.config.providers.deepseek.apiKey && this.config.providers.deepseek.apiKey !== '') {
      try {
        this.providers.set('deepseek', new DeepSeekProvider(this.config.providers.deepseek))
        this.log('DeepSeek provider initialized successfully')
      } catch (error) {
        this.log(`Failed to initialize DeepSeek provider: ${error}`)
      }
    } else {
      this.log('DeepSeek provider not configured - missing API key')
    }

    // Initialize Local provider (always available if URL is set)
    if (this.config.providers.local.baseURL && this.config.providers.local.baseURL !== '') {
      try {
        this.providers.set('local', new LocalProvider(this.config.providers.local))
        this.log('Local provider initialized successfully')
      } catch (error) {
        this.log(`Failed to initialize Local provider: ${error}`)
      }
    } else {
      this.log('Local provider not configured - missing base URL')
    }

    // Initialize Qwen provider (local model variant)
    if (this.config.providers.qwen.baseURL && this.config.providers.qwen.baseURL !== '') {
      try {
        this.providers.set('qwen', new LocalProvider({
          ...this.config.providers.qwen,
          name: 'qwen'
        }))
        this.log('Qwen provider initialized successfully')
      } catch (error) {
        this.log(`Failed to initialize Qwen provider: ${error}`)
      }
    } else {
      this.log('Qwen provider not configured - missing base URL')
    }

    // Log provider status
    const availableCount = this.providers.size
    this.log(`Initialized ${availableCount} AI providers`)
    
    if (availableCount === 0) {
      this.log('⚠️ No AI providers available. The system will use local fallback generation only.')
    }
  }

  // Main routing method - the "route2all" function
  async route(
    messages: AIMessage[] | string, 
    taskConfig?: Partial<AITaskConfig>
  ): Promise<AIResponse> {
    const request = this.buildRequest(messages, taskConfig)
    
    // Check if any providers are available
    const availableProviders = this.getAvailableProviders()
    if (availableProviders.length === 0) {
      this.log('No providers available')
      throw new Error('NO_PROVIDERS')
    }
    
    const provider = this.selectProvider(taskConfig?.preferredProvider, taskConfig?.task)
    
    this.requestCount++
    this.log(`Request #${this.requestCount} routed to ${provider.name}`)
    
    try {
      const response = await provider.makeRequest(request)
      this.resetFailureCount(provider.name as AIProviderType)
      return response
    } catch (error) {
      this.incrementFailureCount(provider.name as AIProviderType)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.log(`Provider ${provider.name} failed: ${errorMessage}`)
      
      // Check if it's a network-related error
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
        this.log('Network error detected, attempting fallback...')
      }
      
      if (this.config.enableFallback) {
        return this.tryFallback(request, provider.name as AIProviderType, error as Error)
      }
      
      // If no fallback enabled, still provide local fallback for better UX
      return this.generateLocalFallback(request, error as Error)
    }
  }

  // Streaming version of route2all
  async* routeStream(
    messages: AIMessage[] | string,
    taskConfig?: Partial<AITaskConfig>
  ): AsyncGenerator<AIStreamResponse> {
    const request = this.buildRequest(messages, taskConfig)
    
    // Check if any providers are available
    const availableProviders = this.getAvailableProviders()
    if (availableProviders.length === 0) {
      this.log('No providers available for streaming')
      throw new Error('NO_PROVIDERS')
    }
    
    // Get ordered list of providers to try (preferred first, then others)
    const orderedProviders = this.getOrderedProviders(taskConfig?.preferredProvider, taskConfig?.task)
    
    this.requestCount++
    this.log(`Stream request #${this.requestCount} trying ${orderedProviders.length} providers`)
    
    for (const providerType of orderedProviders) {
      const provider = this.providers.get(providerType)
      if (!provider?.isAvailable()) continue
      
      try {
        this.log(`Attempting streaming with ${provider.name}`)
        yield* provider.makeStreamingRequest(request)
        this.resetFailureCount(provider.name as AIProviderType)
        return // Success, exit the loop
      } catch (error) {
        this.incrementFailureCount(provider.name as AIProviderType)
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.log(`Streaming failed with ${provider.name}: ${errorMessage}`)
        // Continue to next provider
      }
    }
    
    // If all providers failed
    this.log('All providers failed for streaming')
    throw new Error('NO_PROVIDERS')
  }

  // Provider management
  getAvailableProviders(): AIProviderType[] {
    return Array.from(this.providers.keys()).filter(type => {
      const provider = this.providers.get(type)
      return provider?.isAvailable() || false
    })
  }

  private getOrderedProviders(preferredProvider?: AIProviderType, task?: string): AIProviderType[] {
    const availableProviders = this.getAvailableProviders()
    
    // Start with task-based preference if no explicit preferred provider
    let orderedProviders: AIProviderType[] = []
    
    if (preferredProvider && availableProviders.includes(preferredProvider)) {
      orderedProviders.push(preferredProvider)
    } else if (task) {
      const taskProvider = this.getPreferredProviderForTask(task)
      if (taskProvider && availableProviders.includes(taskProvider)) {
        orderedProviders.push(taskProvider)
      }
    }
    
    // Add default provider if not already included
    if (!orderedProviders.includes(this.config.defaultProvider) && 
        availableProviders.includes(this.config.defaultProvider)) {
      orderedProviders.push(this.config.defaultProvider)
    }
    
    // Add all remaining available providers
    const remaining = availableProviders.filter(p => !orderedProviders.includes(p))
    orderedProviders.push(...remaining)
    
    return orderedProviders
  }

  getProviderStatus(): Record<AIProviderType, { available: boolean; failures: number }> {
    const status = {} as Record<AIProviderType, { available: boolean; failures: number }>
    
    this.providers.forEach((provider, type) => {
      status[type] = {
        available: provider.isAvailable(),
        failures: this.failureCount.get(type) || 0
      }
    })
    
    return status
  }

  switchProvider(provider: AIProviderType): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} is not available`)
    }
    
    this.config.defaultProvider = provider
    this.log(`Switched default provider to ${provider}`)
  }

  // Add a new provider dynamically
  addProvider(type: AIProviderType, providerInstance: AIProvider): void {
    this.providers.set(type, providerInstance)
    this.log(`Added new provider: ${type}`)
  }

  // Private helper methods
  private buildRequest(messages: AIMessage[] | string, taskConfig?: Partial<AITaskConfig>): AIRequest {
    const messageArray = typeof messages === 'string' 
      ? [{ role: 'user' as const, content: messages }]
      : messages

    return {
      messages: messageArray,
      maxTokens: taskConfig?.maxTokens,
      temperature: taskConfig?.temperature,
      stream: false,
      requiresStructured: taskConfig?.requiresStructured
    }
  }

  private selectProvider(preferred?: AIProviderType, task?: string): AIProvider {
    // Try preferred provider first
    if (preferred && this.providers.has(preferred)) {
      const provider = this.providers.get(preferred)!
      if (provider.isAvailable()) {
        return provider
      }
    }

    // Task-based provider selection
    if (task) {
      const taskProvider = this.getPreferredProviderForTask(task)
      if (taskProvider && this.providers.has(taskProvider)) {
        const provider = this.providers.get(taskProvider)!
        if (provider.isAvailable()) {
          return provider
        }
      }
    }

    // Fall back to default provider
    const defaultProvider = this.providers.get(this.config.defaultProvider)
    if (defaultProvider?.isAvailable()) {
      return defaultProvider
    }

    // Last resort: any available provider
    for (const provider of Array.from(this.providers.values())) {
      if (provider.isAvailable()) {
        return provider
      }
    }

    throw new Error('No available AI providers')
  }

  private getPreferredProviderForTask(task: string): AIProviderType | null {
    const taskPreferences: Record<string, AIProviderType> = {
      parsing: 'deepseek',     // Better at structured tasks
      analysis: 'openai',      // Good analytical capabilities  
      generation: 'openai',    // Creative content generation
      enhancement: 'deepseek', // Good at improving content
      translation: 'local'     // Local models often good at translation
    }

    return taskPreferences[task] || null
  }

  private async tryFallback(request: AIRequest, failedProvider: AIProviderType, error: Error): Promise<AIResponse> {
    this.log(`Provider ${failedProvider} failed: ${error.message}. Trying fallback...`)
    
    const fallbackProviders = this.config.fallbackProviders.filter(p => p !== failedProvider)
    
    for (const providerType of fallbackProviders) {
      const provider = this.providers.get(providerType)
      if (!provider?.isAvailable()) continue
      
      try {
        this.log(`Attempting fallback to ${providerType}`)
        const response = await provider.makeRequest(request)
        this.log(`Fallback to ${providerType} succeeded`)
        return response
      } catch (fallbackError) {
        this.incrementFailureCount(providerType)
        this.log(`Fallback to ${providerType} failed: ${fallbackError}`)
        continue
      }
    }

    // If all AI providers fail, try local fallback generation
    this.log('All AI providers failed, attempting local fallback generation')
    return this.generateLocalFallback(request, error)
  }

  private incrementFailureCount(provider: AIProviderType): void {
    const current = this.failureCount.get(provider) || 0
    this.failureCount.set(provider, current + 1)
  }

  private resetFailureCount(provider: AIProviderType): void {
    this.failureCount.set(provider, 0)
  }

  private log(message: string): void {
    if (this.config.logRequests) {
      console.log(`[AIRouter] ${message}`)
    }
  }

  // Local fallback generation when all AI providers fail
  private async generateLocalFallback(request: AIRequest, originalError: Error): Promise<AIResponse> {
    this.log('Generating local fallback response')
    
    try {
      // Extract the user's request to understand what they're asking for
      const userMessage = request.messages.find(m => m.role === 'user')?.content || ''
      
      // Generic fallback for requests
      const errorGuidance = this.getErrorGuidance(originalError.message)
      return {
        content: `I apologize, but I'm currently unable to process your request due to connectivity issues with AI services. 

${errorGuidance}

💡 What you can do:
• Check your internet connection
• Verify your API keys are properly configured
• Try again in a few minutes
• Contact support if the issue persists

⚠️ Note: You can continue editing your resume manually while AI services are unavailable.`,
        provider: 'local-fallback',
        usage: {
          promptTokens: request.messages.reduce((sum, m) => sum + m.content.length, 0) / 4,
          completionTokens: 100,
          totalTokens: 150
        }
      }
    } catch (fallbackError) {
      // Ultimate fallback
      throw new Error(`All providers and fallback failed. Original error: ${originalError.message}`)
    }
  }

  // Helper method to provide specific error guidance
  private getErrorGuidance(errorMessage: string): string {
    if (errorMessage.includes('No AI providers configured')) {
      return `🔧 Configuration Issue: No AI providers are currently available. This usually means:
• Your API keys are not properly set in environment variables
• The environment variables are not being loaded correctly
• You need to restart your application after setting environment variables`
    }
    
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return `🌐 Network Issue: Unable to connect to AI services. This could be due to:
• Internet connectivity problems
• Firewall or proxy blocking the connection
• AI service endpoints being temporarily unavailable`
    }
    
    if (errorMessage.includes('timeout')) {
      return `⏱️ Timeout Issue: The request took too long to complete. This might be due to:
• Slow internet connection
• AI services being under heavy load
• Network latency issues`
    }
    
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      return `🔑 Authentication Issue: There's a problem with your API credentials:
• Check if your API keys are valid and not expired
• Verify the API keys have the correct permissions
• Ensure the keys are properly formatted`
    }
    
    return `❓ Unknown Issue: An unexpected error occurred. Please try again or contact support.`
  }
}

// Singleton instance for easy access
export const aiRouter = new AIRouter()

// Export convenience functions that use the singleton
export const route2all = aiRouter.route.bind(aiRouter)
export const streamRoute2all = aiRouter.routeStream.bind(aiRouter)