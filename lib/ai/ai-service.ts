import { aiRouter } from './route2all'
import { AIMessage, AIProviderType } from './types'

// Legacy AI service - now delegates to the new router system
// Kept for backward compatibility while transitioning to the new system
export class AIService {
  // Get the current provider info from router
  static getProviderInfo(): { provider: string; model: string } {
    const status = aiRouter.getProviderStatus()
    const availableProviders = Object.keys(status).filter(p => status[p as AIProviderType].available)
    
    return {
      provider: availableProviders[0] || 'none',
      model: 'via-router' // Models are now handled by individual providers
    }
  }

  // Legacy method - converts OpenAI format to new router format
  static async makeRequest(
    messages: Array<{ role: string; content: string }>, // OpenAI.Chat.Completions.ChatCompletionMessageParam[]
    maxTokens: number = 1500,
    temperature: number = 0.7
  ): Promise<string> {
    const aiMessages: AIMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    const response = await aiRouter.route(aiMessages, {
      maxTokens,
      temperature,
      task: 'generation' // Default task
    })
    
    return response.content
  }

  // Legacy streaming method
  static async* makeStreamingRequest(
    messages: Array<{ role: string; content: string }>, // OpenAI.Chat.Completions.ChatCompletionMessageParam[]
    maxTokens: number = 1500,
    temperature: number = 0.7
  ): AsyncGenerator<string, void, unknown> {
    const aiMessages: AIMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    for await (const chunk of aiRouter.routeStream(aiMessages, {
      maxTokens,
      temperature,
      task: 'generation'
    })) {
      if (chunk.content) {
        yield chunk.content
      }
      if (chunk.done) {
        break
      }
    }
  }

  // Legacy structured request method
  static async makeStructuredRequest<T>(
    messages: Array<{ role: string; content: string }>, // OpenAI.Chat.Completions.ChatCompletionMessageParam[]
    maxTokens: number = 1500,
    temperature: number = 0.7
  ): Promise<T> {
    const aiMessages: AIMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    const response = await aiRouter.route(aiMessages, {
      maxTokens,
      temperature,
      task: 'parsing',
      requiresStructured: true
    })
    
    try {
      return JSON.parse(response.content) as T
    } catch {
      console.error('Failed to parse JSON response:', response.content)
      throw new Error('Invalid JSON response from AI service')
    }
  }

  // Legacy token management - now uses router's logic
  static getOptimalTokens(baseTokens: number): number {
    // Use router's provider-specific optimization
    return Math.min(baseTokens * 1.2, 4000)
  }

  // Legacy temperature optimization
  static getOptimalTemperature(task: 'parsing' | 'analysis' | 'generation'): number {
    const temperatures = {
      parsing: 0.1,
      analysis: 0.3,
      generation: 0.7
    }
    
    return temperatures[task]
  }
}

// Export the router for direct access to modern functionality
export { aiRouter } from './route2all'
export { route2all, streamRoute2all } from './route2all'