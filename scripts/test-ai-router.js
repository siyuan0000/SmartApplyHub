// Simple test script for the AI router
const { route2all, aiRouter } = require('../lib/ai/route2all')

async function testRouter() {
  console.log('🤖 Testing AI Router System...\n')
  
  try {
    // Check available providers
    const providers = aiRouter.getAvailableProviders()
    console.log('📡 Available providers:', providers)
    
    const status = aiRouter.getProviderStatus()
    console.log('📊 Provider status:', status)
    
    if (providers.length === 0) {
      console.log('⚠️  No providers available. Please set API keys:')
      console.log('   OPENAI_API_KEY - for OpenAI')
      console.log('   DEEPSEEK_API_KEY - for DeepSeek')
      console.log('   LOCAL_AI_URL - for local models (default: http://localhost:11434)')
      return
    }
    
    console.log('\n🧪 Testing simple request...')
    const response = await route2all('Say "Hello from AI Router!" in exactly those words.', {
      maxTokens: 50,
      temperature: 0.1
    })
    
    console.log('✅ Router response:', response.content)
    console.log('🏷️  Provider used:', response.provider)
    console.log('📈 Usage:', response.usage)
    
    console.log('\n🔄 Testing task-specific routing...')
    const parseResponse = await route2all('Parse this: John Doe, Software Engineer at Tech Corp', {
      task: 'parsing',
      temperature: 0.1,
      maxTokens: 100
    })
    
    console.log('📋 Parse result:', parseResponse.content)
    console.log('🏷️  Provider used:', parseResponse.provider)
    
    console.log('\n✨ Router test completed successfully!')
    
  } catch (error) {
    console.error('❌ Router test failed:', error.message)
    console.log('\nThis is expected if no valid API keys are configured.')
  }
}

// Run the test
testRouter()