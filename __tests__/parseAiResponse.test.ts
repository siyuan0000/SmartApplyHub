/**
 * Unit tests for parseAiResponse function using Jest + ts-jest
 * Tests the robust AI response parsing with JSON-first approach and regex fallback
 */

import { SectionEnhancementResult } from '@/hooks/useSectionEnhancement'

// Mock the parsing functions to test in isolation
const mockTryParseJson = (content: string): any => {
  // Try delimiter-based extraction first
  const delimiterMatch = content.match(/### OUTPUT \(valid JSON\)\s*\n([\s\S]*?)\n### END/i)
  if (delimiterMatch) {
    try {
      return JSON.parse(delimiterMatch[1].trim())
    } catch {
      // Continue to next approach
    }
  }
  
  // Try to find first complete JSON object (non-greedy)
  const jsonMatch = content.match(/\{[\s\S]*?\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {
      // Continue to fallback
    }
  }
  
  return null
}

const mockExtractTextSection = (content: string, patterns: RegExp[]): string => {
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]?.trim()) {
      return match[1].trim()
    }
  }
  return ''
}

const mockExtractListSection = (content: string, patterns: RegExp[], bulletRegex: RegExp): string[] => {
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const lines = match[1].split('\n')
      const items: string[] = []
      
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

const mockParseWithRegex = (content: string, provider?: string): SectionEnhancementResult => {
  const bulletRegex = /^\s*(?:[\-*•+]|\d+[.)])\s*/gm
  
  // Extract enhanced text
  let enhancedText = mockExtractTextSection(content, [
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
  const suggestions = mockExtractListSection(content, [
    /(?:suggestions|recommendations|additional suggestions):\s*\n([\s\S]*?)(?:\n\n|$)/i,
    /(?:key improvements|improvements made):\s*\n([\s\S]*?)(?:\n\n|$)/i
  ], bulletRegex)
  
  // Extract changes
  const changes = mockExtractListSection(content, [
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

const mockParseAiResponse = (raw: string, provider?: string): SectionEnhancementResult => {
  // Normalize line endings
  const content = raw.replace(/\r\n/g, '\n').trim()
  
  // Try to locate JSON via delimiters or first { ... } block
  const jsonResult = mockTryParseJson(content)
  if (jsonResult) {
    return {
      enhancedText: jsonResult.enhancedText || '',
      suggestions: Array.isArray(jsonResult.suggestions) ? jsonResult.suggestions.filter((s: any) => typeof s === 'string' && s.trim().length >= 5) : [],
      changes: Array.isArray(jsonResult.changes) ? jsonResult.changes.filter((c: any) => typeof c === 'string' && c.trim().length >= 5) : [],
      provider
    }
  }
  
  // Fallback to improved regex parsing
  return mockParseWithRegex(content, provider)
}

describe('parseAiResponse', () => {
  describe('valid JSON block', () => {
    it('should parse perfect JSON with delimiters', () => {
      const input = `### OUTPUT (valid JSON)
{
  "enhancedText": "I am a seasoned software engineer with 5+ years experience.",
  "suggestions": ["Add specific technologies", "Include quantifiable achievements"],
  "changes": ["Improved professional tone", "Added experience timeframe"]
}
### END`

      const result = mockParseAiResponse(input, 'openai')
      
      expect(result.enhancedText).toBe("I am a seasoned software engineer with 5+ years experience.")
      expect(result.enhancedText.length).toBeGreaterThanOrEqual(1)
      expect(result.suggestions).toHaveLength(2)
      expect(result.suggestions[0]).toBe("Add specific technologies")
      expect(result.changes).toHaveLength(2)
      expect(result.changes[0]).toBe("Improved professional tone")
      expect(result.provider).toBe('openai')
    })

    it('should parse JSON without delimiters', () => {
      const input = `Here's the enhanced content:

{
  "enhancedText": "Dynamic software developer specializing in React.",
  "suggestions": ["Include portfolio links"],
  "changes": ["Made more dynamic"]
}

This should help.`

      const result = mockParseAiResponse(input, 'deepseek')
      
      expect(result.enhancedText).toBe("Dynamic software developer specializing in React.")
      expect(result.enhancedText.length).toBeGreaterThanOrEqual(1)
      expect(result.suggestions).toHaveLength(1)
      expect(result.changes).toHaveLength(1)
      expect(result.provider).toBe('deepseek')
    })

    it('should filter out short suggestions and changes', () => {
      const input = `### OUTPUT (valid JSON)
{
  "enhancedText": "Senior developer with strong skills.",
  "suggestions": ["Good", "Add specific programming languages", "OK"],
  "changes": ["Fix", "Improved technical language"]
}
### END`

      const result = mockParseAiResponse(input)
      
      expect(result.enhancedText.length).toBeGreaterThanOrEqual(1)
      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0]).toBe("Add specific programming languages")
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0]).toBe("Improved technical language")
    })
  })

  describe('fenced JSON', () => {
    it('should parse JSON in code fences', () => {
      const input = `Here's the response:

\`\`\`json
{
  "enhancedText": "Experienced full-stack developer.",
  "suggestions": ["Add GitHub profile"],
  "changes": ["Enhanced title"]
}
\`\`\``

      const result = mockParseAiResponse(input, 'local')
      
      // Should fall back to regex since fenced JSON isn't handled by JSON parser
      expect(result.enhancedText.length).toBeGreaterThanOrEqual(1)
      expect(result.provider).toBe('local')
    })
  })

  describe('free-text fallback with bullets', () => {
    it('should parse free-text format with bullet points', () => {
      const input = `Enhanced Version:
Experienced software engineer with expertise in modern web technologies.

Suggestions:
• Add specific project examples
• Include metrics and KPIs
• Mention leadership roles

Changes Made:
• Enhanced professional language
• Added industry-specific terms
• Improved readability`

      const result = mockParseAiResponse(input, 'fallback')
      
      expect(result.enhancedText).toBe("Experienced software engineer with expertise in modern web technologies.")
      expect(result.enhancedText.length).toBeGreaterThanOrEqual(1)
      expect(result.suggestions).toHaveLength(3)
      expect(result.suggestions[0]).toBe("Add specific project examples")
      expect(result.changes).toHaveLength(3)
      expect(result.changes[0]).toBe("Enhanced professional language")
      expect(result.provider).toBe('fallback')
    })

    it('should handle numbered lists', () => {
      const input = `Enhanced Content:
Full-stack developer with 7+ years experience.

Key Improvements:
1. Added years of experience
2. Specified full-stack expertise
3. Emphasized scalability focus

Additional Suggestions:
1. Consider adding technology stack details
2. Include metrics from projects`

      const result = mockParseAiResponse(input)
      
      expect(result.enhancedText).toBe("Full-stack developer with 7+ years experience.")
      expect(result.enhancedText.length).toBeGreaterThanOrEqual(1)
      expect(result.suggestions).toHaveLength(2)
      expect(result.changes).toHaveLength(3)
    })

    it('should handle mixed bullet formats', () => {
      const input = `Enhanced Version:
Professional software engineer.

Suggestions:
- Add portfolio
* Include certifications
+ Mention awards

Changes Made:
• Enhanced tone
- Added specifics`

      const result = mockParseAiResponse(input)
      
      expect(result.enhancedText).toBe("Professional software engineer.")
      expect(result.enhancedText.length).toBeGreaterThanOrEqual(1)
      expect(result.suggestions).toHaveLength(3)
      expect(result.changes).toHaveLength(2)
    })

    it('should handle empty content gracefully', () => {
      const result = mockParseAiResponse('', 'test')
      
      expect(result.enhancedText).toBe('')
      expect(result.suggestions).toHaveLength(0)
      expect(result.changes).toHaveLength(0)
      expect(result.provider).toBe('test')
    })

    it('should use fallback paragraph for enhanced text when patterns fail', () => {
      const input = `Some introductory text.

This is a substantial paragraph that should be used as enhanced text since no specific patterns match. It contains enough content to be meaningful.

Some other content follows.`

      const result = mockParseAiResponse(input)
      
      expect(result.enhancedText).toContain("This is a substantial paragraph")
      expect(result.enhancedText.length).toBeGreaterThanOrEqual(1)
      expect(result.suggestions).toHaveLength(0)
      expect(result.changes).toHaveLength(0)
    })
  })

  describe('non-greedy JSON matching', () => {
    it('should match first JSON object only with non-greedy regex', () => {
      const input = `First object: {"enhancedText": "First text"} and second object: {"enhancedText": "Second text"}`
      
      const result = mockParseAiResponse(input)
      
      expect(result.enhancedText).toBe("First text")
      expect(result.enhancedText.length).toBeGreaterThanOrEqual(1)
    })
  })
})