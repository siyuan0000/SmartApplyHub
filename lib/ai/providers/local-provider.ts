import { BaseAIProvider } from './base-provider'
import { AIRequest, AIResponse, AIStreamResponse, AIProviderConfig } from '../types'

export class LocalProvider extends BaseAIProvider {
  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseURL: config.baseURL || 'http://localhost:11434' // Default Ollama URL
    })
  }

  get name(): string {
    return 'local'
  }

  isAvailable(): boolean {
    return !!this.config.baseURL
  }

  validateConfig(): boolean {
    return !!this.config.baseURL && !!this.config.model
  }

  getModels(): string[] {
    return [
      'qwen2.5:7b',
      'qwen2.5:14b',
      'qwen2.5:32b',
      'llama3.1:7b',
      'llama3.1:13b',
      'mistral:7b',
      'codellama:7b',
      'codellama:13b'
    ]
  }

  protected getTokenMultiplier(): number {
    return 2.0 // Local models often support more context
  }

  protected getMaxTokens(): number {
    // Local models vary, but many support large contexts
    const model = this.config.model.toLowerCase()
    if (model.includes('qwen2.5')) return 32768
    if (model.includes('llama3.1')) return 8192
    return 4096
  }

  async makeRequest(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request)
    
    return this.withRetry(async () => {
      // Format messages for local API (Ollama format)
      const prompt = this.formatMessages(request.messages)
      
      const response = await fetch(`${this.config.baseURL}/api/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          prompt,
          stream: false,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens || this.config.maxTokens || 2000
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Local API responded with status ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.response) {
        throw new Error('No response from local model')
      }

      return {
        content: data.response,
        model: this.config.model,
        provider: this.name,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        }
      }
    })
  }

  async* makeStreamingRequest(request: AIRequest): AsyncGenerator<AIStreamResponse> {
    this.validateRequest(request)
    
    const prompt = this.formatMessages(request.messages)
    
    const response = await fetch(`${this.config.baseURL}/api/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.config.model,
        prompt,
        stream: true,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens || this.config.maxTokens || 2000
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Local API responded with status ${response.status}`)
    }

    if (!response.body) {
      throw new Error('No response body from local API')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          yield { content: '', done: true }
          break
        }
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            
            if (data.response) {
              yield {
                content: data.response,
                done: data.done || false,
                usage: data.done ? {
                  promptTokens: data.prompt_eval_count || 0,
                  completionTokens: data.eval_count || 0,
                  totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                } : undefined
              }
            }
            
            if (data.done) {
              return
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            continue
          }
        }
      }
    } catch (error) {
      throw this.handleError(error, 'streaming request failed')
    } finally {
      reader.releaseLock()
    }
  }

  private formatMessages(messages: { role: string; content: string }[]): string {
    // Convert OpenAI-style messages to a simple prompt format for local models
    return messages
      .map(msg => {
        switch (msg.role) {
          case 'system':
            return `System: ${msg.content}`
          case 'user':
            return `Human: ${msg.content}`
          case 'assistant':
            return `Assistant: ${msg.content}`
          default:
            return msg.content
        }
      })
      .join('\n\n') + '\n\nAssistant:'
  }

  // Check if local server is running
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/api/tags`, {
        method: 'GET',
        timeout: 5000
      } as any)
      return response.ok
    } catch {
      return false
    }
  }
}