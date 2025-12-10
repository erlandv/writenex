/**
 * @fileoverview IconButton component - Reusable icon button with tooltip
 * @module lib/ui/icon-button
 */

"use client";

import * as React from "react";
import { SimpleTooltip } from "./simple-tooltip";
import { cn } from "@/lib/utils";

export interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipDelay?: number;
  type?: "button" | "submit" | "reset";
}

export function IconButton({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  className,
  tooltipSide = "bottom",
  tooltipDelay,
  type = "button",
}: IconButtonProps): React.ReactElement {
  return (
    <SimpleTooltip
      content={label}
      side={tooltipSide}
      delayDuration={tooltipDelay}
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors",
          "text-zinc-600 dark:text-zinc-400",
          "hover:bg-black/10 dark:hover:bg-white/10",
          "hover:text-zinc-900 dark:hover:text-zinc-100",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
          active &&
            "bg-black/10 text-zinc-900 dark:bg-white/15 dark:text-zinc-100",
          className
        )}
        aria-label={label}
        aria-pressed={active}
      >
        {icon}
      </button>
    </SimpleTooltip>
  );
}
