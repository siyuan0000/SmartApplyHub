# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint to check code quality
- `npm start` - Start production server
- `npm run import-jobs` - Import job data from external sources
- `npm run verify-import` - Verify job import integrity

### Database Setup
- Execute `supabase/schema.sql` in your Supabase project dashboard
- Create a "resumes" storage bucket in Supabase Storage with public access
- Enable UUID extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
- Apply all Row Level Security (RLS) policies from schema.sql
- Set up automatic timestamp triggers for `updated_at` columns

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture Overview

### Application Structure
This is a Next.js 15 app using App Router with a focus on AI-powered resume optimization and job application tracking. The app is built with TypeScript and uses modern React patterns including hooks and context providers.

**Technology Stack:**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Shadcn/UI
- **State**: Zustand (UI state), React Query/TanStack Query (server state)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **AI**: OpenAI GPT-4 API for resume analysis and optimization
- **File Processing**: Tesseract.js (OCR), PDF.js, Mammoth (DOCX)

**Core Data Flow:**
1. **File Upload** → Supabase Storage → OCR Processing (Tesseract.js/PDF.js) → AI Structure Analysis → Resume Parsing → Database Storage
2. **Resume Editing** → Real-time Updates → Version Control → Active Resume Management
3. **AI Enhancement** → OpenAI API → Resume Analysis → Optimization Suggestions
4. **Job Matching** → AI Analysis → Keyword Extraction → Application Tracking

### Key Architectural Patterns

**Authentication & Security:**
- Supabase Auth with automatic user profile creation via trigger
- Row Level Security (RLS) enforced on all user data tables
- User data isolation through `auth.uid()` checks

**Resume Processing Pipeline:**
1. `ResumeUpload` → `ResumeProcessor` → `OCRProcessor` → AI Structure Analysis → Database
2. File stored in Supabase Storage at `{userId}/{timestamp}.{ext}`
3. OCR extracts text using Tesseract.js (with PDF.js for PDFs)
4. AI analyzes and structures content using OpenAI API
5. Content stored as JSONB in `resumes.content` with typed interfaces
6. Processing includes validation and error handling with user feedback

**State Management:**
- Zustand for lightweight client state
- React Query for server state and caching
- Form state managed with React Hook Form + Zod validation

### Database Schema Key Points

**Core Tables:**
- `users` - Extended auth.users with profile data
- `resumes` - JSONB content storage with versioning
- `job_applications` - Application tracking with status workflow
- `ai_reviews` - AI analysis results and feedback
- `application_templates` - Cover letter templates

**Important Relationships:**
- Users own multiple resumes (one active at a time)
- Resumes have version control and can be duplicated
- Job applications link to job postings and track status progression
- AI reviews are linked to specific resumes and users

### Resume Content Structure (JSONB)
```typescript
interface ResumeContent {
  contact: {
    name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    website?: string
  }
  summary?: string
  experience: Array<{
    title: string
    company: string
    location?: string
    startDate?: string
    endDate?: string
    current?: boolean
    description?: string
    achievements?: string[]
  }>
  education: Array<{
    degree: string
    school: string
    location?: string
    graduationDate?: string
    gpa?: string
    honors?: string[]
  }>
  skills: string[]
  projects?: Array<{
    name: string
    description: string
    details?: string[]
    technologies?: string[]
    url?: string
    startDate?: string
    endDate?: string
  }>
  certifications?: string[]
  languages?: string[]
  raw_text: string
}
```

### File Processing Architecture

**Upload Flow:**
- `ResumeUpload` (drag/drop) → `ResumeProcessor` (orchestration) → `OCRProcessor` (text extraction) → AI Structure Analysis → Database
- Files validated for type (PDF/DOC/DOCX) and size (max 10MB)
- Storage uses user-specific paths for security
- Multi-step processing with progress indicators and error handling

**OCR Processing:**
- PDF text extraction attempted first
- Tesseract.js OCR fallback for image-based content
- Worker cleanup to prevent memory leaks

**AI Structure Analysis:**
- OpenAI API integration for intelligent content parsing
- Structured data extraction with proper typing
- Validation and error handling for incomplete data
- Fallback parsing methods for edge cases

### Component Architecture

**Page Structure:**
- `/app/resumes/page.tsx` - Resume management dashboard
- `/app/resumes/[id]/page.tsx` - Individual resume editor
- `/app/dashboard/page.tsx` - Main application dashboard

**Key Components:**
- `ResumeEditor` - Section-based editing with navigation
- `ResumeUpload` - File upload with validation
- `ResumeProcessor` - Upload orchestration
- `ResumeList` - Resume management with actions

### AI Integration Points

**Current AI Features:**
- Resume structure analysis and parsing using OpenAI API
- Intelligent content extraction from uploaded files
- Custom AI hooks (`useAI`) for reusable AI functionality

**AI Service Architecture (lib/ai/):**
- `base-service.ts` - Base class for all AI services
- `resume-parser.ts` - Extracts structured data from raw text
- `resume-analyzer.ts` - Analyzes resume quality and provides feedback
- `ats-analyzer.ts` - Checks ATS compatibility
- `content-enhancer.ts` - Enhances resume content sections
- `keyword-suggester.ts` - Suggests relevant keywords for jobs
- `openai.ts` - OpenAI client configuration

**Implementation Pattern:**
- Modular AI services extending BaseAIService class
- Custom hooks in `hooks/useAI.ts` for component integration
- Error handling with retry logic and fallback strategies
- Results stored in `ai_reviews` table with typed feedback
- UI integration through "AI Enhance" buttons in components

### Development Notes

**Common Issues to Watch:**
- OCR processing can be memory-intensive, ensure proper worker cleanup in `OCRProcessor`
- PDF parsing may fail on complex layouts, AI parsing provides better fallback
- Supabase RLS policies must be properly configured for user data access
- File upload size limits enforced both client and server-side (max 10MB)
- OpenAI API rate limits and error handling in AI processing
- Mammoth.js for DOCX processing requires proper error handling

**Testing Strategy:**
- Test complete upload → OCR → parsing → editing workflow
- Verify resume version control and active resume management
- Test AI integration with proper error handling
- Validate RLS policies prevent unauthorized data access

**Performance Considerations:**
- Large resume files may cause OCR processing delays
- JSONB queries should use proper indexing for performance
- React Query caching reduces redundant API calls
- File upload progress indicators improve UX

### Directory Structure

```
smart_apply/
├── app/                     # Next.js App Router pages
│   ├── (auth)/             # Authentication pages (login/signup)
│   ├── dashboard/          # Main dashboard
│   ├── resumes/            # Resume management and editing
│   ├── jobs/               # Job search and listings
│   ├── applications/       # Application tracking
│   ├── ai-review/          # AI-powered resume analysis
│   ├── templates/          # Cover letter templates
│   └── settings/           # User settings
├── components/             # Reusable components
│   ├── ui/                 # Shadcn/UI components
│   ├── layout/             # Layout components (Header, Footer)
│   └── providers/          # React context providers
├── lib/                    # Core utilities
│   ├── ai/                 # AI service modules
│   ├── supabase/           # Supabase client configuration
│   └── utils/              # Helper functions
├── hooks/                  # Custom React hooks
├── store/                  # Zustand state stores
├── types/                  # TypeScript type definitions
└── supabase/               # Database schema and migrations
```

### Key Architectural Decisions

**TypeScript Path Aliases:**
- Use `@/*` imports for absolute imports from project root
- Example: `import { Button } from "@/components/ui/button"`

**Component Patterns:**
- Server Components by default for better performance
- Client Components marked with `"use client"` only when needed
- Suspense boundaries for async data loading

**Data Fetching Strategy:**
- Server Components for initial data loads
- React Query for client-side data fetching and mutations
- Optimistic updates for better UX

**Error Handling:**
- Comprehensive try-catch blocks in async operations
- User-friendly error messages via toast notifications
- Fallback UI components for error states

**Form Handling:**
- React Hook Form for complex forms
- Zod schemas for validation
- Server actions for form submissions where applicable