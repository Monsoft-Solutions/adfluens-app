# @repo/ui

A shared UI component library built with [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), and [Tailwind CSS](https://tailwindcss.com/).

## Features

- 🎨 **Consistent Design System** - CSS variables for theming with light/dark mode support
- ♿ **Accessible** - Built on Radix UI primitives following WCAG guidelines
- 🎯 **Type-Safe** - Full TypeScript support with exported types
- 📦 **Tree-Shakeable** - Import only what you need
- 🎭 **Customizable** - Full control over component styling

## Components

| Component | Description |
|-----------|-------------|
| `Button` | Primary action component with multiple variants |
| `Card` | Container component for content grouping |
| `Input` | Text input field with consistent styling |
| `Label` | Accessible form labels |
| `Badge` | Status indicators and labels |
| `Skeleton` | Loading state placeholders |
| `Separator` | Visual content dividers |
| `Tabs` | Tabbed navigation component |
| `Tooltip` | Contextual information popups |
| `ScrollArea` | Custom scrollable containers |
| `Dialog` | Modal dialogs |
| `Select` | Dropdown selection component |

## Usage

### Installation

This package is part of the monorepo and is available to other packages:

```json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  }
}
```

### Import Components

```tsx
import { Button, Card, CardContent, Input, cn } from "@repo/ui";

function MyComponent() {
  return (
    <Card>
      <CardContent>
        <Input placeholder="Enter text..." />
        <Button variant="default">Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Import Styles

Add the global CSS to your app's entry point:

```tsx
import "@repo/ui/globals.css";
// or import the local globals.css that extends it
```

### Tailwind Configuration

Extend the shared Tailwind config in your app:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import baseConfig from "@repo/ui/tailwind.config";

const config: Config = {
  ...baseConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
```

## Utilities

### `cn(...inputs)`

A utility function for merging Tailwind CSS classes:

```tsx
import { cn } from "@repo/ui";

<div className={cn("base-class", isActive && "active-class", className)} />
```

### `formatCompactNumber(num)`

Formats numbers to compact notation (1.2K, 3.4M):

```tsx
import { formatCompactNumber } from "@repo/ui";

formatCompactNumber(1234567); // "1.2M"
```

### `formatRelativeTime(date)`

Formats dates to relative time strings:

```tsx
import { formatRelativeTime } from "@repo/ui";

formatRelativeTime(new Date("2024-01-01")); // "2 months ago"
```

## Theming

The design system uses CSS variables for theming. Override these variables in your global CSS:

```css
:root {
  --primary: 0 100% 50%; /* YouTube Red */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... other variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... other variables */
}
```

## Adding New Components

Use the shadcn CLI to add new components:

```bash
cd packages/ui
npx shadcn@latest add [component-name]
```

Then update the component to follow the project's naming conventions (`*.component.tsx`) and export it from `src/index.ts`.

## License

MIT

