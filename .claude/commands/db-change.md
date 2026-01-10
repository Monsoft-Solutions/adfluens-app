Guide through a database schema change using Drizzle ORM.

Description: $ARGUMENTS

## Instructions

1. **Identify the change type**:
   - New table
   - New column(s)
   - Modify column(s)
   - Add relation(s)
   - Add index(es)

2. **Locate schema file**:
   - Existing tables: `packages/db/src/schema/[table].table.ts`
   - New tables: Create `packages/db/src/schema/[name].table.ts`

3. **Make schema changes** following conventions:
   - Table var: `camelCaseTable`
   - SQL columns: `snake_case`
   - Type exports: `PascalCaseRow`, `PascalCaseInsert`

4. **Generate migration**:

   ```bash
   pnpm db:generate
   ```

5. **Review generated SQL** in `packages/db/drizzle/`

6. **Apply migration**:

   ```bash
   pnpm db:migrate
   ```

7. **Verify** with Drizzle Studio:
   ```bash
   pnpm db:studio
   ```

## Common Column Types

```typescript
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// UUID primary key
id: uuid("id").primaryKey().defaultRandom(),

// Text
name: text("name").notNull(),
slug: varchar("slug", { length: 255 }).unique(),

// Numbers
count: integer("count").default(0),

// Booleans
isActive: boolean("is_active").default(true),

// Timestamps
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().notNull(),

// Foreign key
userId: uuid("user_id").references(() => userTable.id).notNull(),

// JSON
metadata: jsonb("metadata").$type<Record<string, unknown>>(),

// Enum
export const statusEnum = pgEnum("status", ["pending", "active"]);
status: statusEnum("status").default("pending"),
```

## Adding Indexes

```typescript
export const table = pgTable(
  "table_name",
  {
    /* columns */
  },
  (table) => ({
    slugIdx: uniqueIndex("slug_idx").on(table.slug),
    userIdx: index("user_idx").on(table.userId),
  })
);
```
