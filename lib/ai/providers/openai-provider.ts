import { OpenAI } from 'openai'
import { BaseAIProvider } from './base-provider'
import { AIRequest, AIResponse, AIStreamResponse, AIProviderConfig } from '../types'

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI

  constructor(config: AIProviderConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 30000
    })
  }

  get name(): string {
    return 'openai'
  }

  isAvailable(): boolean {
    return !!this.config.apiKey
  }

  validateConfig(): boolean {
    return !!this.config.apiKey && !!this.config.model
  }

  getModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ]
  }

  protected getTokenMultiplier(): number {
    return 1.0 // OpenAI as baseline
  }

  protected getMaxTokens(): number {
    const model = this.config.model.toLowerCase()
    if (model.includes('gpt-4o')) return 4096
    if (model.includes('gpt-4-turbo')) return 4096
    if (model.includes('gpt-4')) return 2048
    if (model.includes('16k')) return 16384
    return 4096
  }

  async makeRequest(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request)
    
    return this.withRetry(async () => {
      const completionParams: any = {
        model: this.config.model,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: request.maxTokens || this.config.maxTokens || 2000,
        temperature: request.temperature ?? 0.7,
        stream: false
      }

      // Add structured output support for newer models
      if (request.requiresStructured && this.supportsStructuredOutput()) {
        completionParams.response_format = { 
          type: "json_object" 
        }
        
        // Add JSON instruction to system message if not already present
        const lastSystemMessage = completionParams.messages.findLast((msg: any) => msg.role === 'system')
        if (lastSystemMessage && !lastSystemMessage.content.includes('JSON')) {
          lastSystemMessage.content += ' Respond only with valid JSON format.'
        }
      }

      const response = await this.client.chat.completions.create(completionParams)

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in OpenAI response')
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

  private supportsStructuredOutput(): boolean {
    const model = this.config.model.toLowerCase()
    // Only newer models support structured output
    return model.includes('gpt-4o') || 
           model.includes('gpt-4-turbo') || 
           model === 'gpt-3.5-turbo-1106' ||
           model.includes('gpt-3.5-turbo-16k')
  }

  async* makeStreamingRequest(request: AIRequest): AsyncGenerator<AIStreamResponse> {
    this.validateRequest(request)
    
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: request.maxTokens || this.config.maxTokens || 2000,
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
}