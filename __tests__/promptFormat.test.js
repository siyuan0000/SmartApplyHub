/**
 * Unit tests for prompt format validation (JavaScript version)
 * Tests that the new prompt contains the required delimiters for streaming mode
 */

// Mock the createUserPrompt function from useSectionEnhancement
const mockCreateUserPrompt = (context) => {
  const isEmpty = !context.originalContent || !context.originalContent.trim()
  
  let prompt = isEmpty 
    ? `Please create a professional ${context.sectionType} section from scratch:

Current content: [Empty - please generate new content]
`
    : `Please enhance this ${context.sectionType} section content:

Current content:
${context.originalContent}
`

  if (context.jobDescription) {
    prompt += `\nTarget job context:
${context.jobDescription}
`
  }

  if (context.customPrompt) {
    prompt += `\nSpecific ${isEmpty ? 'creation' : 'enhancement'} request:
${context.customPrompt}
`
  }

  if (isEmpty) {
    prompt += `\nPlease create:
1. Professional ${context.sectionType} content following industry best practices
2. Content that would be impressive to recruiters and hiring managers
3. Realistic but compelling information (use placeholder data where needed)
4. Content optimized for ATS (Applicant Tracking Systems)

Note: Since starting from scratch, create professional placeholder content that the user can customize with their specific details.`
  } else {
    prompt += `\nPlease provide:
1. Enhanced version of the content
2. Key improvements made
3. Additional suggestions for optimization

Focus on making this section stand out while remaining truthful and professional.`
  }

  prompt += `\n\n###
Output *exactly* in this format – no markdown fences:

=== ANALYSIS ===
<bullet-point analysis of current content (or of empty state)>

=== ENHANCED_CONTENT ===
<fully improved ${context.sectionType} section, ready to paste verbatim>
###`

  return prompt
}

// Simple test framework
function runPromptFormatTests() {
  console.log('🧪 Running prompt format tests...\n')
  
  let passed = 0
  let failed = 0

  const tests = [
    {
      name: 'should contain === ANALYSIS === delimiter',
      test: () => {
        const context = {
          sectionType: 'experience',
          originalContent: 'Software Engineer at Tech Corp'
        }
        const prompt = mockCreateUserPrompt(context)
        return prompt.includes('=== ANALYSIS ===')
      }
    },
    {
      name: 'should contain === ENHANCED_CONTENT === delimiter',
      test: () => {
        const context = {
          sectionType: 'experience',
          originalContent: 'Software Engineer at Tech Corp'
        }
        const prompt = mockCreateUserPrompt(context)
        return prompt.includes('=== ENHANCED_CONTENT ===')
      }
    },
    {
      name: 'should have both delimiters in correct order',
      test: () => {
        const context = {
          sectionType: 'summary',
          originalContent: 'I am a developer'
        }
        const prompt = mockCreateUserPrompt(context)
        const analysisIndex = prompt.indexOf('=== ANALYSIS ===')
        const contentIndex = prompt.indexOf('=== ENHANCED_CONTENT ===')
        return analysisIndex > -1 && contentIndex > -1 && analysisIndex < contentIndex
      }
    },
    {
      name: 'should include section type in ENHANCED_CONTENT placeholder',
      test: () => {
        const context = {
          sectionType: 'skills',
          originalContent: 'JavaScript, Python'
        }
        const prompt = mockCreateUserPrompt(context)
        return prompt.includes(`<fully improved ${context.sectionType} section, ready to paste verbatim>`)
      }
    },
    {
      name: 'should not contain old JSON format delimiters',
      test: () => {
        const context = {
          sectionType: 'education',
          originalContent: 'BS Computer Science'
        }
        const prompt = mockCreateUserPrompt(context)
        return !prompt.includes('### OUTPUT (valid JSON)') &&
               !prompt.includes('### END') &&
               !prompt.includes('"enhancedText"') &&
               !prompt.includes('"suggestions"') &&
               !prompt.includes('"changes"')
      }
    },
    {
      name: 'should explicitly mention "no markdown fences"',
      test: () => {
        const context = {
          sectionType: 'projects',
          originalContent: 'E-commerce website'
        }
        const prompt = mockCreateUserPrompt(context)
        return prompt.includes('no markdown fences')
      }
    },
    {
      name: 'should work with empty content',
      test: () => {
        const context = {
          sectionType: 'about',
          originalContent: ''
        }
        const prompt = mockCreateUserPrompt(context)
        return prompt.includes('=== ANALYSIS ===') &&
               prompt.includes('=== ENHANCED_CONTENT ===') &&
               prompt.includes('[Empty - please generate new content]')
      }
    },
    {
      name: 'should work with existing content',
      test: () => {
        const context = {
          sectionType: 'experience',
          originalContent: 'Senior Developer with 5 years experience'
        }
        const prompt = mockCreateUserPrompt(context)
        return prompt.includes('=== ANALYSIS ===') &&
               prompt.includes('=== ENHANCED_CONTENT ===') &&
               prompt.includes('Senior Developer with 5 years experience')
      }
    },
    {
      name: 'should include job description when provided',
      test: () => {
        const context = {
          sectionType: 'summary',
          originalContent: 'Developer',
          jobDescription: 'Looking for React developer with 3+ years experience'
        }
        const prompt = mockCreateUserPrompt(context)
        return prompt.includes('Target job context:') &&
               prompt.includes('Looking for React developer with 3+ years experience') &&
               prompt.includes('=== ANALYSIS ===') &&
               prompt.includes('=== ENHANCED_CONTENT ===')
      }
    },
    {
      name: 'should include custom prompt when provided',
      test: () => {
        const context = {
          sectionType: 'skills',
          originalContent: 'JavaScript',
          customPrompt: 'Focus on full-stack development skills'
        }
        const prompt = mockCreateUserPrompt(context)
        return prompt.includes('Specific enhancement request:') &&
               prompt.includes('Focus on full-stack development skills') &&
               prompt.includes('=== ANALYSIS ===') &&
               prompt.includes('=== ENHANCED_CONTENT ===')
      }
    }
  ]

  tests.forEach((test, index) => {
    try {
      const result = test.test()
      if (result) {
        console.log(`✅ Test ${index + 1}: ${test.name}`)
        passed++
      } else {
        console.log(`❌ Test ${index + 1}: ${test.name}`)
        failed++
      }
    } catch (error) {
      console.log(`💥 Test ${index + 1}: ${test.name} - ERROR: ${error.message}`)
      failed++
    }
  })

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)
  
  if (failed === 0) {
    console.log('🎉 All prompt format tests passed!')
    return true
  } else {
    console.log('⚠️  Some tests failed')
    return false
  }
}

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const success = runPromptFormatTests()
  process.exit(success ? 0 : 1)
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runPromptFormatTests, mockCreateUserPrompt }
}