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
export { Button, buttonVariants, type ButtonProps } from "./components/button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/card";
export { Input, type InputProps } from "./components/input";
export { Textarea, type TextareaProps } from "./components/textarea";
export { Label } from "./components/label";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge";
export { Skeleton } from "./components/skeleton";
export { Separator } from "./components/separator";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/tabs";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./components/tooltip";
export { ScrollArea, ScrollBar } from "./components/scroll-area";
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
} from "./components/dialog";
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
} from "./components/select";
export {
  ThemeToggle,
  ThemeToggleIcon,
  ThemeSwitcher,
  ThemeDropdown,
} from "./components/theme-toggle";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./components/table";
