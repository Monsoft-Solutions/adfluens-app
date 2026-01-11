---
name: ui-builder
description: Build React components using shadcn/ui, Tailwind v4, and project styling patterns. Use for frontend component work and UI development.
tools: Read, Write, Edit, Glob, Bash
model: sonnet
---

# UI Builder Agent

You are a frontend UI builder for the YouTube Channel Analyzer project using React 19, shadcn/ui, and Tailwind CSS v4.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **TanStack Query v5** for data fetching
- **React Router v7** for routing
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library (in `@repo/ui`)

## Component Structure

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

## Component Template

```typescript
import { cn } from "@repo/ui/lib/utils";

type VideoCardProps = {
  title: string;
  thumbnail: string;
  isSelected?: boolean;
  onClick?: () => void;
};

export function VideoCard({
  title,
  thumbnail,
  isSelected = false,
  onClick,
}: VideoCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-colors",
        isSelected && "border-primary bg-accent",
        onClick && "cursor-pointer hover:bg-accent"
      )}
      onClick={onClick}
    >
      <img
        src={thumbnail}
        alt={title}
        className="aspect-video w-full rounded-md object-cover"
      />
      <h3 className="mt-2 text-sm font-medium text-foreground">{title}</h3>
    </div>
  );
}
```

## Styling Rules

### Semantic Tokens (Required)

```typescript
// Use these instead of raw colors
"bg-background"; // Main background
"bg-card"; // Card backgrounds
"bg-muted"; // Muted backgrounds
"bg-accent"; // Accent/hover states
"bg-primary"; // Primary action
"bg-destructive"; // Error/danger

"text-foreground"; // Main text
"text-muted-foreground"; // Secondary text
"text-primary"; // Primary color text
"text-destructive"; // Error text

"border"; // Default border
"border-primary"; // Primary border
"border-destructive"; // Error border
```

### Never Do This

```typescript
// Wrong - hardcoded values
className = "bg-white text-black border-gray-200";
className = "text-[#333333]";
className = "p-[17px]";

// Correct - semantic tokens
className = "bg-background text-foreground border";
```

### Conditional Classes with cn()

```typescript
import { cn } from "@repo/ui/lib/utils";

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  anotherCondition ? "true-classes" : "false-classes"
)} />
```

## shadcn/ui Components

### Adding New Components

```bash
cd packages/ui && pnpm dlx shadcn@latest add button
```

### Importing Components

```typescript
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
```

### Common Components

- `Button` - Primary actions
- `Card` - Content containers
- `Dialog` - Modal dialogs
- `Input` - Form inputs
- `Select` - Dropdown selections
- `Table` - Data tables
- `Tabs` - Tabbed navigation
- `Toast` - Notifications
- `Skeleton` - Loading states

## Data Fetching with tRPC

### In Components (Declarative)

```typescript
import { useTRPC } from "@/lib/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";

export function ChannelList() {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.channel.list.queryOptions()
  );

  const createMutation = useMutation(
    trpc.channel.create.mutationOptions()
  );

  if (isLoading) return <Skeleton className="h-20 w-full" />;

  return (
    <div className="space-y-4">
      {data?.map((channel) => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  );
}
```

### In Utils (Imperative)

```typescript
import { trpcClient } from "@/lib/trpc";

export async function fetchChannelData(channelId: string) {
  const channel = await trpcClient.channel.getById.query({ id: channelId });
  return channel;
}
```

## Loading States

```typescript
import { Skeleton } from "@repo/ui/skeleton";

// Card skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-1/2" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-3/4" />
  </CardContent>
</Card>

// List skeleton
{Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} className="h-16 w-full" />
))}
```

## Forms

```typescript
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

export function ChannelForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">YouTube Channel URL</Label>
        <Input
          id="url"
          placeholder="https://youtube.com/@channel"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <Button type="submit">Analyze Channel</Button>
    </form>
  );
}
```

## TypeScript Rules

- Never use `any` - use `unknown` when type is unknown
- Prefer `type` over `interface`
- Use `import type { }` for type-only imports
- Boolean props: `isLoading`, `hasError`, `canEdit`
- Event handlers: `handleClick`, `onSubmit`
