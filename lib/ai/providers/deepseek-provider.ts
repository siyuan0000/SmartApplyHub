import { OpenAI } from 'openai'
import { BaseAIProvider } from './base-provider'
import { AIRequest, AIResponse, AIStreamResponse, AIProviderConfig } from '../types'

export class DeepSeekProvider extends BaseAIProvider {
  private client: OpenAI

  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseURL: config.baseURL || 'https://api.deepseek.com'
    })
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: this.config.baseURL,
      timeout: config.timeout || 30000
    })
  }

  get name(): string {
    return 'deepseek'
  }

  isAvailable(): boolean {
    return !!this.config.apiKey
  }

  validateConfig(): boolean {
    return !!this.config.apiKey && !!this.config.model
  }

  getModels(): string[] {
    return [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-reasoner'
    ]
  }

  protected getTokenMultiplier(): number {
    return 1.5 // DeepSeek typically supports more tokens
  }

  protected getMaxTokens(): number {
    return 8192 // DeepSeek has higher token limits
  }

  async makeRequest(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request)
    
    return this.withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: request.maxTokens || this.config.maxTokens || 4000,
        temperature: request.temperature ?? 0.7,
        stream: false
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in DeepSeek response')
      }

      return {
        content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined,
        model: response.model,
        provider: this.name
      }
    })
  }

  async* makeStreamingRequest(request: AIRequest): AsyncGenerator<AIStreamResponse> {
    this.validateRequest(request)
    
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: request.maxTokens || this.config.maxTokens || 4000,
      temperature: request.temperature ?? 0.7,
      stream: true
    })

    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        const content = delta?.content || ''
        const finishReason = chunk.choices[0]?.finish_reason
        
        yield {
          content,
          done: finishReason === 'stop' || finishReason === 'length',
          usage: chunk.usage ? {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens
          } : undefined
        }
        
        if (finishReason) {
          break
        }
      }
    } catch (error) {
      throw this.handleError(error, 'streaming request failed')
    }
  }

  protected getOptimalTemperature(task?: string): number {
    // DeepSeek works better with slightly lower temperatures
    const temperatures = {
      parsing: 0.05,
      analysis: 0.2,
      generation: 0.6,
      enhancement: 0.4,
      translation: 0.15
    }

    return temperatures[task as keyof typeof temperatures] || 0.6
  }
}