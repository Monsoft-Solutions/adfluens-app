Create a new tRPC API endpoint.

Endpoint: $ARGUMENTS

## Instructions

1. **Determine endpoint details**:
   - Feature/router it belongs to
   - Input schema (Zod)
   - Output type
   - Protected or public?

2. **Add to router** in `apps/api/src/features/[feature]/[feature].router.ts`:

```typescript
import { router, protectedProcedure, publicProcedure } from "@/lib/trpc";
import { z } from "zod";
import { featureService } from "./feature.service";

export const featureRouter = router({
  // Query - GET data
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return featureService.getById(input.id, ctx.user.id);
    }),

  // Mutation - CREATE/UPDATE/DELETE
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

  // Public endpoint (no auth)
  publicList: publicProcedure.query(async () => {
    return featureService.getPublicList();
  }),
});
```

3. **Add service method** in `apps/api/src/features/[feature]/[feature].service.ts`:

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

  async create(data: { name: string; description?: string }, userId: string) {
    const [result] = await db
      .insert(featureTable)
      .values({ ...data, userId })
      .returning();
    return result;
  },

  async getPublicList() {
    return db.query.featureTable.findMany({
      where: eq(featureTable.isPublic, true),
    });
  },
};
```

4. **Register router** (if new feature) in main app router:

```typescript
// apps/api/src/router.ts
import { featureRouter } from "./features/feature/feature.router";

export const appRouter = router({
  feature: featureRouter,
  // ...other routers
});
```

5. **Use in frontend**:

```typescript
// In component (declarative)
const trpc = useTRPC();
const { data } = useQuery(trpc.feature.getById.queryOptions({ id }));
const mutation = useMutation(trpc.feature.create.mutationOptions());

// In utils (imperative)
import { trpcClient } from "@/lib/trpc";
const result = await trpcClient.feature.getById.query({ id });
```

6. **Verify**:
   ```bash
   pnpm type-check
   ```
