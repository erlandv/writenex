/**
 * @fileoverview Dialog component built on Radix UI Dialog primitive
 *
 * A modal dialog component with overlay, animations, and accessible
 * structure. Exports composable parts for flexible dialog construction.
 *
 * ## Features:
 * - Accessible dialog with proper ARIA attributes
 * - Animated open/close transitions
 * - Dark mode support
 * - Close button with tooltip
 * - Composable sub-components
 *
 * ## Components:
 * - Dialog: Root component (manages open state)
 * - DialogTrigger: Element that opens the dialog
 * - DialogContent: The modal content container
 * - DialogHeader: Container for title and description
 * - DialogFooter: Container for action buttons
 * - DialogTitle: Dialog heading
 * - DialogDescription: Dialog description text
 * - DialogClose: Close button primitive
 * - DialogOverlay: Background overlay
 * - DialogPortal: Portal for rendering outside DOM hierarchy
 *
 * ## Usage:
 * Based on shadcn/ui dialog component pattern.
 *
 * @module components/ui/dialog
 * @see https://ui.shadcn.com/docs/components/dialog
 * @see https://www.radix-ui.com/primitives/docs/components/dialog
 */

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Root dialog component - manages open/closed state */
const Dialog = DialogPrimitive.Root;

/** Element that triggers dialog open when clicked */
const DialogTrigger = DialogPrimitive.Trigger;

/** Portal for rendering dialog outside DOM hierarchy */
const DialogPortal = DialogPrimitive.Portal;

/** Primitive close button - closes dialog when clicked */
const DialogClose = DialogPrimitive.Close;

/**
 * Dialog overlay component.
 * Renders a semi-transparent backdrop behind the dialog content.
 * Includes fade animation on open/close.
 */
const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Dialog content container.
 * The main modal content with positioning, animations, and close button.
 * Renders inside a portal with overlay backdrop.
 */
const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-zinc-200 bg-white p-6 text-zinc-950 shadow-lg duration-200 sm:rounded-lg dark:border-zinc-800 dark:bg-[#161b22] dark:text-zinc-50",
        className
      )}
      {...props}
    >
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogPrimitive.Close className="absolute top-4 right-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-black/10 hover:text-zinc-700 focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none dark:hover:bg-white/10 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </TooltipTrigger>
        <TooltipContent>
          <p>Close</p>
        </TooltipContent>
      </Tooltip>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Dialog header container.
 * Wraps the title and description with proper spacing.
 * Centers text on mobile, left-aligns on larger screens.
 */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/**
 * Dialog footer container.
 * Wraps action buttons with proper layout.
 * Stacks vertically on mobile, horizontal on larger screens.
 */
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

/**
 * Dialog title component.
 * Renders the main heading for the dialog.
 * Uses Radix UI Title primitive for accessibility.
 */
const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg leading-none font-semibold tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Dialog description component.
 * Renders descriptive text below the title.
 * Uses Radix UI Description primitive for accessibility.
 */
const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-zinc-500 dark:text-zinc-400", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
