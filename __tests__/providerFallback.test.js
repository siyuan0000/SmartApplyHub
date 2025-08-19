/**
 * Tests for provider fallback logic and NO_PROVIDERS error handling
 */

// Mock AIRouter implementation for testing
class MockAIRouter {
  constructor() {
    this.providers = new Map()
    this.config = {
      defaultProvider: 'deepseek',
      fallbackProviders: ['openai', 'local'],
      enableFallback: true
    }
  }

  // Mock provider management
  addProvider(type, provider) {
    this.providers.set(type, provider)
  }

  getAvailableProviders() {
    return Array.from(this.providers.keys()).filter(type => {
      const provider = this.providers.get(type)
      return provider?.isAvailable() || false
    })
  }

  getOrderedProviders(preferredProvider, task) {
    const availableProviders = this.getAvailableProviders()
    let orderedProviders = []
    
    if (preferredProvider && availableProviders.includes(preferredProvider)) {
      orderedProviders.push(preferredProvider)
    }
    
    if (!orderedProviders.includes(this.config.defaultProvider) && 
        availableProviders.includes(this.config.defaultProvider)) {
      orderedProviders.push(this.config.defaultProvider)
    }
    
    const remaining = availableProviders.filter(p => !orderedProviders.includes(p))
    orderedProviders.push(...remaining)
    
    return orderedProviders
  }

  async* routeStream(messages, taskConfig) {
    const availableProviders = this.getAvailableProviders()
    if (availableProviders.length === 0) {
      throw new Error('NO_PROVIDERS')
    }
    
    const orderedProviders = this.getOrderedProviders(taskConfig?.preferredProvider, taskConfig?.task)
    
    for (const providerType of orderedProviders) {
      const provider = this.providers.get(providerType)
      if (!provider?.isAvailable()) continue
      
      try {
        yield* provider.makeStreamingRequest(messages)
        return // Success, exit loop
      } catch (error) {
        // Continue to next provider
      }
    }
    
    throw new Error('NO_PROVIDERS')
  }
}

// Mock provider implementations
class MockOpenAIProvider {
  constructor(available = true, shouldFail = false) {
    this.available = available
    this.shouldFail = shouldFail
    this.name = 'openai'
  }

  isAvailable() {
    return this.available
  }

  async* makeStreamingRequest(messages) {
    if (this.shouldFail) {
      throw new Error('OpenAI API Error')
    }
    yield { content: 'OpenAI response chunk 1' }
    yield { content: ' chunk 2' }
  }
}

class MockDeepSeekProvider {
  constructor(available = true, shouldFail = false) {
    this.available = available
    this.shouldFail = shouldFail
    this.name = 'deepseek'
  }

  isAvailable() {
    return this.available
  }

  async* makeStreamingRequest(messages) {
    if (this.shouldFail) {
      throw new Error('DeepSeek API Error')
    }
    yield { content: 'DeepSeek response chunk 1' }
    yield { content: ' chunk 2' }
  }
}

class MockLocalProvider {
  constructor(available = true, shouldFail = false) {
    this.available = available
    this.shouldFail = shouldFail
    this.name = 'local'
  }

  isAvailable() {
    return this.available
  }

  async* makeStreamingRequest(messages) {
    if (this.shouldFail) {
      throw new Error('Local provider error')
    }
    yield { content: 'Local response chunk 1' }
    yield { content: ' chunk 2' }
  }
}

// Test framework
function runProviderFallbackTests() {
  console.log('🧪 Running provider fallback tests...\\n')
  
  let passed = 0
  let failed = 0

  const tests = [
    {
      name: 'should throw NO_PROVIDERS when no providers are available',
      test: async () => {
        const router = new MockAIRouter()
        // Don't add any providers
        
        try {
          const generator = router.routeStream(['test message'])
          await generator.next()
          return false // Should have thrown
        } catch (error) {
          return error.message === 'NO_PROVIDERS'
        }
      }
    },
    {
      name: 'should use preferred provider when available',
      test: async () => {
        const router = new MockAIRouter()
        const openai = new MockOpenAIProvider(true, false)
        const deepseek = new MockDeepSeekProvider(true, false)
        
        router.addProvider('openai', openai)
        router.addProvider('deepseek', deepseek)
        
        const generator = router.routeStream(['test message'], { preferredProvider: 'deepseek' })
        const first = await generator.next()
        
        return first.value?.content === 'DeepSeek response chunk 1'
      }
    },
    {
      name: 'should fallback to next provider when preferred fails',
      test: async () => {
        const router = new MockAIRouter()
        const openai = new MockOpenAIProvider(true, true) // Available but fails
        const deepseek = new MockDeepSeekProvider(true, false) // Available and works
        
        router.addProvider('openai', openai)
        router.addProvider('deepseek', deepseek)
        
        const generator = router.routeStream(['test message'], { preferredProvider: 'openai' })
        const first = await generator.next()
        
        return first.value?.content === 'DeepSeek response chunk 1'
      }
    },
    {
      name: 'should try all providers before throwing NO_PROVIDERS',
      test: async () => {
        const router = new MockAIRouter()
        const openai = new MockOpenAIProvider(true, true) // Fails
        const deepseek = new MockDeepSeekProvider(true, true) // Fails
        const local = new MockLocalProvider(true, true) // Fails
        
        router.addProvider('openai', openai)
        router.addProvider('deepseek', deepseek)
        router.addProvider('local', local)
        
        try {
          const generator = router.routeStream(['test message'])
          await generator.next()
          return false // Should have thrown
        } catch (error) {
          return error.message === 'NO_PROVIDERS'
        }
      }
    },
    {
      name: 'should skip unavailable providers',
      test: async () => {
        const router = new MockAIRouter()
        const openai = new MockOpenAIProvider(false, false) // Not available
        const deepseek = new MockDeepSeekProvider(true, false) // Available and works
        
        router.addProvider('openai', openai)
        router.addProvider('deepseek', deepseek)
        
        const generator = router.routeStream(['test message'], { preferredProvider: 'openai' })
        const first = await generator.next()
        
        return first.value?.content === 'DeepSeek response chunk 1'
      }
    },
    {
      name: 'should work with local provider as last resort',
      test: async () => {
        const router = new MockAIRouter()
        const openai = new MockOpenAIProvider(true, true) // Fails
        const deepseek = new MockDeepSeekProvider(true, true) // Fails
        const local = new MockLocalProvider(true, false) // Works
        
        router.addProvider('openai', openai)
        router.addProvider('deepseek', deepseek)
        router.addProvider('local', local)
        
        const generator = router.routeStream(['test message'])
        const first = await generator.next()
        
        return first.value?.content === 'Local response chunk 1'
      }
    },
    {
      name: 'should return correct provider order without preferred',
      test: () => {
        const router = new MockAIRouter()
        const openai = new MockOpenAIProvider(true)
        const deepseek = new MockDeepSeekProvider(true)
        const local = new MockLocalProvider(true)
        
        router.addProvider('openai', openai)
        router.addProvider('deepseek', deepseek)
        router.addProvider('local', local)
        
        const ordered = router.getOrderedProviders()
        
        return ordered[0] === 'openai' && // Default provider first
               ordered.includes('deepseek') &&
               ordered.includes('local')
      }
    },
    {
      name: 'should return correct provider order with preferred',
      test: () => {
        const router = new MockAIRouter()
        const openai = new MockOpenAIProvider(true)
        const deepseek = new MockDeepSeekProvider(true)
        const local = new MockLocalProvider(true)
        
        router.addProvider('openai', openai)
        router.addProvider('deepseek', deepseek)
        router.addProvider('local', local)
        
        const ordered = router.getOrderedProviders('deepseek')
        
        return ordered[0] === 'deepseek' && // Preferred first
               ordered.includes('openai') &&
               ordered.includes('local')
      }
    },
    {
      name: 'should complete full stream from working provider',
      test: async () => {
        const router = new MockAIRouter()
        const deepseek = new MockDeepSeekProvider(true, false)
        
        router.addProvider('deepseek', deepseek)
        
        const generator = router.routeStream(['test message'])
        const chunks = []
        
        for await (const chunk of generator) {
          chunks.push(chunk.content)
        }
        
        return chunks.length === 2 &&
               chunks[0] === 'DeepSeek response chunk 1' &&
               chunks[1] === ' chunk 2'
      }
    },
    {
      name: 'should handle mixed available/unavailable providers',
      test: () => {
        const router = new MockAIRouter()
        const openai = new MockOpenAIProvider(false) // Not available
        const deepseek = new MockDeepSeekProvider(true) // Available
        const local = new MockLocalProvider(false) // Not available
        
        router.addProvider('openai', openai)
        router.addProvider('deepseek', deepseek)
        router.addProvider('local', local)
        
        const available = router.getAvailableProviders()
        
        return available.length === 1 && available[0] === 'deepseek'
      }
    }
  ]

  // Run all tests
  async function runAllTests() {
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      try {
        const result = await test.test()
        if (result) {
          console.log(`✅ Test ${i + 1}: ${test.name}`)
          passed++
        } else {
          console.log(`❌ Test ${i + 1}: ${test.name}`)
          failed++
        }
      } catch (error) {
        console.log(`💥 Test ${i + 1}: ${test.name} - ERROR: ${error.message}`)
        failed++
      }
    }

    console.log(`\\n📊 Test Results: ${passed} passed, ${failed} failed`)
    
    if (failed === 0) {
      console.log('🎉 All provider fallback tests passed!')
      return true
    } else {
      console.log('⚠️  Some tests failed')
      return false
    }
  }

  return runAllTests()
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    runProviderFallbackTests, 
    MockAIRouter, 
    MockOpenAIProvider, 
    MockDeepSeekProvider, 
    MockLocalProvider 
  }
}

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runProviderFallbackTests().then(success => {
    process.exit(success ? 0 : 1)
  })
}