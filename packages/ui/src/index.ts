/**
 * @repo/ui - Shared UI component library
 *
 * This package provides a collection of accessible, customizable React components
 * built with Radix UI primitives and styled with Tailwind CSS.
 *
 * All components follow shadcn/ui patterns for consistency and maintainability.
 */

// Utilities
export { cn, formatCompactNumber, formatRelativeTime } from "./lib/utils";

// Components
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from "./components/button.component";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/card.component";
export { Input, type InputProps } from "./components/input.component";
export { Label } from "./components/label.component";
export {
  Badge,
  badgeVariants,
  type BadgeProps,
} from "./components/badge.component";
export { Skeleton } from "./components/skeleton.component";
export { Separator } from "./components/separator.component";
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./components/tabs.component";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./components/tooltip.component";
export { ScrollArea, ScrollBar } from "./components/scroll-area.component";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/dialog.component";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./components/select.component";
