# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint to check code quality
- `npm start` - Start production server

### Database Setup
- Execute `supabase/schema.sql` in your Supabase project dashboard
- Create a "resumes" storage bucket in Supabase Storage
- Ensure Row Level Security policies are active

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
This is a Next.js 14 app using App Router with a focus on AI-powered resume optimization and job application tracking.

**Core Data Flow:**
1. **File Upload** → Supabase Storage → OCR Processing → Resume Parsing → Database Storage
2. **Resume Editing** → Real-time Updates → Version Control → Active Resume Management
3. **AI Enhancement** → OpenAI API → Resume Analysis → Optimization Suggestions

### Key Architectural Patterns

**Authentication & Security:**
- Supabase Auth with automatic user profile creation via trigger
- Row Level Security (RLS) enforced on all user data tables
- User data isolation through `auth.uid()` checks

**Resume Processing Pipeline:**
1. `ResumeUpload` → `ResumeProcessor` → `OCRProcessor` → `ResumeParser` → Database
2. File stored in Supabase Storage at `{userId}/{timestamp}.{ext}`
3. OCR extracts text using Tesseract.js
4. Parser extracts structured data (contact, experience, education, skills)
5. Content stored as JSONB in `resumes.content`

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
{
  contact: { name, email, phone, location, linkedin, github },
  summary: string,
  experience: [{ company, title, duration, description, achievements }],
  education: [{ institution, degree, field, duration, gpa }],
  skills: { technical: [], soft: [], languages: [] },
  projects: [{ name, description, technologies, url }]
}
```

### File Processing Architecture

**Upload Flow:**
- `ResumeUpload` (drag/drop) → `ResumeProcessor` (orchestration) → `OCRProcessor` (text extraction) → `ResumeParser` (structured parsing)
- Files validated for type (PDF/DOC/DOCX) and size (max 10MB)
- Storage uses user-specific paths for security

**OCR Processing:**
- PDF text extraction attempted first
- Tesseract.js OCR fallback for image-based content
- Worker cleanup to prevent memory leaks

**Resume Parsing:**
- Regex-based extraction for contact info, dates, sections
- Experience parsing with company/title/duration extraction
- Education parsing with institution/degree/field extraction
- Skills extraction supporting various formats

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

**Planned AI Features:**
- Resume analysis and scoring
- ATS compatibility checking
- Section-specific content enhancement
- Job-specific keyword optimization
- Cover letter generation

**Implementation Pattern:**
- AI services in `lib/ai/` directory
- OpenAI API integration with error handling
- Results stored in `ai_reviews` table
- UI integration through existing "AI Enhance" buttons

### Development Notes

**Common Issues to Watch:**
- OCR processing can be memory-intensive, ensure proper worker cleanup
- PDF parsing may fail on complex layouts, implement fallback strategies
- Supabase RLS policies must be properly configured for user data access
- File upload size limits enforced both client and server-side

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