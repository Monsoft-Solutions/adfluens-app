---
name: monorepo-patterns
description: Guide Turborepo and pnpm workspace development with cross-package imports and build patterns. Use when working across packages or configuring the monorepo.
allowed-tools: Read, Glob, Grep, Bash
---

# Monorepo Patterns Guide

This skill provides guidance for Turborepo + pnpm workspace development in the YouTube Channel Analyzer project.

## Project Structure

```
youtube-channel-analyzer/
├── apps/
│   ├── api/              # Express + tRPC backend
│   └── web/              # React + Vite frontend
├── packages/
│   ├── ai/               # @monsoft/ai - AI utilities (publishable)
│   ├── scraper/          # @monsoft/scraper - Scrapers (publishable)
│   ├── auth/             # @repo/auth - Better Auth
│   ├── db/               # @repo/db - Drizzle ORM
│   ├── env/              # @repo/env - Environment variables
│   ├── types/            # @repo/types - Shared types
│   ├── ui/               # @repo/ui - Component library
│   ├── media-storage/    # @repo/media-storage - GCS
│   ├── tailwind-config/  # @repo/tailwind-config
│   └── eslint-config/    # @repo/eslint-config
├── turbo.json            # Turborepo config
├── pnpm-workspace.yaml   # Workspace config
└── package.json          # Root package
```

## Package Naming

| Package              | Name              | Scope                   |
| -------------------- | ----------------- | ----------------------- |
| Internal packages    | `@repo/[name]`    | Private, workspace only |
| Publishable packages | `@monsoft/[name]` | Public npm              |

## CRITICAL: Import Rules

### No Barrel Imports (except @repo/ui)

```typescript
// CORRECT - Direct imports
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";
import { db } from "@repo/db";
import { channelTable } from "@repo/db/schema";

// WRONG - Barrel imports
import type { YouTubeVideo } from "@repo/types";
import { db, channelTable } from "@repo/db";
```

### Exception: @repo/ui Uses Barrels

```typescript
// This is correct for UI components
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
```

## Adding Dependencies

### To a Specific Package

```bash
# Add to apps/web
pnpm add react-hook-form --filter web

# Add to packages/db
pnpm add drizzle-orm --filter @repo/db

# Add dev dependency
pnpm add -D typescript --filter @repo/types
```

### Workspace Dependencies

```bash
# Add internal package as dependency
pnpm add @repo/types --filter web --workspace
```

In `package.json`:

```json
{
  "dependencies": {
    "@repo/types": "workspace:*"
  }
}
```

## Common Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix lint issues
pnpm type-check       # TypeScript checking
pnpm format           # Prettier format

# Filtering
pnpm --filter web dev         # Run dev for web only
pnpm --filter api build       # Build api only
pnpm --filter "@repo/*" build # Build all packages

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema (dev)
pnpm db:studio        # Drizzle Studio
```

## Turborepo Configuration

### turbo.json

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

Key concepts:

- `^build`: Run build in dependencies first
- `outputs`: Cache these directories
- `persistent`: Long-running tasks (dev servers)

## Creating a New Package

### Internal Package (@repo/\*)

```bash
# Create directory
mkdir -p packages/new-package/src

# Create package.json
cat > packages/new-package/package.json << 'EOF'
{
  "name": "@repo/new-package",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.0.0"
  }
}
EOF

# Create tsconfig.json
cat > packages/new-package/tsconfig.json << 'EOF'
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
EOF

# Install dependencies
pnpm install
```

### Publishable Package (@monsoft/\*)

Uses `tsup` for building:

```json
{
  "name": "@monsoft/new-package",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  }
}
```

## TypeScript Configuration

### Base Config (packages/typescript-config)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

### Package Extends

```json
{
  "extends": "@repo/typescript-config/base.json"
}
```

## Environment Variables

Using `@repo/env`:

```typescript
// packages/env/src/index.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    OPENAI_API_KEY: z.string().min(1),
  },
  client: {
    VITE_API_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
```

## Best Practices

1. **Use workspace:\*** for internal dependencies
2. **Import directly** from source files (no barrels)
3. **Run type-check** before committing
4. **Use Turborepo caching** for faster builds
5. **Filter commands** when working on specific packages
6. **Keep packages focused** on single responsibility
