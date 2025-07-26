---
allowed-tools: all
description: Execute production-quality implementation
---

# Production Implementation

Implement: $ARGUMENTS

## Required Workflow

1. **Research** - "Let me research the codebase and create a plan before implementing"
2. **Plan** - Present approach for validation
3. **Implement** - Build with continuous validation

For complex architecture decisions: "Let me ultrathink about this architecture"

For tasks with independent parts: Spawn multiple agents in parallel

## Implementation Standards

### Code Evolution

- Replace old code entirely when refactoring
- No versioned function names (processV2, handleNew)
- No compatibility layers or migration code
- This is a feature branch - implement the final solution directly

### Quality Checkpoints

- Run `npm run lint` after every 3 file edits
- Run `npx tsc --noEmit` for type checking
- Test components individually before proceeding
- Validate Supabase interactions work correctly
- Fix all TypeScript and ESLint warnings immediately

### Next.js/React Requirements

- Use TypeScript strict mode, avoid `any` types
- Follow App Router patterns (Server/Client Components)
- Implement proper error boundaries for AI operations
- Use React Hook Form + Zod for form validation
- Ensure Supabase RLS policies protect user data
- Test file upload → OCR → AI parsing pipeline
- Implement proper loading states and error handling
- Use Suspense boundaries for async operations

### General Requirements

- Follow existing codebase patterns
- Use language-appropriate linters at maximum strictness
- Write tests for business logic
- Ensure end-to-end functionality

## Completion Criteria

- `npm run lint` passes with zero warnings
- `npm run build` completes successfully
- TypeScript compilation passes (`npx tsc --noEmit`)
- All React components render without errors
- AI services handle errors gracefully with retry logic
- Supabase operations work with proper RLS enforcement
- File processing pipeline works end-to-end
- No TODOs or temporary code remains
