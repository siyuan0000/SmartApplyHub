# AI Services Module

This directory contains modular AI services for resume processing and analysis.

## Structure

### Core Services

- **`base-service.ts`** - Base OpenAI service with shared configuration and validation
- **`resume-parser.ts`** - Converts raw resume text to structured JSON
- **`resume-analyzer.ts`** - Analyzes resume quality and provides feedback
- **`ats-analyzer.ts`** - Evaluates ATS (Applicant Tracking System) compatibility
- **`content-enhancer.ts`** - Improves resume section content quality
- **`keyword-suggester.ts`** - Generates keyword suggestions for optimization

### Entry Points

- **`index.ts`** - Main export file for all services
- **`openai.ts`** - Legacy compatibility layer (maintains backward compatibility)

## Usage

### Import Individual Services

```typescript
import { ResumeParserService } from '@/lib/ai/resume-parser'
import { ResumeAnalyzerService } from '@/lib/ai/resume-analyzer'
import { ATSAnalyzerService } from '@/lib/ai/ats-analyzer'
import { ContentEnhancerService } from '@/lib/ai/content-enhancer'
import { KeywordSuggesterService } from '@/lib/ai/keyword-suggester'
```

### Import from Index

```typescript
import { 
  ResumeParserService,
  ResumeAnalyzerService,
  ATSAnalyzerService,
  ContentEnhancerService,
  KeywordSuggesterService
} from '@/lib/ai'
```

### Legacy Compatibility

```typescript
import { OpenAIService } from '@/lib/ai/openai'

// All existing methods still work
const result = await OpenAIService.analyzeResume(resumeContent)
```

## Service Descriptions

### ResumeParserService
- **Purpose**: Converts raw resume text to structured JSON
- **Method**: `parseResumeStructure(rawText: string)`
- **Returns**: `ResumeContent` object

### ResumeAnalyzerService
- **Purpose**: Evaluates resume quality and provides comprehensive feedback
- **Method**: `analyzeResume(resumeContent: object)`
- **Returns**: `AIAnalysisResult` with score, feedback, and suggestions

### ATSAnalyzerService
- **Purpose**: Analyzes resume for ATS compatibility and keyword optimization
- **Method**: `analyzeATS(resumeContent: object, jobDescription?: string)`
- **Returns**: `ATSAnalysisResult` with compatibility score and keyword analysis

### ContentEnhancerService
- **Purpose**: Improves resume section content quality
- **Method**: `enhanceSection(sectionType: string, content: string, jobDescription?: string)`
- **Returns**: `ContentEnhancementResult` with enhanced text and improvements

### KeywordSuggesterService
- **Purpose**: Generates keyword suggestions for resume optimization
- **Method**: `generateKeywordSuggestions(resumeContent: object, jobDescription: string)`
- **Returns**: Array of suggested keywords

## Benefits of Modular Structure

1. **Separation of Concerns**: Each service handles a specific task
2. **Maintainability**: Easier to update and debug individual services
3. **Reusability**: Services can be used independently
4. **Testing**: Each service can be tested in isolation
5. **Backward Compatibility**: Existing code continues to work unchanged 