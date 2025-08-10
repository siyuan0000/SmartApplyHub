import { aiRouter } from './route2all'
import { AIMessage, AITaskConfig } from './types'

// Modern base AI service using the new router system
export class BaseAIService {
  protected static async makeRequest(
    messages: AIMessage[] | string,
    taskConfig?: Partial<AITaskConfig>
  ): Promise<string> {
    const response = await aiRouter.route(messages, taskConfig)
    return response.content
  }

  protected static async* makeStreamingRequest(
    messages: AIMessage[] | string,
    taskConfig?: Partial<AITaskConfig>
  ): AsyncGenerator<string, void, unknown> {
    for await (const chunk of aiRouter.routeStream(messages, taskConfig)) {
      if (chunk.content) {
        yield chunk.content
      }
      if (chunk.done) {
        break
      }
    }
  }

  protected static async makeStructuredRequest<T>(
    messages: AIMessage[] | string,
    taskConfig?: Partial<AITaskConfig>
  ): Promise<T> {
    const response = await aiRouter.route(messages, {
      ...taskConfig,
      requiresStructured: true
    })
    
    try {
      return JSON.parse(response.content) as T
    } catch {
      console.error('Failed to parse structured response:', response.content)
      throw new Error('Invalid JSON response from AI service')
    }
  }

  // Helper methods for task-specific optimization
  protected static getOptimalTokens(baseTokens: number, task?: string): number {
    // Task-specific token adjustments
    const multipliers = {
      parsing: 0.8,
      analysis: 1.2,
      generation: 1.5,
      enhancement: 1.0
    }
    
    const multiplier = multipliers[task as keyof typeof multipliers] || 1.0
    return Math.round(baseTokens * multiplier)
  }

  protected static getOptimalTemperature(task: 'parsing' | 'analysis' | 'generation' | 'enhancement'): number {
    const temperatures = {
      parsing: 0.1,
      analysis: 0.3,
      generation: 0.7,
      enhancement: 0.5
    }
    
    return temperatures[task] || 0.7
  }
}

// Legacy compatibility - keep the old class name but use new implementation
export class BaseOpenAIService extends BaseAIService {
  // Maintained for backward compatibility
} 