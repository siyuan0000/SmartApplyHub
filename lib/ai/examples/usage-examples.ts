// Examples of how to use the new AI router system

import { route2all, streamRoute2all, aiRouter } from '../route2all'

// Example 1: Simple usage with route2all (easiest way)
export async function simpleExample() {
  // Just pass a string and get a response
  const response = await route2all("Analyze this resume and provide feedback")
  console.log(response.content)
}

// Example 2: Streaming response
export async function streamingExample() {
  console.log("Streaming response:")
  for await (const chunk of streamRoute2all("Generate a cover letter")) {
    process.stdout.write(chunk.content)
    if (chunk.done) {
      console.log("\nStreaming complete!")
      break
    }
  }
}

// Example 3: Task-specific routing with preferences
export async function taskSpecificExample() {
  // Parse a resume (prefers DeepSeek for parsing tasks)
  const parseResponse = await route2all(
    "Parse this resume text into structured data: John Doe, Software Engineer...",
    {
      task: 'parsing',
      temperature: 0.1, // Low temperature for structured tasks
      maxTokens: 2000
    }
  )

  // Generate content (prefers OpenAI for creative tasks)
  const generateResponse = await route2all(
    "Write a professional summary for this candidate",
    {
      task: 'generation',
      temperature: 0.7, // Higher temperature for creative tasks
      preferredProvider: 'openai'
    }
  )

  console.log("Parsed:", parseResponse.content)
  console.log("Generated:", generateResponse.content)
}

// Example 4: Using the router directly for more control
export async function advancedRouterExample() {
  // Check available providers
  const providers = aiRouter.getAvailableProviders()
  console.log("Available providers:", providers)

  // Get provider status
  const status = aiRouter.getProviderStatus()
  console.log("Provider status:", status)

  // Switch default provider
  if (providers.includes('deepseek')) {
    aiRouter.switchProvider('deepseek')
    console.log("Switched to DeepSeek")
  }

  // Make request with complex message structure
  const response = await aiRouter.route([
    { role: 'system', content: 'You are a professional resume advisor' },
    { role: 'user', content: 'Help me improve my resume summary' },
    { role: 'assistant', content: 'I\'d be happy to help. Please share your current summary.' },
    { role: 'user', content: 'I am a software developer with 5 years experience.' }
  ], {
    task: 'enhancement',
    maxTokens: 1500
  })

  console.log("Enhanced content:", response.content)
}

// Example 5: Using convenience methods
export async function convenienceMethodsExample() {
  const resumeContent = {
    name: "John Doe",
    experience: [
      {
        title: "Software Engineer",
        company: "Tech Corp",
        description: "Developed web applications"
      }
    ]
  }

  // Parse resume
  const parseResult = await aiRouter.parseResume("John Doe Software Engineer at Tech Corp...")
  console.log("Parse result:", parseResult.content)

  // Analyze resume
  const analysisResult = await aiRouter.analyzeResume(resumeContent)
  console.log("Analysis:", analysisResult.content)

  // Enhance content
  const enhancedResult = await aiRouter.enhanceContent(
    "Developed web applications", 
    "Looking for a Senior Full Stack Developer position"
  )
  console.log("Enhanced:", enhancedResult.content)

  // Generate cover letter
  const coverLetter = await aiRouter.generateCoverLetter(
    resumeContent,
    "We are looking for a Senior Software Engineer..."
  )
  console.log("Cover letter:", coverLetter.content)
}

// Example 6: Error handling and fallbacks
export async function errorHandlingExample() {
  try {
    const response = await route2all("Help me with my resume", {
      preferredProvider: 'openai', // This might fail
      task: 'analysis'
    })
    console.log("Success:", response.content)
  } catch (error) {
    console.error("Request failed:", error.message)
    // Router automatically tries fallback providers if enabled
  }
}

// Example 7: Adding a custom provider (for local Qwen)
export async function customProviderExample() {
  // The router already supports local models, but here's how to add more
  const qwenConfig = {
    name: 'qwen-custom',
    apiKey: 'not-required',
    baseURL: 'http://localhost:11434',
    model: 'qwen2.5:14b',
    maxTokens: 32000
  }

  // This would require implementing a custom provider class
  // aiRouter.addProvider('qwen-custom', new LocalProvider(qwenConfig))

  // Then use it
  const response = await route2all("Hello from Qwen!", {
    preferredProvider: 'local', // Use local provider
    maxTokens: 1000
  })

  console.log("Qwen response:", response.content)
}

// Example 8: Environment-based provider selection
export async function environmentBasedExample() {
  // The router automatically detects available providers based on environment variables:
  // OPENAI_API_KEY - enables OpenAI
  // DEEPSEEK_API_KEY - enables DeepSeek  
  // LOCAL_AI_URL - enables local models (default: http://localhost:11434)
  // QWEN_API_URL - enables Qwen models
  
  console.log("Available providers based on env vars:", aiRouter.getAvailableProviders())
  
  // Make request - router will use the best available provider
  const response = await route2all("What providers are available?")
  console.log("Response:", response.content)
}

// Run examples
async function runExamples() {
  console.log("=== AI Router Examples ===\n")
  
  try {
    await simpleExample()
    await taskSpecificExample()
    await convenienceMethodsExample()
    await environmentBasedExample()
  } catch (error) {
    console.error("Example failed:", error)
  }
}

// Uncomment to run examples
// runExamples()