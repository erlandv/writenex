/**
 * @fileoverview SimpleTooltip component - Simplified tooltip wrapper
 * @module lib/ui/simple-tooltip
 */

"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip";

export interface SimpleTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  delayDuration?: number;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  contentClassName?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  asChild?: boolean;
}

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

  if (delayDuration !== undefined) {
    return (
      <TooltipProvider delayDuration={delayDuration}>
        {tooltipContent}
      </TooltipProvider>
    );
  }

  return tooltipContent;
}
