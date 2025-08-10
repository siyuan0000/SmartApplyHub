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
      this.log('No providers available, using local fallback immediately')
      return this.generateLocalFallback(request, new Error('No AI providers configured - please check your environment variables and API keys'))
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
    const provider = this.selectProvider(taskConfig?.preferredProvider, taskConfig?.task)
    
    this.requestCount++
    this.log(`Stream request #${this.requestCount} routed to ${provider.name}`)
    
    try {
      yield* provider.makeStreamingRequest(request)
      this.resetFailureCount(provider.name as AIProviderType)
    } catch (error) {
      this.incrementFailureCount(provider.name as AIProviderType)
      
      if (this.config.enableFallback) {
        // For streaming, fallback to non-streaming
        const fallbackResponse = await this.tryFallback(request, provider.name as AIProviderType, error as Error)
        yield { content: fallbackResponse.content, done: true, usage: fallbackResponse.usage }
      } else {
        throw error
      }
    }
  }

  // Convenience methods for common tasks
  async parseResume(rawText: string): Promise<AIResponse> {
    return this.route(rawText, {
      task: 'parsing',
      temperature: 0.1,
      maxTokens: 3000,
      requiresStructured: true
    })
  }

  async analyzeResume(resumeContent: object): Promise<AIResponse> {
    const prompt = `Analyze this resume and provide detailed feedback:\n\n${JSON.stringify(resumeContent, null, 2)}`
    return this.route(prompt, {
      task: 'analysis',
      temperature: 0.3,
      maxTokens: 2000
    })
  }

  async enhanceContent(content: string, jobDescription?: string): Promise<AIResponse> {
    const prompt = jobDescription 
      ? `Enhance this content for the following job:\n\nJob: ${jobDescription}\n\nContent: ${content}`
      : `Enhance this content: ${content}`
    
    return this.route(prompt, {
      task: 'enhancement',
      temperature: 0.5,
      maxTokens: 1500
    })
  }

  async generateCoverLetter(resumeContent: object, jobDescription: string): Promise<AIResponse> {
    const prompt = `Generate a professional cover letter based on this resume and job description:

Resume: ${JSON.stringify(resumeContent, null, 2)}

Job Description: ${jobDescription}

Please create a compelling, personalized cover letter.`

    return this.route(prompt, {
      task: 'generation',
      temperature: 0.7,
      maxTokens: 1000
    })
  }

  // Provider management
  getAvailableProviders(): AIProviderType[] {
    return Array.from(this.providers.keys()).filter(type => {
      const provider = this.providers.get(type)
      return provider?.isAvailable() || false
    })
  }

  getProviderStatus(): Record<AIProviderType, { available: boolean; failures: number }> {
    const status = {} as Record<AIProviderType, { available: boolean; failures: number }>
    
    for (const [type, provider] of this.providers) {
      status[type] = {
        available: provider.isAvailable(),
        failures: this.failureCount.get(type) || 0
      }
    }
    
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
      stream: false
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
    for (const provider of this.providers.values()) {
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
      const isAboutGeneration = userMessage.toLowerCase().includes('linkedin about') || 
                              userMessage.toLowerCase().includes('professional summary') ||
                              userMessage.toLowerCase().includes('about section')
      
      if (isAboutGeneration) {
        return {
          content: this.generateTemplateAbout(userMessage),
          provider: 'local-fallback',
          usage: {
            promptTokens: request.messages.reduce((sum, m) => sum + m.content.length, 0) / 4,
            completionTokens: 150,
            totalTokens: 200
          }
        }
      }
      
      // Generic fallback for other requests
      const errorGuidance = this.getErrorGuidance(originalError.message)
      return {
        content: `I apologize, but I'm currently unable to process your request due to connectivity issues with AI services. 

${errorGuidance}

Original error: ${originalError.message}

💡 What you can do:
• Check your internet connection
• Verify your API keys are properly configured
• Try again in a few minutes
• Contact support if the issue persists`,
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

  // Generate a template-based About section when AI fails
  private generateTemplateAbout(userMessage: string): string {
    // Try to extract information from the user's message
    const hasExperience = userMessage.toLowerCase().includes('engineer') || 
                         userMessage.toLowerCase().includes('developer') ||
                         userMessage.toLowerCase().includes('manager')
    
    const hasTech = userMessage.toLowerCase().includes('javascript') ||
                   userMessage.toLowerCase().includes('python') ||
                   userMessage.toLowerCase().includes('react') ||
                   userMessage.toLowerCase().includes('node')
    
    const hasEducation = userMessage.toLowerCase().includes('university') ||
                        userMessage.toLowerCase().includes('college') ||
                        userMessage.toLowerCase().includes('degree')

    // Generate a basic template-based about section
    let aboutText = "I am a dedicated professional with a passion for innovation and excellence. "
    
    if (hasExperience) {
      aboutText += "With proven experience in my field, I bring a unique combination of technical skills and strategic thinking to every project. "
    }
    
    if (hasTech) {
      aboutText += "My technical expertise spans modern technologies and frameworks, allowing me to build robust and scalable solutions. "
    }
    
    if (hasEducation) {
      aboutText += "My educational background provides a solid foundation for continuous learning and professional growth. "
    }
    
    aboutText += "I am committed to delivering high-quality results and collaborating effectively with teams to achieve shared goals. "
    aboutText += "I'm always eager to take on new challenges and contribute to meaningful projects that make a positive impact."

    return aboutText + "\n\n⚠️ Note: This is a template response generated when AI services are unavailable. Please try again later for a personalized About section, or edit this content to better reflect your unique experience and goals."
  }
}

// Singleton instance for easy access
export const aiRouter = new AIRouter()

// Export convenience functions that use the singleton
export const route2all = aiRouter.route.bind(aiRouter)
export const streamRoute2all = aiRouter.routeStream.bind(aiRouter)