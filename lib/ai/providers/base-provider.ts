import { AIProvider, AIRequest, AIResponse, AIStreamResponse, AIProviderConfig } from '../types'

export abstract class BaseAIProvider implements AIProvider {
  protected config: AIProviderConfig
  
  constructor(config: AIProviderConfig) {
    this.config = config
  }

  abstract get name(): string
  abstract isAvailable(): boolean
  abstract makeRequest(request: AIRequest): Promise<AIResponse>
  abstract makeStreamingRequest(request: AIRequest): AsyncGenerator<AIStreamResponse>
  abstract getModels(): string[]
  abstract validateConfig(): boolean

  // Common helper methods
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.config.headers
    }
  }

  protected handleError(error: any, context: string): Error {
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    console.error(`[${this.name}] ${context}:`, error)
    return new Error(`${this.name} ${context}: ${errorMessage}`)
  }

  protected validateRequest(request: AIRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new Error('Request must contain at least one message')
    }
    
    if (request.maxTokens && request.maxTokens < 1) {
      throw new Error('maxTokens must be greater than 0')
    }
    
    if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('temperature must be between 0 and 2')
    }
  }

  // Default token optimization based on task
  protected getOptimalTokens(baseTokens: number, task?: string): number {
    const multiplier = this.getTokenMultiplier()
    let optimized = baseTokens * multiplier

    // Task-specific adjustments
    switch (task) {
      case 'parsing':
        optimized *= 0.8 // Less tokens for structured parsing
        break
      case 'generation':
        optimized *= 1.2 // More tokens for content generation
        break
      case 'analysis':
        optimized *= 1.0 // Standard tokens for analysis
        break
    }

    return Math.min(Math.max(optimized, 100), this.getMaxTokens())
  }

  protected getOptimalTemperature(task?: string): number {
    const baseTemperatures = {
      parsing: 0.1,    // Very deterministic
      analysis: 0.3,   // Slightly creative
      generation: 0.7, // More creative
      enhancement: 0.5, // Balanced
      translation: 0.2 // Mostly deterministic
    }

    return baseTemperatures[task as keyof typeof baseTemperatures] || 0.7
  }

  // Provider-specific implementations
  protected abstract getTokenMultiplier(): number
  protected abstract getMaxTokens(): number
  
  // Retry logic with exponential backoff
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retries || 3
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw lastError
        }
        
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt) * 1000
        await this.sleep(delay)
        
        console.warn(`[${this.name}] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error)
      }
    }
    
    throw lastError!
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}