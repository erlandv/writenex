/**
 * @fileoverview Dropdown menu component built on Radix UI
 *
 * A fully accessible dropdown menu with support for checkboxes,
 * radio groups, sub-menus, and keyboard navigation.
 *
 * ## Features:
 * - Keyboard navigation (arrow keys, escape, enter)
 * - Sub-menu support with nested content
 * - Checkbox and radio item variants
 * - Animated open/close transitions
 * - Dark mode support
 * - Shortcut display support
 *
 * ## Components:
 * - DropdownMenu: Root component
 * - DropdownMenuTrigger: Element that opens the menu
 * - DropdownMenuContent: Container for menu items
 * - DropdownMenuItem: Clickable menu item
 * - DropdownMenuCheckboxItem: Toggleable checkbox item
 * - DropdownMenuRadioItem: Radio selection item
 * - DropdownMenuRadioGroup: Group for radio items
 * - DropdownMenuLabel: Non-interactive label
 * - DropdownMenuSeparator: Visual separator
 * - DropdownMenuShortcut: Keyboard shortcut display
 * - DropdownMenuSub: Sub-menu container
 * - DropdownMenuSubTrigger: Sub-menu trigger
 * - DropdownMenuSubContent: Sub-menu content
 *
 * ## Usage:
 * Based on shadcn/ui dropdown-menu component pattern.
 *
 * @module components/ui/dropdown-menu
 * @see https://ui.shadcn.com/docs/components/dropdown-menu
 * @see https://www.radix-ui.com/primitives/docs/components/dropdown-menu
 */

"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Root dropdown menu component - manages open/closed state */
const DropdownMenu = DropdownMenuPrimitive.Root;

/** Element that triggers dropdown open when clicked */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/** Group container for related menu items */
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/** Portal for rendering menu outside DOM hierarchy */
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

/** Sub-menu container component */
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/** Group container for radio items */
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/**
 * Sub-menu trigger item.
 * Displays a menu item that opens a nested sub-menu on hover/focus.
 * Shows a chevron icon to indicate sub-menu presence.
 */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-black/10 focus:text-zinc-900 data-[state=open]:bg-zinc-200 dark:focus:bg-white/10 dark:focus:text-zinc-50 dark:data-[state=open]:bg-zinc-700 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

/**
 * Sub-menu content container.
 * Renders the content of a nested sub-menu with animations.
 */
const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-32 overflow-hidden rounded-xl border border-zinc-200/50 bg-white p-1.5 text-zinc-950 shadow-xl dark:border-zinc-800/50 dark:bg-zinc-950 dark:text-zinc-50",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

/**
 * Main dropdown menu content container.
 * Renders inside a portal with animations and proper positioning.
 */
const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-32 overflow-hidden rounded-xl border border-zinc-200/50 bg-white p-1.5 text-zinc-950 shadow-xl dark:border-zinc-800/50 dark:bg-zinc-950 dark:text-zinc-50",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/**
 * Standard dropdown menu item.
 * A clickable item that triggers an action when selected.
 * Supports inset padding for alignment with checkbox/radio items.
 */
const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none select-none focus:bg-black/10 focus:text-zinc-900 data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:focus:bg-white/10 dark:focus:text-zinc-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/**
 * Checkbox menu item.
 * A toggleable item that displays a checkmark when checked.
 * Used for boolean options in menus.
 */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center rounded-sm py-1.5 pr-2 pl-8 text-sm transition-colors outline-none select-none focus:bg-black/10 focus:text-zinc-900 data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:focus:bg-white/10 dark:focus:text-zinc-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

/**
 * Radio menu item.
 * A selectable item within a radio group - only one can be selected.
 * Displays a circle indicator when selected.
 */
const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center rounded-sm py-1.5 pr-2 pl-8 text-sm transition-colors outline-none select-none focus:bg-black/10 focus:text-zinc-900 data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:focus:bg-white/10 dark:focus:text-zinc-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/**
 * Menu label component.
 * Non-interactive text label for grouping menu items.
 * Supports inset padding for alignment.
 */
const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/**
 * Menu separator component.
 * A horizontal line for visually separating groups of menu items.
 */
const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-zinc-100 dark:bg-zinc-800", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/**
 * Keyboard shortcut display component.
 * Renders a keyboard shortcut hint aligned to the right of a menu item.
 * Styled with reduced opacity for visual hierarchy.
 *
 * @example
 * ```tsx
 * <DropdownMenuItem>
 *   Save
 *   <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
 * </DropdownMenuItem>
 * ```
 */
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
