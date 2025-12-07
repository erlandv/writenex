/**
 * @fileoverview Input component for form fields
 *
 * A flexible input component with consistent styling across the application.
 * Supports all native input attributes and includes dark mode support.
 *
 * ## Features:
 * - Consistent styling with other UI components
 * - Focus ring states
 * - Disabled state styling
 * - Dark mode support
 * - Placeholder styling
 * - File input styling
 *
 * ## Usage:
 * Based on shadcn/ui input component pattern.
 *
 * @module components/ui/input
 * @see https://ui.shadcn.com/docs/components/input
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input component for form fields.
 *
 * A styled input component with consistent appearance across the application.
 * Supports all native input types and attributes.
 *
 * @component
 * @example
 * ```tsx
 * // Basic text input
 * <Input placeholder="Enter text..." />
 *
 * // With value and onChange
 * <Input
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   placeholder="Search..."
 * />
 *
 * // Disabled input
 * <Input disabled placeholder="Disabled" />
 *
 * // With custom className
 * <Input className="w-48" placeholder="Fixed width" />
 *
 * // Email input
 * <Input type="email" placeholder="email@example.com" />
 * ```
 */
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-zinc-500 dark:placeholder:text-zinc-400",
        "focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:outline-none dark:focus-visible:ring-zinc-300",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-zinc-800",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
