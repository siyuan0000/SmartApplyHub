# AI Provider Configuration

## Overview

The application now supports both DeepSeek and OpenAI as AI providers with automatic prioritization.

## Priority Order

1. **DeepSeek API** (if `DEEPSEEK_API_KEY` is set)
2. **OpenAI API** (if `OPENAI_API_KEY` is set)

## Environment Variables

Add these to your `.env.local` file:

```bash
# DeepSeek API (Priority 1)
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# OpenAI API (Priority 2 - fallback)
OPENAI_API_KEY=sk-your-openai-api-key
```

## Provider Detection

The system automatically detects which provider to use when the application starts. You can check the current provider by:

1. **API Endpoint**: `GET /api/ai/provider-info`
2. **Dashboard Component**: `AIProviderInfo` component shows current status

## Model Configuration

### DeepSeek
- **Model**: `deepseek-chat`
- **Base URL**: `https://api.deepseek.com`
- **Features**: Higher token limits, optimized for analysis tasks

### OpenAI
- **Model**: `gpt-4`
- **Base URL**: Default OpenAI endpoint
- **Features**: Proven reliability, extensive fine-tuning

## Optimizations

### Task-Specific Temperature Settings

- **Parsing Tasks** (Resume parsing): Lower temperature for deterministic results
  - DeepSeek: 0.1
  - OpenAI: 0.2

- **Analysis Tasks** (Resume analysis, ATS scoring): Balanced temperature
  - DeepSeek: 0.3
  - OpenAI: 0.5

- **Generation Tasks** (Email generation, content enhancement): Higher temperature for creativity
  - DeepSeek: 0.7
  - OpenAI: 0.7

### Token Management

- **DeepSeek**: Higher token limits (up to 4000 tokens)
- **OpenAI**: Standard GPT-4 limits (up to 2000 tokens)

## API Response Format

```json
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "status": "active",
  "message": "Using deepseek with model deepseek-chat"
}
```

## Error Handling

If no API keys are configured, the system will return:

```json
{
  "provider": "unknown",
  "model": "unknown", 
  "status": "error",
  "error": "No AI API key found. Please set DEEPSEEK_API_KEY or OPENAI_API_KEY environment variable.",
  "message": "No AI provider configured"
}
```

## Migration from OpenAI-only

All existing AI services have been updated to use the new unified `AIService` class:

- ✅ `ResumeParserService` 
- ✅ `ResumeAnalyzerService`
- ✅ `ATSAnalyzerService`
- ✅ `ContentEnhancerService`
- ✅ `KeywordSuggesterService` 
- ✅ `EmailGeneratorService`

No code changes are required in components or API routes - the transition is transparent.

## Testing

1. **Set DeepSeek API key** in `.env.local`
2. **Restart the development server**
3. **Check provider info** at `/api/ai/provider-info`
4. **Test any AI feature** (resume parsing, email generation, etc.)

The system will automatically use DeepSeek if the API key is available, otherwise fall back to OpenAI.