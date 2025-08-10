#!/usr/bin/env node

/**
 * Test script to verify environment variable loading
 * Run with: node scripts/test-env-loading.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Testing Environment Variable Loading...\n')

// Check AI provider environment variables
const envVars = {
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'DEEPSEEK_API_KEY': process.env.DEEPSEEK_API_KEY,
  'LOCAL_AI_URL': process.env.LOCAL_AI_URL,
  'QWEN_API_URL': process.env.QWEN_API_URL,
  'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,
  'GEMINI_API_KEY': process.env.GEMINI_API_KEY
}

console.log('📋 Environment Variables Status:')
Object.entries(envVars).forEach(([key, value]) => {
  const status = value ? '✅ SET' : '❌ NOT SET'
  const preview = value ? `${value.substring(0, 10)}...` : 'undefined'
  console.log(`  ${key}: ${status} (${preview})`)
})

console.log('\n🔧 Configuration Analysis:')

// Check if any AI providers are available
const hasOpenAI = !!process.env.OPENAI_API_KEY
const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY
const hasLocal = !!process.env.LOCAL_AI_URL
const hasQwen = !!process.env.QWEN_API_URL

const availableProviders = []
if (hasOpenAI) availableProviders.push('OpenAI')
if (hasDeepSeek) availableProviders.push('DeepSeek')
if (hasLocal) availableProviders.push('Local AI')
if (hasQwen) availableProviders.push('Qwen')

if (availableProviders.length === 0) {
  console.log('  ❌ No AI providers configured!')
  console.log('  💡 You need to set at least one of:')
  console.log('     - OPENAI_API_KEY')
  console.log('     - DEEPSEEK_API_KEY')
  console.log('     - LOCAL_AI_URL')
  console.log('     - QWEN_API_URL')
} else {
  console.log(`  ✅ ${availableProviders.length} AI provider(s) available: ${availableProviders.join(', ')}`)
}

console.log('\n🌐 Network Test:')
console.log('  Testing basic connectivity...')

// Test basic network connectivity
const https = require('https')

function testConnection(url, name) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`    ${name}: ✅ Connected (${res.statusCode})`)
      resolve(true)
    })
    
    req.on('error', (err) => {
      console.log(`    ${name}: ❌ Failed (${err.message})`)
      resolve(false)
    })
    
    req.setTimeout(5000, () => {
      console.log(`    ${name}: ⏱️ Timeout`)
      req.destroy()
      resolve(false)
    })
  })
}

async function runNetworkTests() {
  const tests = [
    { url: 'https://api.openai.com', name: 'OpenAI API' },
    { url: 'https://api.deepseek.com', name: 'DeepSeek API' },
    { url: 'https://httpbin.org/get', name: 'General Internet' }
  ]
  
  for (const test of tests) {
    await testConnection(test.url, test.name)
  }
}

runNetworkTests().then(() => {
  console.log('\n📝 Summary:')
  if (availableProviders.length > 0) {
    console.log('  ✅ AI providers are configured and should work')
    console.log('  💡 If you still get "Failed to fetch" errors, check:')
    console.log('     - Internet connectivity')
    console.log('     - API key validity')
    console.log('     - Firewall/proxy settings')
  } else {
    console.log('  ❌ No AI providers configured')
    console.log('  💡 The system will use local fallback generation only')
  }
  
  console.log('\n🚀 To fix configuration issues:')
  console.log('  1. Check your .env.local file')
  console.log('  2. Restart your development server')
  console.log('  3. Verify API keys are valid')
  console.log('  4. Check network connectivity')
}) 