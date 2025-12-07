/**
 * @fileoverview SimpleTooltip component - Simplified tooltip wrapper
 *
 * A convenience wrapper around Radix UI Tooltip that reduces boilerplate
 * by combining TooltipProvider, Tooltip, TooltipTrigger, and TooltipContent
 * into a single component.
 *
 * ## Features:
 * - Single component instead of 4 nested components
 * - Optional custom delay duration (uses provider default if not specified)
 * - Configurable positioning (side, align)
 * - Passes through all TooltipContent props
 *
 * ## Usage:
 * ```tsx
 * <SimpleTooltip content="Tooltip text">
 *   <button>Hover me</button>
 * </SimpleTooltip>
 *
 * <SimpleTooltip content="Quick tooltip" delayDuration={0}>
 *   <button>Instant tooltip</button>
 * </SimpleTooltip>
 * ```
 *
 * @module components/ui/simple-tooltip
 * @see {@link Tooltip} - Base tooltip components
 */

"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

/**
 * Props for SimpleTooltip component
 */
interface SimpleTooltipProps {
  /**
   * The element that triggers the tooltip on hover/focus.
   * Should be a single React element that can receive a ref.
   */
  children: React.ReactNode;

  /**
   * The tooltip content to display.
   * Can be a string or React node.
   */
  content: React.ReactNode;

  /**
   * Delay in milliseconds before showing the tooltip.
   * If provided, wraps with a local TooltipProvider.
   * If omitted, uses the global TooltipProvider's delay.
   */
  delayDuration?: number;

  /**
   * The preferred side of the trigger to render against.
   * @default "top"
   */
  side?: "top" | "right" | "bottom" | "left";

  /**
   * The preferred alignment against the trigger.
   * @default "center"
   */
  align?: "start" | "center" | "end";

  /**
   * Additional class names for the tooltip content.
   */
  contentClassName?: string;

  /**
   * Whether the tooltip is open by default (uncontrolled).
   */
  defaultOpen?: boolean;

  /**
   * Controlled open state.
   */
  open?: boolean;

  /**
   * Callback when open state changes.
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Whether to render as child (using Slot).
   * @default true
   */
  asChild?: boolean;
}

/**
 * Simplified tooltip component that wraps Radix UI Tooltip primitives.
 *
 * Reduces boilerplate from ~10 lines to ~3 lines while maintaining
 * full functionality. Automatically handles TooltipProvider when
 * custom delayDuration is needed.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage (uses global TooltipProvider delay)
 * <SimpleTooltip content="Save document">
 *   <Button>Save</Button>
 * </SimpleTooltip>
 *
 * // With custom delay
 * <SimpleTooltip content="Delete" delayDuration={0} side="bottom">
 *   <Button variant="destructive">Delete</Button>
 * </SimpleTooltip>
 * ```
 */
export function SimpleTooltip({
  children,
  content,
  delayDuration,
  side = "top",
  align = "center",
  contentClassName,
  defaultOpen,
  open,
  onOpenChange,
  asChild = true,
}: SimpleTooltipProps) {
  const tooltipContent = (
    <Tooltip defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={contentClassName}>
        {content}
      </TooltipContent>
    </Tooltip>
  );

  // If custom delayDuration is specified, wrap with local TooltipProvider
  if (delayDuration !== undefined) {
    return (
      <TooltipProvider delayDuration={delayDuration}>
        {tooltipContent}
      </TooltipProvider>
    );
  }

  // Otherwise, use global TooltipProvider from layout.tsx
  return tooltipContent;
}
