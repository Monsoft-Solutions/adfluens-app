---
name: trpc-patterns
description: Guide tRPC development with routers, services, and client usage. Use when building API endpoints, data fetching, or tRPC procedures.
allowed-tools: Read, Glob, Grep
---

# tRPC Patterns Guide

This skill provides guidance for tRPC v11 development in the YouTube Channel Analyzer project.

## Architecture Overview

```
apps/api/src/features/[feature]/
├── [feature].router.ts    # tRPC procedures (queries/mutations)
└── [feature].service.ts   # Business logic (database operations)

apps/web/src/
├── lib/trpc.ts           # tRPC client setup
└── features/[feature]/   # Frontend consuming tRPC
```

## Backend: Router Patterns

### Basic Router Structure

```typescript
// apps/api/src/features/channel/channel.router.ts
import { router, protectedProcedure, publicProcedure } from "@/lib/trpc";
import { z } from "zod";
import { channelService } from "./channel.service";

export const channelRouter = router({
  // Query - fetch data
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      return channelService.getById(input.id, ctx.user.id);
    }),

  // Query - list with pagination
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return channelService.list(ctx.user.id, input);
    }),

  // Mutation - create
  create: protectedProcedure
    .input(
      z.object({
        youtubeUrl: z.string().url(),
        name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return channelService.create(input, ctx.user.id);
    }),

  // Mutation - update
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return channelService.update(input.id, input, ctx.user.id);
    }),

  // Mutation - delete
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return channelService.delete(input.id, ctx.user.id);
    }),
});
```

### Register Router

```typescript
// apps/api/src/router.ts
import { router } from "@/lib/trpc";
import { channelRouter } from "./features/channel/channel.router";

export const appRouter = router({
  channel: channelRouter,
});

export type AppRouter = typeof appRouter;
```

## Backend: Service Patterns

### Service Structure

```typescript
// apps/api/src/features/channel/channel.service.ts
import { db } from "@repo/db";
import { channelTable } from "@repo/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const channelService = {
  async getById(id: string, userId: string) {
    const channel = await db.query.channelTable.findFirst({
      where: and(eq(channelTable.id, id), eq(channelTable.userId, userId)),
    });

    if (!channel) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Channel not found",
      });
    }

    return channel;
  },

  async list(userId: string, options: { limit: number; cursor?: string }) {
    const channels = await db.query.channelTable.findMany({
      where: eq(channelTable.userId, userId),
      orderBy: desc(channelTable.createdAt),
      limit: options.limit + 1,
      // cursor logic here
    });

    return {
      items: channels.slice(0, options.limit),
      nextCursor:
        channels.length > options.limit ? channels[options.limit - 1].id : null,
    };
  },

  async create(data: { youtubeUrl: string; name: string }, userId: string) {
    const [channel] = await db
      .insert(channelTable)
      .values({ ...data, userId })
      .returning();
    return channel;
  },
};
```

## Frontend: Client Usage

### In React Components (Declarative)

```typescript
import { useTRPC } from "@/lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function ChannelList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Query
  const { data, isLoading, error } = useQuery(
    trpc.channel.list.queryOptions({ limit: 20 })
  );

  // Mutation with cache invalidation
  const createMutation = useMutation({
    ...trpc.channel.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel", "list"] });
    },
  });

  // Usage
  const handleCreate = () => {
    createMutation.mutate({
      youtubeUrl: "https://youtube.com/@channel",
      name: "My Channel",
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.items.map((channel) => (
        <div key={channel.id}>{channel.name}</div>
      ))}
    </div>
  );
}
```

### In Utils/Handlers (Imperative)

```typescript
// apps/web/src/features/channel/utils/channel.utils.ts
import { trpcClient } from "@/lib/trpc";

export async function fetchChannelById(id: string) {
  return trpcClient.channel.getById.query({ id });
}

export async function createChannel(data: {
  youtubeUrl: string;
  name: string;
}) {
  return trpcClient.channel.create.mutate(data);
}
```

## Error Handling

### Backend Errors

```typescript
import { TRPCError } from "@trpc/server";

// Common error codes
throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input" });
throw new TRPCError({ code: "CONFLICT", message: "Already exists" });
throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Server error" });
```

### Frontend Error Handling

```typescript
const { data, error, isError } = useQuery(trpc.channel.getById.queryOptions({ id }));

if (isError) {
  if (error.data?.code === "NOT_FOUND") {
    return <NotFound />;
  }
  return <ErrorMessage message={error.message} />;
}
```

## Input Validation with Zod

```typescript
import { z } from "zod";

// Reusable schemas
const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

const channelInputSchema = z.object({
  youtubeUrl: z.string().url().regex(/youtube\.com/),
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(1000).optional(),
});

// Usage in procedure
create: protectedProcedure
  .input(channelInputSchema)
  .mutation(/* ... */),
```
