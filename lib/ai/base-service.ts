import { OpenAI } from 'openai'

// Base OpenAI service with shared configuration and validation
export class BaseOpenAIService {
  protected static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: false // Ensure this only runs on server-side
  })

  protected static validateApiKey(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY environment variable.')
    }
  }

  protected static async makeRequest(
    messages: any[],
    maxTokens: number = 1500,
    temperature: number = 0.7
  ) {
    this.validateApiKey()

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: maxTokens,
        temperature
      })

      const content = response.choices[0].message.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return content
    } catch (error) {
      console.error('OpenAI request failed:', error)
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} 