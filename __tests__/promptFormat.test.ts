/**
 * Unit tests for prompt format validation
 * Tests that the new prompt contains the required delimiters for streaming mode
 */

// Mock the createUserPrompt function from useSectionEnhancement
const mockCreateUserPrompt = (context: {
  sectionType: string
  originalContent: string
  customPrompt?: string
  jobDescription?: string
}) => {
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

describe('Prompt Format', () => {
  describe('Required delimiters', () => {
    it('should contain === ANALYSIS === delimiter', () => {
      const context = {
        sectionType: 'experience',
        originalContent: 'Software Engineer at Tech Corp'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toContain('=== ANALYSIS ===')
    })

    it('should contain === ENHANCED_CONTENT === delimiter', () => {
      const context = {
        sectionType: 'experience',
        originalContent: 'Software Engineer at Tech Corp'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toContain('=== ENHANCED_CONTENT ===')
    })

    it('should have both delimiters in correct order', () => {
      const context = {
        sectionType: 'summary',
        originalContent: 'I am a developer'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      const analysisIndex = prompt.indexOf('=== ANALYSIS ===')
      const contentIndex = prompt.indexOf('=== ENHANCED_CONTENT ===')
      
      expect(analysisIndex).toBeGreaterThan(-1)
      expect(contentIndex).toBeGreaterThan(-1)
      expect(analysisIndex).toBeLessThan(contentIndex)
    })

    it('should include section type in ENHANCED_CONTENT placeholder', () => {
      const context = {
        sectionType: 'skills',
        originalContent: 'JavaScript, Python'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toContain(`<fully improved ${context.sectionType} section, ready to paste verbatim>`)
    })

    it('should not contain old JSON format delimiters', () => {
      const context = {
        sectionType: 'education',
        originalContent: 'BS Computer Science'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).not.toContain('### OUTPUT (valid JSON)')
      expect(prompt).not.toContain('### END')
      expect(prompt).not.toContain('"enhancedText"')
      expect(prompt).not.toContain('"suggestions"')
      expect(prompt).not.toContain('"changes"')
    })

    it('should explicitly mention "no markdown fences"', () => {
      const context = {
        sectionType: 'projects',
        originalContent: 'E-commerce website'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toContain('no markdown fences')
    })
  })

  describe('Empty vs Non-empty content', () => {
    it('should work with empty content', () => {
      const context = {
        sectionType: 'about',
        originalContent: ''
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toContain('=== ANALYSIS ===')
      expect(prompt).toContain('=== ENHANCED_CONTENT ===')
      expect(prompt).toContain('[Empty - please generate new content]')
    })

    it('should work with existing content', () => {
      const context = {
        sectionType: 'experience',
        originalContent: 'Senior Developer with 5 years experience'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toContain('=== ANALYSIS ===')
      expect(prompt).toContain('=== ENHANCED_CONTENT ===')
      expect(prompt).toContain('Senior Developer with 5 years experience')
    })
  })

  describe('Additional context handling', () => {
    it('should include job description when provided', () => {
      const context = {
        sectionType: 'summary',
        originalContent: 'Developer',
        jobDescription: 'Looking for React developer with 3+ years experience'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toContain('Target job context:')
      expect(prompt).toContain('Looking for React developer with 3+ years experience')
      expect(prompt).toContain('=== ANALYSIS ===')
      expect(prompt).toContain('=== ENHANCED_CONTENT ===')
    })

    it('should include custom prompt when provided', () => {
      const context = {
        sectionType: 'skills',
        originalContent: 'JavaScript',
        customPrompt: 'Focus on full-stack development skills'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toContain('Specific enhancement request:')
      expect(prompt).toContain('Focus on full-stack development skills')
      expect(prompt).toContain('=== ANALYSIS ===')
      expect(prompt).toContain('=== ENHANCED_CONTENT ===')
    })

    it('should handle both job description and custom prompt', () => {
      const context = {
        sectionType: 'experience',
        originalContent: 'Software Engineer',
        jobDescription: 'Senior Full-stack position',
        customPrompt: 'Emphasize leadership experience'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toContain('Target job context:')
      expect(prompt).toContain('Senior Full-stack position')
      expect(prompt).toContain('Specific enhancement request:')
      expect(prompt).toContain('Emphasize leadership experience')
      expect(prompt).toContain('=== ANALYSIS ===')
      expect(prompt).toContain('=== ENHANCED_CONTENT ===')
    })
  })

  describe('Prompt structure validation', () => {
    it('should end with the format instruction block', () => {
      const context = {
        sectionType: 'contact',
        originalContent: 'John Doe, john@email.com'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      expect(prompt).toMatch(/###\s*$/m)
    })

    it('should have proper format instruction structure', () => {
      const context = {
        sectionType: 'projects',
        originalContent: 'Web application'
      }
      
      const prompt = mockCreateUserPrompt(context)
      
      // Should contain the format instruction block
      expect(prompt).toContain('Output *exactly* in this format')
      expect(prompt).toContain('<bullet-point analysis of current content (or of empty state)>')
      expect(prompt).toContain('<fully improved projects section, ready to paste verbatim>')
    })
  })
})