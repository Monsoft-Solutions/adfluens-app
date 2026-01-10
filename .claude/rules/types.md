---
paths: packages/types/**/*.ts
---

# Types Package Rules

These rules apply when editing shared types in `packages/types/`.

## File Organization

```
packages/types/
├── [feature]/
│   ├── [feature].type.ts       # Main types
│   ├── [feature].schema.ts     # Zod schemas (if separate)
│   └── [feature]-[sub].type.ts # Sub-types
└── index.ts                    # DO NOT USE FOR IMPORTS
```

## CRITICAL: No Barrel Imports

```typescript
// CORRECT - Import directly from source
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";
import { youtubeVideoSchema } from "@repo/types/youtube/youtube-video.type";

// WRONG - Never import from index
import type { YouTubeVideo } from "@repo/types";
```

## File Naming

| Type       | Pattern            | Example                   |
| ---------- | ------------------ | ------------------------- |
| Main types | `[name].type.ts`   | `youtube-video.type.ts`   |
| Schemas    | `[name].schema.ts` | `youtube-video.schema.ts` |
| Enums      | `[name].enum.ts`   | `video-sort.enum.ts`      |

## Type Definition Patterns

### With Zod Schema

```typescript
import { z } from "zod";

// Schema definition
export const youtubeVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  viewCount: z.number(),
  publishedAt: z.date(),
  thumbnail: z.string().url(),
});

// Inferred type
export type YouTubeVideo = z.infer<typeof youtubeVideoSchema>;

// Input schema (for forms/APIs)
export const createVideoInputSchema = youtubeVideoSchema.omit({
  id: true,
  publishedAt: true,
});

export type CreateVideoInput = z.infer<typeof createVideoInputSchema>;
```

### Standalone Types

```typescript
// When Zod not needed
export type VideoMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
};
```

### Enum Types

```typescript
// Use const object for type + runtime values
export const VideoSortOption = {
  DATE: "date",
  VIEWS: "views",
  RATING: "rating",
} as const;

export type VideoSortOption =
  (typeof VideoSortOption)[keyof typeof VideoSortOption];

// Or simple union type
export type VideoStatus = "draft" | "published" | "archived";
```

## TypeScript Rules

### Always Use `type` Over `interface`

```typescript
// Correct
type UserProfile = {
  name: string;
  email: string;
};

// Avoid
interface UserProfile {
  name: string;
  email: string;
}
```

### Export Type Separately

```typescript
// Export type and schema separately
export type Video = z.infer<typeof videoSchema>;
export { videoSchema };

// Consumers import what they need
import type { Video } from "@repo/types/video/video.type";
import { videoSchema } from "@repo/types/video/video.type";
```

### Utility Types

```typescript
// Partial
type PartialVideo = Partial<Video>;

// Pick
type VideoSummary = Pick<Video, "id" | "title" | "thumbnail">;

// Omit
type VideoWithoutId = Omit<Video, "id">;

// Record
type VideoMap = Record<string, Video>;
```

## Zod Patterns

### Optional Fields

```typescript
z.string().optional(); // string | undefined
z.string().nullable(); // string | null
z.string().nullish(); // string | null | undefined
z.string().default("value"); // Has default value
```

### Validation

```typescript
z.string().min(1); // Non-empty
z.string().max(100); // Max length
z.string().email(); // Email format
z.string().url(); // URL format
z.string().uuid(); // UUID format
z.number().positive(); // > 0
z.number().int(); // Integer
z.array(z.string()).nonempty(); // Non-empty array
```

### Transform

```typescript
z.string().transform((val) => val.toLowerCase());
z.string().transform((val) => new Date(val));
```
