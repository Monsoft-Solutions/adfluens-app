Create a new full-stack feature for the YouTube Channel Analyzer project.

Feature name: $ARGUMENTS

## Instructions

1. **Clarify requirements** - Ask about:
   - What data does this feature handle?
   - Does it need database storage?
   - What API endpoints are needed?
   - What UI components are required?

2. **Create types first** in `packages/types/`:
   - Define Zod schemas
   - Export TypeScript types
   - File: `packages/types/[feature]/[feature].type.ts`

3. **Create database schema** (if needed) in `packages/db/src/schema/`:
   - Define table with proper naming
   - Add relations if needed
   - Export Row/Insert types
   - Run `pnpm db:generate`

4. **Create backend** in `apps/api/src/features/[feature]/`:
   - `[feature].router.ts` - tRPC procedures
   - `[feature].service.ts` - Business logic
   - Register router in main app router

5. **Create frontend** in `apps/web/src/features/[feature]/`:
   - `views/[feature].view.tsx` - Route component
   - `components/` - Feature-specific UI
   - Add route in router config

6. **Verify**:
   - Run `pnpm type-check`
   - Run `pnpm lint`
   - Test the feature manually

## Project Patterns

- Import types directly (no barrel files): `import type { X } from "@repo/types/feature/feature.type"`
- Use `useTRPC()` hook for data fetching in components
- Use `trpcClient` for imperative calls in utils
- Use shadcn/ui components from `@repo/ui`
- Use semantic Tailwind tokens: `bg-background`, `text-foreground`
