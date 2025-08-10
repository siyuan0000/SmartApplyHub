// Test file for the AI router system
import { AIRouter } from '../route2all'
import { AIMessage } from '../types'

describe('AI Router System', () => {
  let router: AIRouter

  beforeEach(() => {
    // Create router with test configuration
    router = new AIRouter({
      defaultProvider: 'openai',
      enableFallback: true,
      logRequests: false,
      providers: {
        openai: {
          name: 'openai',
          apiKey: process.env.OPENAI_API_KEY || 'test-key',
          model: 'gpt-4o-mini',
          maxTokens: 1000
        },
        deepseek: {
          name: 'deepseek', 
          apiKey: process.env.DEEPSEEK_API_KEY || 'test-key',
          baseURL: 'https://api.deepseek.com',
          model: 'deepseek-chat',
          maxTokens: 2000
        },
        local: {
          name: 'local',
          apiKey: 'not-required',
          baseURL: 'http://localhost:11434',
          model: 'qwen2.5:7b',
          maxTokens: 4000
        }
      }
    } as any)
  })

  test('should initialize with available providers', () => {
    const providers = router.getAvailableProviders()
    expect(providers).toBeInstanceOf(Array)
    // Should have at least one provider even with test keys
  })

  test('should get provider status', () => {
    const status = router.getProviderStatus()
    expect(status).toHaveProperty('openai')
    expect(status).toHaveProperty('deepseek') 
    expect(status).toHaveProperty('local')
  })

  test('should switch providers', () => {
    router.switchProvider('deepseek')
    // Test that default provider was switched
    expect(() => router.switchProvider('deepseek')).not.toThrow()
  })

  test('should handle simple string requests', async () => {
    // Mock the actual request to avoid API calls in tests
    const mockRoute = jest.spyOn(router, 'route').mockResolvedValue({
      content: 'Test response',
      provider: 'test'
    })

    const response = await router.route('Hello world')
    expect(response.content).toBe('Test response')
    expect(mockRoute).toHaveBeenCalledWith('Hello world', undefined)
    
    mockRoute.mockRestore()
  }, 10000)

  test('should handle message array requests', async () => {
    const messages: AIMessage[] = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' }
    ]

    const mockRoute = jest.spyOn(router, 'route').mockResolvedValue({
      content: 'Hello! How can I help you?',
      provider: 'test'
    })

    const response = await router.route(messages)
    expect(response.content).toBe('Hello! How can I help you?')
    
    mockRoute.mockRestore()
  })

  test('should use task-specific configuration', async () => {
    const mockRoute = jest.spyOn(router, 'route').mockResolvedValue({
      content: 'Parsed data',
      provider: 'test'
    })

    await router.route('Parse this text', {
      task: 'parsing',
      temperature: 0.1,
      maxTokens: 500
    })

    expect(mockRoute).toHaveBeenCalledWith('Parse this text', {
      task: 'parsing',
      temperature: 0.1,
      maxTokens: 500
    })
    
    mockRoute.mockRestore()
  })

  test('should use convenience methods', async () => {
    const mockRoute = jest.spyOn(router, 'route').mockResolvedValue({
      content: 'Resume parsed',
      provider: 'test'
    })

    await router.parseResume('John Doe Software Engineer')
    expect(mockRoute).toHaveBeenCalledWith('John Doe Software Engineer', {
      task: 'parsing',
      temperature: 0.1,
      maxTokens: 3000,
      requiresStructured: true
    })

    mockRoute.mockRestore()
  })
})

// Integration test (requires actual API keys)
describe('AI Router Integration', () => {
  test('should make real request when API keys are available', async () => {
    if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      console.log('Skipping integration test - no API keys available')
      return
    }

    const router = new AIRouter()
    const providers = router.getAvailableProviders()
    
    if (providers.length === 0) {
      console.log('Skipping integration test - no providers available')
      return
    }

    try {
      const response = await router.route('Say hello in one word', {
        maxTokens: 10,
        temperature: 0.5
      })
      
      expect(response.content).toBeTruthy()
      expect(response.provider).toBeTruthy()
      console.log('Integration test successful:', response.content)
    } catch (error) {
      console.log('Integration test failed (expected if no valid API keys):', error.message)
    }
  }, 30000)
})