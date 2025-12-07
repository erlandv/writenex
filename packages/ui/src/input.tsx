/**
 * @fileoverview Input component for form fields
 *
 * @module ui/input
 * @see https://ui.shadcn.com/docs/components/input
 */

import * as React from "react";
import { cn } from "@writenex/utils";

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
