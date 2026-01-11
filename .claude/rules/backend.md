---
paths: apps/api/**/*.ts
---

# Backend Development Rules

These rules apply when editing backend code in `apps/api/`.

## File Organization

```
apps/api/src/features/[name]/
├── [name].router.ts      # tRPC procedures
└── [name].service.ts     # Business logic
```

## File Naming

| Type     | Pattern             | Example              |
| -------- | ------------------- | -------------------- |
| Routers  | `[name].router.ts`  | `youtube.router.ts`  |
| Services | `[name].service.ts` | `youtube.service.ts` |

## tRPC Patterns

### Router Structure

```typescript
import { router, protectedProcedure, publicProcedure } from "@/lib/trpc";
import { z } from "zod";
import { featureService } from "./feature.service";

export const featureRouter = router({
  // Query - read operations
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return featureService.getById(input.id, ctx.user.id);
    }),

  // Mutation - write operations
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return featureService.create(input, ctx.user.id);
    }),
});
```

### Service Layer

```typescript
import { db } from "@repo/db";
import { featureTable } from "@repo/db/schema";
import { eq, and } from "drizzle-orm";

export const featureService = {
  async getById(id: string, userId: string) {
    return db.query.featureTable.findFirst({
      where: and(eq(featureTable.id, id), eq(featureTable.userId, userId)),
    });
  },

  async create(data: FeatureInsert, userId: string) {
    const [result] = await db
      .insert(featureTable)
      .values({ ...data, userId })
      .returning();
    return result;
  },
};
```

## Error Handling

```typescript
import { TRPCError } from "@trpc/server";

// Not found
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Resource not found",
});

// Unauthorized
throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "Not authorized",
});

// Bad request
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid input",
});
```

## TypeScript Rules

- Never use `any` - use `unknown`
- Use `type` over `interface`
- Use `import type { }` for type-only imports
- Input validation always with Zod

## Security

- Always validate inputs with Zod schemas
- Check user permissions in protected procedures
- Never expose sensitive data in responses
- Use `protectedProcedure` for authenticated endpoints

## Imports

```typescript
// Database
import { db } from "@repo/db";
import { featureTable } from "@repo/db/schema";

// Types - direct imports
import type { FeatureRow } from "@repo/db/schema/feature.table";
import type { Feature } from "@repo/types/feature/feature.type";
```
