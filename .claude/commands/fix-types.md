Find and fix TypeScript type errors in the project.

Scope: $ARGUMENTS

## Instructions

1. **Run type check**:

   ```bash
   pnpm type-check
   ```

2. **Analyze errors** and categorize:
   - Missing type imports
   - Incorrect prop types
   - Nullable type issues
   - Generic type mismatches
   - Module resolution errors

3. **Fix each error** following project conventions:

### Type Imports

```typescript
// Always use type imports for types
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";

// Regular imports for values
import { videoSchema } from "@repo/types/youtube/youtube-video.type";
```

### Nullable Types

```typescript
// Use optional chaining
const name = user?.name;

// Use nullish coalescing
const count = value ?? 0;

// Guard with type narrowing
if (data) {
  // data is now non-null
}
```

### Props Types

```typescript
// Prefer type over interface
type ButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};
```

### Generic Types

```typescript
// Be explicit with generics
const items = useState<Item[]>([]);
const query = useQuery<Channel>(queryOptions);
```

### Never Use `any`

```typescript
// Wrong
function process(data: any) {}

// Correct
function process(data: unknown) {
  if (isValidData(data)) {
    // data is now typed
  }
}
```

4. **Verify fix**:

   ```bash
   pnpm type-check
   ```

5. **Run lint** to catch related issues:
   ```bash
   pnpm lint
   ```

## Common Fixes

### Missing Module

```typescript
// Add to tsconfig paths or install package
// Check packages/*/tsconfig.json for path mappings
```

### React Component Types

```typescript
import type { ReactNode, ComponentProps } from "react";

type Props = {
  children: ReactNode;
} & ComponentProps<"div">;
```

### Event Handler Types

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};
```
