Run a code review on recent changes or specified files.

Target: $ARGUMENTS

## Instructions

1. **Identify files to review**:
   - If no argument: Review recent git changes with `git diff`
   - If argument provided: Review specified files/directories

2. **Check each category**:

### TypeScript Quality

- No `any` type (use `unknown`)
- `type` preferred over `interface`
- `import type { }` for type-only imports
- Boolean vars: `is`, `has`, `can`, `should` prefix
- Event handlers: `handle`, `on` prefix

### Import Patterns

- Direct imports from source, NOT barrel files
- Exception: `@repo/ui` uses barrel exports

### File Naming

- Components: `[name].component.tsx`
- Views: `[name].view.tsx`
- Services: `[name].service.ts`
- Routers: `[name].router.ts`
- Types: `[name].type.ts`
- Tables: `[name].table.ts`
- Hooks: `use-[name].hook.ts`

### React Patterns

- TanStack Query for data fetching
- `useTRPC()` in components
- `trpcClient` in utils
- Components from `@repo/ui`
- `cn()` for conditional classes

### Styling

- Semantic tokens only: `bg-background`, `text-foreground`
- No hardcoded colors/fonts/spacing
- Tailwind v4 syntax

### Database

- Table vars: `camelCaseTable`
- Types: `PascalCaseRow`, `PascalCaseInsert`

### Security

- No hardcoded secrets
- Input validation with Zod
- Proper auth checks
- No SQL injection

3. **Report issues** with format:

   ```
   [SEVERITY] Issue Title
   File: path/to/file.ts:line
   Problem: Description
   Fix: Suggested solution
   ```

   Severities: CRITICAL, HIGH, MEDIUM, LOW

4. **Summary**: Provide overall assessment and priority fixes
