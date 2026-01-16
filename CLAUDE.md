# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube Channel Analyzer - A full-stack AI-powered application that analyzes YouTube channels and videos to uncover viral strategies and content ideas.

## Commands

```bash
# Development
pnpm dev              # Start api (localhost:3001) + web (localhost:3000)
pnpm build            # Build all packages via Turborepo
pnpm lint             # Lint all packages
pnpm lint:fix         # Auto-fix lint issues
pnpm type-check       # TypeScript checking across monorepo
pnpm format           # Format with Prettier

# Database (Drizzle ORM)
pnpm db:generate      # Generate SQL migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly (dev only)
pnpm db:studio        # Open Drizzle Studio GUI

# Package Publishing
pnpm changeset        # Create version change file
pnpm version-packages # Bump versions
pnpm release          # Build and publish packages
```

## Architecture

### Monorepo Structure (Turborepo + pnpm)

```
apps/
├── api/              # Express + tRPC backend
│   └── src/features/ # Feature-based routers & services
└── web/              # React 19 + Vite frontend
    └── src/features/ # Feature-based views, components & utils

packages/
├── ai/               # @monsoft/ai - AI utilities (publishable, tsup)
├── scraper/          # @monsoft/scraper - Social media scrapers (publishable)
├── auth/             # @repo/auth - Better Auth with OAuth
├── db/               # @repo/db - Drizzle ORM + PostgreSQL
├── env/              # @repo/env - Typed env vars (t3-oss/env-core)
├── logger/           # @repo/logger - Winston structured logging
├── types/            # @repo/types - Shared types with Zod schemas
├── ui/               # @repo/ui - shadcn/ui component library
├── media-storage/    # @repo/media-storage - Google Cloud Storage
├── tailwind-config/  # @repo/tailwind-config - Tailwind v4 config
└── eslint-config/    # @repo/eslint-config - Shared ESLint
```

### Tech Stack

- **Frontend**: React 19, Vite, TanStack Query v5, React Router v7, Tailwind CSS v4
- **Backend**: Express v5, tRPC v11, Better Auth
- **Database**: PostgreSQL via Drizzle ORM
- **AI**: Vercel AI SDK, OpenAI, Google Genai, Langfuse telemetry
- **Build**: Turborepo, tsup (for publishable packages)

## Key Patterns

### No Barrel Files Policy

Import types directly from source files, NOT from index.ts re-exports:

```typescript
// Correct
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";

// Wrong
import type { YouTubeVideo } from "@repo/types";
```

**Exception**: `@repo/ui` uses barrel exports (standard component library pattern).

### tRPC Client Usage

**In React components** (declarative with TanStack Query):

```typescript
const trpc = useTRPC();
const { data } = useQuery(trpc.feature.getData.queryOptions({ id }));
```

**In utils/event handlers** (imperative):

```typescript
import { trpcClient } from "@/lib/trpc";
const result = await trpcClient.feature.getData.query({ id });
```

### Feature-Based Architecture

Backend:

- `apps/api/src/features/[name]/[name].router.ts` - tRPC procedures
- `apps/api/src/features/[name]/[name].service.ts` - Business logic

Frontend:

- `apps/web/src/features/[name]/views/` - Route-level components
- `apps/web/src/features/[name]/components/` - Feature UI
- `apps/web/src/features/[name]/utils/` - Imperative logic

### Database Table Naming

```typescript
// Table variable: camelCase + Table suffix
export const organizationProfileTable = pgTable(...)

// Types: PascalCase with Row/Insert suffix
export type OrganizationProfileRow = typeof organizationProfileTable.$inferSelect
export type OrganizationProfileInsert = typeof organizationProfileTable.$inferInsert
```

## File Naming Conventions

| Type       | Pattern                | Example                         |
| ---------- | ---------------------- | ------------------------------- |
| Components | `[name].component.tsx` | `video-card.component.tsx`      |
| Views      | `[name].view.tsx`      | `channel-analyzer.view.tsx`     |
| Services   | `[name].service.ts`    | `youtube.service.ts`            |
| Routers    | `[name].router.ts`     | `youtube.router.ts`             |
| Types      | `[name].type.ts`       | `youtube-video.type.ts`         |
| Enums      | `[name].enum.ts`       | `video-sort-option.enum.ts`     |
| Tables     | `[name].table.ts`      | `organization-profile.table.ts` |
| Utilities  | `[name].utils.ts`      | `youtube.utils.ts`              |
| Hooks      | `use-[name].hook.ts`   | `use-video-player.hook.ts`      |

## Styling Rules

- Use semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`
- Never hardcode colors, fonts, or spacing values
- Import components from `@repo/ui`
- Use `cn()` for conditional class merging
- Adding shadcn components: `cd packages/ui && pnpm dlx shadcn@latest add [component]`

## TypeScript Rules

- Never use `any` - use `unknown` when type is truly unknown
- Prefer `type` over `interface`
- Use type imports: `import type { ... }`
- Boolean vars: prefix with `is`, `has`, `can`, `should`
- Event handlers: prefix with `handle` or `on`

## Logging (@repo/logger)

Use structured logging for all backend services. Log important business logic with `info` level.

```typescript
import { Logger } from "@repo/logger";

const logger = new Logger({ context: "feature-name" });

// Log important business events
logger.info("User completed action", { userId, actionType });

// Log errors with context
logger.error("Operation failed", error, { operationId });

// Log warnings for recoverable issues
logger.warn("Rate limit approaching", { currentRate, limit });

// Debug for development
logger.debug("Processing payload", { payload });
```

### Log Level Guidelines

| Level   | When to Use                                   |
| ------- | --------------------------------------------- |
| `error` | Unrecoverable failures, exceptions            |
| `warn`  | Recoverable issues, rate limits, deprecations |
| `info`  | Important business events, state changes      |
| `debug` | Development details, variable values          |

### When to Log

- **Always log**: Service method entry/exit for important operations, errors with context, webhook receipts, background job progress
- **Use `info`**: User actions, business events, state transitions, API calls to external services
- **Never log**: Passwords, tokens, PII, or sensitive data

## AI Package (@monsoft/ai)

Core functions with Langfuse telemetry:

- `coreGenerateObject` - Structured outputs with Zod schemas
- `coreGenerateText` - Text generation
- `coreStreamText` - Streaming responses
- `coreStreamObject` - Streaming structured outputs

Export paths: `@monsoft/ai`, `@monsoft/ai/core`, `@monsoft/ai/functions`, `@monsoft/ai/schemas`, `@monsoft/ai/models`, `@monsoft/ai/prompts`

## Git Conventions

Conventional commits enforced: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`, `chore:`, `revert:`

Pre-commit: ESLint + Prettier on staged files
Pre-push: TypeScript type checking
