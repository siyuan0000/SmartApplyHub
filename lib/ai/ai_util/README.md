# AI Utilities

This folder contains modular AI utility functions that were extracted from the main `route2all.ts` file to provide better organization and maintainability.

## Overview

The AI utilities are designed to work with the core `AIRouter` class and provide specific functionality for common AI tasks like resume parsing, content enhancement, and cover letter generation.

## Available Utilities

### ResumeParser

Handles resume-related AI operations:

```typescript
import { ResumeParser } from '@/lib/ai/ai_util'

// Parse raw resume text
const parsedResume = await ResumeParser.parseResume(rawText)

// Analyze existing resume content
const analysis = await ResumeParser.analyzeResume(resumeContent)

// Generate template about section when AI fails
const templateAbout = ResumeParser.generateTemplateAbout(userMessage)
```

### ContentEnhancer

Manages content enhancement operations:

```typescript
import { ContentEnhancer } from '@/lib/ai/ai_util'

// Enhance content with optional job context
const enhanced = await ContentEnhancer.enhanceContent(content, jobDescription)

// Check if a message is an enhancement request
const isEnhancement = ContentEnhancer.isEnhancementRequest(userMessage)

// Generate fallback enhancement when AI fails
const fallback = ContentEnhancer.generateEnhancementFallback(userMessage, error)
```

### CoverLetterGenerator

Handles cover letter generation:

```typescript
import { CoverLetterGenerator } from '@/lib/ai/ai_util'

// Basic cover letter generation
const coverLetter = await CoverLetterGenerator.generateCoverLetter(resume, jobDesc)

// Targeted cover letter with focus areas
const targeted = await CoverLetterGenerator.generateTargetedCoverLetter(
  resume, 
  jobDesc, 
  ['leadership', 'technical skills']
)

// Company-specific cover letter
const companySpecific = await CoverLetterGenerator.generateCompanySpecificCoverLetter(
  resume, 
  jobDesc, 
  'Company Name',
  'Company information...'
)
```

## Usage Pattern

All utilities follow a consistent pattern:

1. **Static methods**: All methods are static for easy access
2. **AI routing**: They use the core `route2all` function for AI requests
3. **Fallback support**: Include fallback generation when AI services fail
4. **Type safety**: Full TypeScript support with proper typing

## Benefits of This Structure

- **Separation of concerns**: Core routing logic is separate from specific AI tasks
- **Maintainability**: Easier to modify individual utilities without affecting others
- **Testability**: Each utility can be tested independently
- **Reusability**: Utilities can be imported and used in different parts of the application
- **Extensibility**: Easy to add new utilities without modifying core routing code

## Adding New Utilities

To add a new utility:

1. Create a new file in the `ai_util` folder
2. Export a class with static methods
3. Use the `route2all` function for AI requests
4. Add the export to `ai_util/index.ts`
5. Update this README with usage examples

## Dependencies

- `../types` - AI type definitions
- `../route2all` - Core routing functionality
- All utilities depend on the main `AIRouter` class for actual AI operations

