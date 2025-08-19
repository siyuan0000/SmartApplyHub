/**
 * Unit tests for parseAiResponse function
 * Tests the robust AI response parsing with JSON-first approach and regex fallback
 */

// Mock the parsing function to test in isolation
const mockParseAiResponse = (raw, provider) => {
  // Normalize line endings
  const content = raw.replace(/\r\n/g, '\n').trim()
  
  // Try to locate JSON via delimiters or first { ... } block
  let jsonResult = tryParseJson(content)
  if (jsonResult) {
    return {
      enhancedText: jsonResult.enhancedText || '',
      suggestions: Array.isArray(jsonResult.suggestions) ? jsonResult.suggestions.filter(s => typeof s === 'string' && s.trim().length >= 5) : [],
      changes: Array.isArray(jsonResult.changes) ? jsonResult.changes.filter(c => typeof c === 'string' && c.trim().length >= 5) : [],
      provider
    }
  }
  
  // Fallback to improved regex parsing
  return parseWithRegex(content, provider)
}

const tryParseJson = (content) => {
  // Try delimiter-based extraction first
  const delimiterMatch = content.match(/### OUTPUT \(valid JSON\)\s*\n([\s\S]*?)\n### END/i)
  if (delimiterMatch) {
    try {
      return JSON.parse(delimiterMatch[1].trim())
    } catch {
      // Continue to next approach
    }
  }
  
  // Try to find first complete JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {
      // Continue to fallback
    }
  }
  
  return null
}

const parseWithRegex = (content, provider) => {
  const bulletRegex = /^[\s*•+\-]|\d+[.)]\s*/gm
  
  // Extract enhanced text
  let enhancedText = extractTextSection(content, [
    /(?:enhanced version|enhanced content|improved version|improved content):\s*\n([\s\S]*?)(?:\n\n|$)/i,
    /(?:here's the enhanced|here is the enhanced)([\s\S]*?)(?:\n\n|$)/i,
    /```\s*([\s\S]*?)\s*```/
  ])
  
  if (!enhancedText) {
    // Fallback: use first substantial paragraph
    const paragraphs = content.split('\n\n')
    enhancedText = paragraphs.find(p => p.trim().length > 50) || content
  }
  
  // Extract suggestions
  const suggestions = extractListSection(content, [
    /(?:suggestions|recommendations|additional suggestions):\s*\n([\s\S]*?)(?:\n\n|$)/i,
    /(?:key improvements|improvements made):\s*\n([\s\S]*?)(?:\n\n|$)/i
  ], bulletRegex)
  
  // Extract changes
  const changes = extractListSection(content, [
    /(?:changes made|key improvements|improvements):\s*\n([\s\S]*?)(?:\n\n|$)/i,
    /(?:what i changed|modifications):\s*\n([\s\S]*?)(?:\n\n|$)/i
  ], bulletRegex)
  
  return {
    enhancedText: enhancedText.trim(),
    suggestions,
    changes,
    provider
  }
}

const extractTextSection = (content, patterns) => {
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]?.trim()) {
      return match[1].trim()
    }
  }
  return ''
}

const extractListSection = (content, patterns, bulletRegex) => {
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const lines = match[1].split('\n')
      const items = []
      
      for (const line of lines) {
        const cleaned = line.replace(bulletRegex, '').trim()
        if (cleaned && cleaned.length >= 5) {
          items.push(cleaned)
        }
      }
      
      if (items.length > 0) {
        return items
      }
    }
  }
  return []
}

// Test data for various AI response formats
const testCases = [
  // 1. Perfect JSON with delimiters
  {
    name: 'Perfect JSON with delimiters',
    input: `### OUTPUT (valid JSON)
{
  "enhancedText": "I am a seasoned software engineer with 5+ years of experience in full-stack development.",
  "suggestions": ["Add specific technologies used", "Include quantifiable achievements", "Mention team leadership experience"],
  "changes": ["Improved professional tone", "Added years of experience", "Enhanced impact statements"]
}
### END`,
    expected: {
      enhancedText: "I am a seasoned software engineer with 5+ years of experience in full-stack development.",
      suggestions: ["Add specific technologies used", "Include quantifiable achievements", "Mention team leadership experience"],
      changes: ["Improved professional tone", "Added years of experience", "Enhanced impact statements"],
      provider: 'test'
    }
  },

  // 2. JSON without delimiters
  {
    name: 'JSON without delimiters',
    input: `Here's the enhanced content:

{
  "enhancedText": "Dynamic software developer specializing in React and Node.js applications.",
  "suggestions": ["Include portfolio links", "Add certification details"],
  "changes": ["Made more dynamic", "Added technology specifics"]
}

This should help with your resume.`,
    expected: {
      enhancedText: "Dynamic software developer specializing in React and Node.js applications.",
      suggestions: ["Include portfolio links", "Add certification details"],
      changes: ["Made more dynamic", "Added technology specifics"],
      provider: 'test'
    }
  },

  // 3. Malformed JSON - should fall back to regex
  {
    name: 'Malformed JSON - regex fallback',
    input: `Enhanced Version:
Experienced software engineer with expertise in modern web technologies.

Suggestions:
• Add specific project examples
• Include metrics and KPIs
• Mention leadership roles

Changes Made:
• Enhanced professional language
• Added industry-specific terms
• Improved readability`,
    expected: {
      enhancedText: "Experienced software engineer with expertise in modern web technologies.",
      suggestions: ["Add specific project examples", "Include metrics and KPIs", "Mention leadership roles"],
      changes: ["Enhanced professional language", "Added industry-specific terms", "Improved readability"],
      provider: 'test'
    }
  },

  // 4. Mixed format - prefer JSON
  {
    name: 'Mixed format - prefer JSON',
    input: `Here's your enhanced content:

Enhanced Version:
Some text here that might confuse the parser.

### OUTPUT (valid JSON)
{
  "enhancedText": "Professional software engineer with proven track record.",
  "suggestions": ["Add portfolio", "Include testimonials"],
  "changes": ["Improved structure", "Enhanced clarity"]
}
### END

Additional notes follow.`,
    expected: {
      enhancedText: "Professional software engineer with proven track record.",
      suggestions: ["Add portfolio", "Include testimonials"],
      changes: ["Improved structure", "Enhanced clarity"],
      provider: 'test'
    }
  },

  // 5. Empty or minimal response
  {
    name: 'Empty response',
    input: '',
    expected: {
      enhancedText: '',
      suggestions: [],
      changes: [],
      provider: 'test'
    }
  },

  // 6. Filter out short suggestions/changes
  {
    name: 'Filter short suggestions',
    input: `### OUTPUT (valid JSON)
{
  "enhancedText": "Senior developer with strong technical skills.",
  "suggestions": ["Good", "Add specific programming languages and frameworks", "OK", "Include quantifiable project outcomes"],
  "changes": ["Fix", "Improved technical language", "Updated formatting and structure"]
}
### END`,
    expected: {
      enhancedText: "Senior developer with strong technical skills.",
      suggestions: ["Add specific programming languages and frameworks", "Include quantifiable project outcomes"],
      changes: ["Improved technical language", "Updated formatting and structure"],
      provider: 'test'
    }
  },

  // 7. No provider specified
  {
    name: 'No provider specified',
    input: `### OUTPUT (valid JSON)
{
  "enhancedText": "Innovative software engineer with passion for clean code.",
  "suggestions": ["Add GitHub profile", "Include open source contributions"],
  "changes": ["Enhanced personality", "Added technical passion"]
}
### END`,
    expected: {
      enhancedText: "Innovative software engineer with passion for clean code.",
      suggestions: ["Add GitHub profile", "Include open source contributions"],
      changes: ["Enhanced personality", "Added technical passion"],
      provider: undefined
    }
  },

  // 8. Complex regex fallback with multiple sections
  {
    name: 'Complex regex fallback',
    input: `Here's the enhanced version:

Enhanced Content:
Full-stack developer with 7+ years building scalable web applications.

Key Improvements:
• Added years of experience for credibility
• Specified full-stack expertise
• Emphasized scalability focus
• Used industry-standard terminology

Additional Suggestions:
• Consider adding specific technology stack details
• Include metrics from previous projects  
• Mention any leadership or mentoring experience
• Add links to portfolio or GitHub profile`,
    expected: {
      enhancedText: "Enhanced Content:\nFull-stack developer with 7+ years building scalable web applications.",
      suggestions: ["Consider adding specific technology stack details", "Include metrics from previous projects", "Mention any leadership or mentoring experience", "Add links to portfolio or GitHub profile"],
      changes: ["Added years of experience for credibility", "Specified full-stack expertise", "Emphasized scalability focus", "Used industry-standard terminology"],
      provider: 'test'
    }
  }
]

// Simple test runner
function runTests() {
  console.log('🧪 Running parseAiResponse unit tests...\n')
  
  let passed = 0
  let failed = 0
  
  testCases.forEach((testCase, index) => {
    try {
      const result = mockParseAiResponse(testCase.input, testCase.expected.provider)
      
      // Deep comparison
      const isEqual = JSON.stringify(result) === JSON.stringify(testCase.expected)
      
      if (isEqual) {
        console.log(`✅ Test ${index + 1}: ${testCase.name}`)
        passed++
      } else {
        console.log(`❌ Test ${index + 1}: ${testCase.name}`)
        console.log('  Expected:', JSON.stringify(testCase.expected, null, 2))
        console.log('  Received:', JSON.stringify(result, null, 2))
        failed++
      }
    } catch (error) {
      console.log(`💥 Test ${index + 1}: ${testCase.name} - ERROR: ${error.message}`)
      failed++
    }
  })
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)
  
  if (failed === 0) {
    console.log('🎉 All tests passed!')
    return true
  } else {
    console.log('⚠️  Some tests failed')
    return false
  }
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, mockParseAiResponse, testCases }
}

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const success = runTests()
  process.exit(success ? 0 : 1)
}