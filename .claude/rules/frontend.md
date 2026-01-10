---
paths: apps/web/**/*.{ts,tsx}
---

# Frontend Development Rules

These rules apply when editing frontend code in `apps/web/`.

## File Organization

```
apps/web/src/features/[name]/
├── views/                    # Route-level components
│   └── [name].view.tsx
├── components/               # Feature-specific UI
│   └── [name]-card.component.tsx
└── utils/                    # Imperative logic
    └── [name].utils.ts
```

## File Naming

| Type       | Pattern                | Example                    |
| ---------- | ---------------------- | -------------------------- |
| Components | `[name].component.tsx` | `video-card.component.tsx` |
| Views      | `[name].view.tsx`      | `channel.view.tsx`         |
| Hooks      | `use-[name].hook.ts`   | `use-player.hook.ts`       |
| Utilities  | `[name].utils.ts`      | `format.utils.ts`          |

## React Patterns

### Data Fetching (TanStack Query + tRPC)

```typescript
// In components - use hooks
const trpc = useTRPC();
const { data, isLoading } = useQuery(trpc.feature.getData.queryOptions({ id }));

// In utils/handlers - use client directly
import { trpcClient } from "@/lib/trpc";
const result = await trpcClient.feature.getData.query({ id });
```

### Component Structure

```typescript
import { cn } from "@repo/ui/lib/utils";

type CardProps = {
  title: string;
  isActive?: boolean;
};

export function Card({ title, isActive = false }: CardProps) {
  return (
    <div className={cn("bg-card", isActive && "border-primary")}>
      {title}
    </div>
  );
}
```

## Styling Rules

### Required: Semantic Tokens Only

```typescript
// Backgrounds
"bg-background"; // Main background
"bg-card"; // Card backgrounds
"bg-muted"; // Muted backgrounds
"bg-accent"; // Hover states
"bg-primary"; // Primary actions

// Text
"text-foreground"; // Main text
"text-muted-foreground"; // Secondary text
"text-primary"; // Primary color

// Borders
"border"; // Default border
"border-primary"; // Primary border
```

### Forbidden: Hardcoded Values

```typescript
// NEVER DO THIS
"bg-white";
"text-black";
"text-[#333]";
"p-[17px]";
```

## TypeScript Rules

- Never use `any` - use `unknown` when type is unknown
- Use `type` over `interface`
- Use `import type { }` for type-only imports
- Boolean props: `isLoading`, `hasError`, `canEdit`
- Event handlers: `handleClick`, `onSubmit`

## Imports

```typescript
// Components from @repo/ui
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";

// Types - direct imports, no barrels
import type { Video } from "@repo/types/youtube/video.type";

// Utils
import { cn } from "@repo/ui/lib/utils";
```
