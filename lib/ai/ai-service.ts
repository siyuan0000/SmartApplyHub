import { OpenAI } from 'openai'

interface AIConfig {
  apiKey: string
  baseURL?: string
  model: string
  provider: 'deepseek' | 'openai'
}

// Unified AI service that supports both DeepSeek and OpenAI
export class AIService {
  private static client: OpenAI | null = null
  private static config: AIConfig | null = null

  // Initialize the AI service with the appropriate provider
  private static initializeClient(): void {
    // Check for DeepSeek API key first (priority)
    if (process.env.DEEPSEEK_API_KEY) {
      this.config = {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        provider: 'deepseek'
      }
      console.log('Using DeepSeek API')
    } 
    // Fallback to OpenAI
    else if (process.env.OPENAI_API_KEY) {
      this.config = {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4',
        provider: 'openai'
      }
      console.log('Using OpenAI API')
    } 
    else {
      throw new Error('No AI API key found. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY environment variable.')
    }

    // Create OpenAI client (compatible with DeepSeek API)
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      dangerouslyAllowBrowser: false
    })
  }

  // Get the current provider info
  static getProviderInfo(): { provider: string; model: string } {
    if (!this.config) {
      this.initializeClient()
    }
    return {
      provider: this.config!.provider,
      model: this.config!.model
    }
  }

  // Validate that we have a working configuration
  private static validateConfiguration(): void {
    if (!this.client || !this.config) {
      this.initializeClient()
    }
  }

  // Make a standard completion request
  static async makeRequest(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    maxTokens: number = 1500,
    temperature: number = 0.7
  ): Promise<string> {
    this.validateConfiguration()

    try {
      const response = await this.client!.chat.completions.create({
        model: this.config!.model,
        messages,
        max_tokens: maxTokens,
        temperature
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error(`No response from ${this.config!.provider}`)
      }

      return content
    } catch (error) {
      console.error(`${this.config!.provider} request failed:`, error)
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Make a streaming completion request
  static async* makeStreamingRequest(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    maxTokens: number = 1500,
    temperature: number = 0.7
  ): AsyncGenerator<string, void, unknown> {
    this.validateConfiguration()

    try {
      const stream = await this.client!.chat.completions.create({
        model: this.config!.model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    } catch (error) {
      console.error(`${this.config!.provider} streaming request failed:`, error)
      throw new Error(`Streaming request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Helper method for structured JSON responses
  static async makeStructuredRequest<T>(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    maxTokens: number = 1500,
    temperature: number = 0.7
  ): Promise<T> {
    const content = await this.makeRequest(messages, maxTokens, temperature)
    
    try {
      return JSON.parse(content) as T
    } catch {
      console.error('Failed to parse JSON response:', content)
      throw new Error('Invalid JSON response from AI service')
    }
  }

  // Token management for different providers
  static getOptimalTokens(baseTokens: number): number {
    if (!this.config) {
      this.initializeClient()
    }

    // DeepSeek has different token limits compared to OpenAI
    if (this.config!.provider === 'deepseek') {
      // DeepSeek typically has higher token limits
      return Math.min(baseTokens * 1.5, 4000)
    } else {
      // OpenAI GPT-4 limits
      return Math.min(baseTokens, 2000)
    }
  }

  // Model-specific optimizations
  static getOptimalTemperature(task: 'parsing' | 'analysis' | 'generation'): number {
    if (!this.config) {
      this.initializeClient()
    }

    const temperatures = {
      deepseek: {
        parsing: 0.1,    // More deterministic for structured parsing
        analysis: 0.3,   // Balanced for analysis tasks
        generation: 0.7  // More creative for content generation
      },
      openai: {
        parsing: 0.2,
        analysis: 0.5,
        generation: 0.7
      }
    }

    return temperatures[this.config!.provider][task]
  }
}