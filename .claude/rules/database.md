---
paths: packages/db/**/*.ts
---

# Database Development Rules

These rules apply when editing database code in `packages/db/`.

## File Organization

```
packages/db/
├── src/
│   ├── schema/           # Table definitions
│   │   ├── index.ts      # Schema exports
│   │   └── [name].table.ts
│   └── index.ts          # DB client export
├── drizzle/              # Generated migrations
└── drizzle.config.ts     # Drizzle config
```

## Naming Conventions

### Table Variables

```typescript
// camelCase + Table suffix
export const organizationProfileTable = pgTable("organization_profile", {
  // columns
});
```

### SQL Column Names

```typescript
// snake_case in SQL
createdAt: timestamp("created_at").defaultNow(),
userId: uuid("user_id").references(() => userTable.id),
```

### Type Exports

```typescript
// PascalCase + Row/Insert suffix
export type OrganizationProfileRow =
  typeof organizationProfileTable.$inferSelect;
export type OrganizationProfileInsert =
  typeof organizationProfileTable.$inferInsert;
```

## Common Patterns

### Standard Table Template

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const featureTable = pgTable("feature", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("user_id")
    .references(() => userTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FeatureRow = typeof featureTable.$inferSelect;
export type FeatureInsert = typeof featureTable.$inferInsert;
```

### Relations

```typescript
import { relations } from "drizzle-orm";

export const featureRelations = relations(featureTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [featureTable.userId],
    references: [userTable.id],
  }),
  items: many(itemTable),
}));
```

### Indexes

```typescript
import { index, uniqueIndex } from "drizzle-orm/pg-core";

export const featureTable = pgTable(
  "feature",
  {
    /* columns */
  },
  (table) => [
    t.uniqueIndex("feature_slug_idx").on(table.slug),
    t.index("feature_user_idx").on(table.userId),
  ]
);
```

### Enums

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["pending", "active", "archived"]);

// Usage in table
status: statusEnum("status").default("pending"),
```

## Column Types Reference

```typescript
import {
  text, // Unlimited text
  varchar, // Variable length: varchar("x", { length: 255 })
  integer, // Integer number
  bigint, // Big integer
  boolean, // True/false
  timestamp, // Datetime
  date, // Date only
  uuid, // UUID
  jsonb, // JSON binary
  pgEnum, // Custom enum
} from "drizzle-orm/pg-core";
```

## Commands

```bash
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Apply migrations
pnpm db:push       # Push schema (dev only)
pnpm db:studio     # Open Drizzle Studio
```

## Export from Index

Always export new tables from `packages/db/src/schema/index.ts`:

```typescript
export * from "./feature.table";
```
