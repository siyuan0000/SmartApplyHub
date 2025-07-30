import { OpenAI } from 'openai'
import { AIService } from './ai-service'

// Base AI service with shared configuration and validation
// Now uses the new AIService that supports both DeepSeek and OpenAI
export class BaseOpenAIService {
  protected static async makeRequest(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    maxTokens: number = 1500,
    temperature: number = 0.7
  ): Promise<string> {
    return AIService.makeRequest(messages, maxTokens, temperature)
  }

  protected static async* makeStreamingRequest(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    maxTokens: number = 1500,
    temperature: number = 0.7
  ): AsyncGenerator<string, void, unknown> {
    yield* AIService.makeStreamingRequest(messages, maxTokens, temperature)
  }

  protected static async makeStructuredRequest<T>(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    maxTokens: number = 1500,
    temperature: number = 0.7
  ): Promise<T> {
    return AIService.makeStructuredRequest<T>(messages, maxTokens, temperature)
  }

  // Helper methods for task-specific optimization
  protected static getOptimalTokens(baseTokens: number): number {
    return AIService.getOptimalTokens(baseTokens)
  }

  protected static getOptimalTemperature(task: 'parsing' | 'analysis' | 'generation'): number {
    return AIService.getOptimalTemperature(task)
  }
} 