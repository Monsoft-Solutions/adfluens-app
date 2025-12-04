import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/**
 * Button variants configuration using class-variance-authority
 *
 * Follows DESIGN.md "Soft Brutalism" aesthetic:
 * - Tight radii (4px for buttons)
 * - No fuzzy focus rings - uses thick solid outline
 * - Translate + hard shadow hover effect for primary actions
 * - High contrast active states
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md text-sm font-medium",
    "transition-all duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary: Translate up + hard shadow on hover (DESIGN.md pattern)
        default: [
          "bg-primary text-primary-foreground border border-transparent",
          "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
          "hover:-translate-y-[1px] hover:translate-x-[-1px]",
          "hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
          "active:translate-y-0 active:translate-x-0 active:shadow-none",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground border border-transparent",
          "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
          "hover:-translate-y-[1px] hover:translate-x-[-1px]",
          "hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
          "active:translate-y-0 active:translate-x-0 active:shadow-none",
        ].join(" "),
        // Outline: Border changes to foreground on hover
        outline: [
          "border border-input bg-background",
          "hover:border-foreground hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/80",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
          "active:bg-secondary/70",
        ].join(" "),
        ghost: [
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/80",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /**
     * If true, the button will render as its child element
     * Useful for composing button functionality with custom components
     */
    asChild?: boolean;
  };

/**
 * Button component with multiple variants and sizes
 *
 * @example
 * <Button variant="default">Click me</Button>
 * <Button variant="outline" size="sm">Small outline</Button>
 * <Button variant="youtube">Subscribe</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
