---
allowed-tools: all
description: Verify code quality and fix all issues
---

# Code Quality Check

Fix all issues found during quality verification. Do not just report problems.

## Workflow

1. **Identify** - Run all validation commands
2. **Fix** - Address every issue found
3. **Verify** - Re-run until all checks pass

## Validation Commands

Find and run all applicable commands:

- **Lint**: `npm run lint` - ESLint code quality checks
- **Type Check**: `npx tsc --noEmit` - TypeScript type validation
- **Build**: `npm run build` - Next.js production build
- **Format**: `npx prettier --check .` - Code formatting validation
- **Security**: `npm audit` - Dependency vulnerability scan
- **Database**: Validate Supabase schema and RLS policies

## Parallel Fixing Strategy

When multiple issues exist, spawn agents to fix in parallel:

```
Agent 1: Fix linting issues in module A
Agent 2: Fix test failures
Agent 3: Fix type errors
```

## Next.js/TypeScript Standards

- Use proper TypeScript types, avoid `any`
- Follow Next.js App Router patterns (Server/Client Components)
- Validate Supabase RLS policies for data security
- Test AI service error handling and retry logic
- Ensure OCR worker cleanup to prevent memory leaks
- Validate file upload size limits (max 10MB)
- Test resume processing pipeline end-to-end

## Success Criteria

All validation commands pass with zero warnings or errors.
