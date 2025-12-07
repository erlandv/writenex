/**
 * @fileoverview Button component with variants and sizes
 *
 * A flexible button component built with Radix UI Slot for composition
 * and class-variance-authority for variant management. Supports multiple
 * visual variants and sizes with consistent styling across the application.
 *
 * ## Features:
 * - Multiple variants: default, destructive, outline, secondary, ghost, link
 * - Multiple sizes: default, sm, lg, icon
 * - Polymorphic rendering via asChild prop
 * - Focus states with ring offset
 * - Dark mode support
 *
 * ## Usage:
 * Based on shadcn/ui button component pattern.
 *
 * @module components/ui/button
 * @see https://ui.shadcn.com/docs/components/button
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button variant styles using class-variance-authority.
 * Defines all possible visual variants and sizes for the button component.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90",
        destructive:
          "bg-red-500 text-zinc-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/90",
        outline:
          "border border-zinc-200 bg-white hover:bg-black/10 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-white/10 dark:hover:text-zinc-50",
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-black/10 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-white/10 dark:hover:text-zinc-50",
        ghost:
          "hover:bg-black/10 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-zinc-50",
        link: "text-zinc-900 underline-offset-4 hover:underline hover:text-zinc-900 dark:text-zinc-50 dark:hover:text-zinc-50",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Props for the Button component.
 * Extends native button attributes with variant props and asChild option.
 *
 * @interface ButtonProps
 */
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * When true, the button renders as a Slot component, allowing
   * the button styles to be applied to a child element (e.g., Link).
   * @default false
   */
  asChild?: boolean;
}

/**
 * Button component with configurable variants and sizes.
 *
 * A polymorphic button that can render as different elements using the
 * asChild prop. Supports multiple visual variants for different contexts
 * and actions.
 *
 * @component
 * @example
 * ```tsx
 * // Default button
 * <Button>Click me</Button>
 *
 * // Destructive action
 * <Button variant="destructive">Delete</Button>
 *
 * // As a link
 * <Button asChild>
 *   <Link href="/page">Go to page</Link>
 * </Button>
 *
 * // Icon button
 * <Button variant="ghost" size="icon">
 *   <Settings className="h-4 w-4" />
 * </Button>
 * ```
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
