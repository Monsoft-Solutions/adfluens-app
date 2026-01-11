---
name: drizzle-orm
description: Guide Drizzle ORM database development with schema design, queries, and migrations. Use when working with database tables, queries, or migrations.
allowed-tools: Read, Glob, Grep, Bash
---

# Drizzle ORM Guide

This skill provides guidance for Drizzle ORM with PostgreSQL in the YouTube Channel Analyzer project.

## Project Structure

```
packages/db/
├── src/
│   ├── schema/              # Table definitions
│   │   ├── index.ts         # Exports all tables
│   │   └── [name].table.ts  # Individual tables
│   └── index.ts             # DB client export
├── drizzle/                 # Generated migrations
└── drizzle.config.ts        # Configuration
```

## Commands

```bash
pnpm db:generate   # Generate migrations from schema changes
pnpm db:migrate    # Apply migrations to database
pnpm db:push       # Push schema directly (dev only)
pnpm db:studio     # Open Drizzle Studio GUI
```

## Table Definition

### Standard Template

```typescript
// packages/db/src/schema/channel.table.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { userTable } from "./user.table";

export const channelTable = pgTable(
  "channel",
  {
    // Primary key
    id: uuid("id").primaryKey().defaultRandom(),

    // Foreign key
    userId: uuid("user_id")
      .references(() => userTable.id, { onDelete: "cascade" })
      .notNull(),

    // Text fields
    youtubeId: text("youtube_id").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),

    // Numbers
    subscriberCount: integer("subscriber_count").default(0),
    videoCount: integer("video_count").default(0),

    // Booleans
    isActive: boolean("is_active").default(true),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Indexes
    t.uniqueIndex("channel_youtube_id_idx").on(table.youtubeId),
  ]
);

// Relations
export const channelRelations = relations(channelTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [channelTable.userId],
    references: [userTable.id],
  }),
  videos: many(videoTable),
}));

// Type exports
export type ChannelRow = typeof channelTable.$inferSelect;
export type ChannelInsert = typeof channelTable.$inferInsert;
```

## Naming Conventions

| Element         | Convention          | Example         |
| --------------- | ------------------- | --------------- |
| Table variable  | camelCase + Table   | `channelTable`  |
| SQL table name  | snake_case          | `"channel"`     |
| SQL column name | snake_case          | `"youtube_id"`  |
| Select type     | PascalCase + Row    | `ChannelRow`    |
| Insert type     | PascalCase + Insert | `ChannelInsert` |

## Column Types

```typescript
import {
  text, // Unlimited text
  varchar, // varchar("col", { length: 255 })
  integer, // Integer
  bigint, // Big integer
  boolean, // Boolean
  timestamp, // Datetime with timezone
  date, // Date only
  uuid, // UUID
  jsonb, // JSON binary
  pgEnum, // Custom enum
  real, // Float
  doublePrecision, // Double
} from "drizzle-orm/pg-core";
```

## Query Patterns

### Select Queries

```typescript
import { db } from "@repo/db";
import { channelTable } from "@repo/db/schema";
import { eq, and, or, desc, asc, like, gt, lt, isNull } from "drizzle-orm";

// Find one
const channel = await db.query.channelTable.findFirst({
  where: eq(channelTable.id, id),
});

// Find many with conditions
const channels = await db.query.channelTable.findMany({
  where: and(eq(channelTable.userId, userId), eq(channelTable.isActive, true)),
  orderBy: desc(channelTable.createdAt),
  limit: 20,
});

// With relations
const channelWithVideos = await db.query.channelTable.findFirst({
  where: eq(channelTable.id, id),
  with: {
    videos: {
      limit: 10,
      orderBy: desc(videoTable.viewCount),
    },
  },
});

// Raw SQL when needed
const results = await db
  .select({
    name: channelTable.name,
    totalViews: sql<number>`sum(${videoTable.viewCount})`,
  })
  .from(channelTable)
  .leftJoin(videoTable, eq(channelTable.id, videoTable.channelId))
  .groupBy(channelTable.id);
```

### Insert

```typescript
// Single insert
const [channel] = await db
  .insert(channelTable)
  .values({
    youtubeId: "UC123",
    name: "My Channel",
    userId: userId,
  })
  .returning();

// Bulk insert
const channels = await db
  .insert(channelTable)
  .values([
    { youtubeId: "UC123", name: "Channel 1", userId },
    { youtubeId: "UC456", name: "Channel 2", userId },
  ])
  .returning();

// Upsert (insert or update on conflict)
await db
  .insert(channelTable)
  .values({ youtubeId: "UC123", name: "Updated", userId })
  .onConflictDoUpdate({
    target: channelTable.youtubeId,
    set: { name: "Updated" },
  });
```

### Update

```typescript
// Update with conditions
await db
  .update(channelTable)
  .set({
    name: "New Name",
    updatedAt: new Date(),
  })
  .where(and(eq(channelTable.id, id), eq(channelTable.userId, userId)));
```

### Delete

```typescript
// Delete with conditions
await db
  .delete(channelTable)
  .where(and(eq(channelTable.id, id), eq(channelTable.userId, userId)));
```

## Enums

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

// Define enum
export const videoStatusEnum = pgEnum("video_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

// Use in table
status: videoStatusEnum("status").default("pending"),
```

## JSON Columns

```typescript
// Define typed JSON
metadata: (jsonb("metadata").$type<{
  thumbnail: string;
  duration: number;
  tags: string[];
}>(),
  // Query JSON
  await db.query.videoTable.findMany({
    where: sql`${videoTable.metadata}->>'duration' > 600`,
  }));
```

## Migrations Workflow

1. **Modify schema** in `packages/db/src/schema/`
2. **Export** from `packages/db/src/schema/index.ts`
3. **Generate migration**: `pnpm db:generate`
4. **Review SQL** in `packages/db/drizzle/`
5. **Apply**: `pnpm db:migrate`
6. **Verify**: `pnpm db:studio`
