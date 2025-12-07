/**
 * @fileoverview Tooltip component built on Radix UI Tooltip primitive
 *
 * An accessible tooltip component that displays contextual information
 * on hover or focus. Includes smooth animations and proper positioning.
 *
 * ## Features:
 * - Accessible tooltip with proper ARIA attributes
 * - Animated open/close with zoom and fade effects
 * - Automatic positioning based on available space
 * - Dark mode support (inverted colors)
 * - Configurable delay via TooltipProvider
 *
 * ## Components:
 * - TooltipProvider: Context provider for tooltip configuration
 * - Tooltip: Root component (manages open state)
 * - TooltipTrigger: Element that triggers tooltip on hover/focus
 * - TooltipContent: The tooltip content container
 *
 * ## Usage:
 * Wrap your app with TooltipProvider, then use Tooltip components.
 * Based on shadcn/ui tooltip component pattern.
 *
 * @module components/ui/tooltip
 * @see https://ui.shadcn.com/docs/components/tooltip
 * @see https://www.radix-ui.com/primitives/docs/components/tooltip
 */

"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/**
 * Tooltip provider component.
 * Must wrap the application to enable tooltips.
 * Configures global tooltip behavior like delay duration.
 */
const TooltipProvider = TooltipPrimitive.Provider;

/** Root tooltip component - manages open/closed state */
const Tooltip = TooltipPrimitive.Root;

/** Element that triggers tooltip on hover/focus */
const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Tooltip content container.
 * Renders the tooltip text with animations and positioning.
 * Uses inverted colors (dark on light, light on dark) for contrast.
 */
const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
