Add a new shadcn/ui component to the project.

Component name: $ARGUMENTS

## Instructions

1. **Add the component to @repo/ui**:

   ```bash
   cd packages/ui && pnpm dlx shadcn@latest add $ARGUMENTS
   ```

2. **Verify installation**:
   - Check `packages/ui/src/components/ui/` for the new component
   - Verify exports in component file

3. **Usage example**:
   ```typescript
   import { ComponentName } from "@repo/ui/component-name";
   ```

## Common Components to Add

- `accordion` - Collapsible content sections
- `alert` - Alert messages
- `alert-dialog` - Confirmation dialogs
- `avatar` - User avatars
- `badge` - Status badges
- `breadcrumb` - Navigation breadcrumbs
- `calendar` - Date picker calendar
- `carousel` - Image/content carousel
- `chart` - Data visualization
- `checkbox` - Form checkboxes
- `collapsible` - Collapsible sections
- `combobox` - Searchable select
- `command` - Command palette
- `context-menu` - Right-click menus
- `data-table` - Advanced data tables
- `date-picker` - Date selection
- `drawer` - Side drawers
- `dropdown-menu` - Dropdown menus
- `form` - Form handling with react-hook-form
- `hover-card` - Hover information cards
- `input-otp` - OTP input fields
- `menubar` - Menu bars
- `navigation-menu` - Navigation menus
- `pagination` - Page navigation
- `popover` - Floating content
- `progress` - Progress bars
- `radio-group` - Radio buttons
- `resizable` - Resizable panels
- `scroll-area` - Custom scrollbars
- `separator` - Visual separators
- `sheet` - Slide-out panels
- `slider` - Range sliders
- `sonner` - Toast notifications
- `switch` - Toggle switches
- `textarea` - Multi-line input
- `toggle` - Toggle buttons
- `toggle-group` - Toggle button groups
- `tooltip` - Hover tooltips

## After Adding

Run type check to ensure no issues:

```bash
pnpm type-check
```
