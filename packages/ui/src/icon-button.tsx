/**
 * @fileoverview IconButton component - Reusable icon button with tooltip
 *
 * A standardized icon button component that combines a button with tooltip,
 * proper accessibility attributes, and consistent hover/active states.
 *
 * ## Features:
 * - Integrated tooltip via SimpleTooltip
 * - Configurable tooltip delay and position
 * - Active/pressed state styling
 * - Disabled state handling
 * - Consistent sizing and hover effects
 *
 * ## Usage:
 * ```tsx
 * <IconButton
 *   icon={<Save className="w-4 h-4" />}
 *   label="Save document"
 *   onClick={handleSave}
 * />
 *
 * <IconButton
 *   icon={<Lock className="w-4 h-4" />}
 *   label="Read-only mode"
 *   onClick={toggleReadOnly}
 *   active={isReadOnly}
 * />
 * ```
 *
 * @module ui/icon-button
 * @see {@link SimpleTooltip} - Tooltip wrapper component
 * @see {@link Button} - Base button component (alternative for different variants)
 */

"use client";

import * as React from "react";
import { SimpleTooltip } from "./simple-tooltip";
import { cn } from "@writenex/utils";

/**
 * Props for the IconButton component
 *
 * @interface IconButtonProps
 */
export interface IconButtonProps {
  /**
   * The icon element to display.
   * Should be a Lucide icon or similar with w-4 h-4 sizing.
   */
  icon: React.ReactNode;

  /**
   * Tooltip content and aria-label for accessibility.
   * Should describe the button's action.
   */
  label: string;

  /**
   * Click handler for the button.
   */
  onClick: () => void;

  /**
   * Whether the button is disabled.
   * Disables click and shows reduced opacity.
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the button is in active/pressed state.
   * Shows highlighted background when true.
   * @default false
   */
  active?: boolean;

  /**
   * Additional CSS classes to apply.
   * Useful for custom hover colors or sizing.
   */
  className?: string;

  /**
   * Tooltip position relative to the button.
   * @default "bottom"
   */
  tooltipSide?: "top" | "right" | "bottom" | "left";

  /**
   * Delay before showing tooltip in milliseconds.
   * Use 0 for instant tooltips on action buttons.
   * If undefined, uses global TooltipProvider default.
   */
  tooltipDelay?: number;

  /**
   * Button type attribute.
   * @default "button"
   */
  type?: "button" | "submit" | "reset";
}

/**
 * A reusable icon button component with integrated tooltip.
 *
 * Provides consistent styling, accessibility, and behavior for icon-only
 * buttons throughout the application. Includes hover effects, active state
 * indication, and proper ARIA attributes.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <IconButton
 *   icon={<Search className="w-4 h-4" />}
 *   label="Search"
 *   onClick={() => setSearchOpen(true)}
 * />
 *
 * // With active state
 * <IconButton
 *   icon={<History className="w-4 h-4" />}
 *   label="Version History"
 *   onClick={() => setHistoryOpen(!isOpen)}
 *   active={isOpen}
 * />
 *
 * // Instant tooltip for action buttons
 * <IconButton
 *   icon={<Copy className="w-4 h-4" />}
 *   label="Copy"
 *   onClick={handleCopy}
 *   tooltipDelay={0}
 * />
 *
 * // Custom hover color
 * <IconButton
 *   icon={<Trash2 className="w-4 h-4" />}
 *   label="Delete"
 *   onClick={handleDelete}
 *   className="hover:text-red-500 dark:hover:text-red-400"
 * />
 * ```
 *
 * @param props - Component props
 * @returns Button element wrapped with tooltip
 */
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
