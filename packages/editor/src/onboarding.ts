/**
 * @fileoverview Onboarding Configuration
 *
 * This file defines the content for the Welcome Tour / Onboarding experience.
 * It contains slide definitions that are displayed to first-time users.
 *
 * ## Structure:
 * Each slide has an icon, title, description, and optional tip.
 * The slides are designed to highlight key features and value propositions.
 *
 * @module lib/onboarding
 * @see {@link WelcomeTourModal} - Component that displays these slides
 */

import {
  Shield,
  Files,
  History,
  Sparkles,
  Keyboard,
  Eye,
  type LucideIcon,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Represents a single slide in the onboarding carousel
 */
export interface OnboardingSlide {
  /** Unique identifier for the slide */
  id: string;
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Main title of the slide */
  title: string;
  /** Description text explaining the feature */
  description: string;
  /** Optional tip or keyboard shortcut hint */
  tip?: string;
}

// =============================================================================
// SLIDE DATA
// =============================================================================

/**
 * Array of onboarding slides shown to first-time users.
 *
 * The slides are ordered to:
 * 1. Establish trust (privacy)
 * 2. Show core functionality (documents, history)
 * 3. Highlight power features (focus, shortcuts)
 */
export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "wysiwyg",
    icon: Eye,
    title: "WYSIWYG Editing",
    description:
      "See your changes instantly. Forget about complex syntax tags. Just start typing and let it flow.",
    tip: "Use the toolbar for quick formatting options",
  },
  {
    id: "documents",
    icon: Files,
    title: "Multiple Documents",
    description:
      "Keep all your drafts open. Switch between multiple documents instantly to stay in the zone.",
    tip: "Double-click any tab to rename your document",
  },
  {
    id: "history",
    icon: History,
    title: "Version History",
    description:
      "Never lose a single thought. We auto-save everything and keep your full version history safe.",
    tip: "Press Ctrl+H to toggle version history",
  },
  {
    id: "focus",
    icon: Sparkles,
    title: "Focus Mode",
    description:
      "Block out all the noise. Hide the interface and focus purely on your writing flow and words.",
    tip: "Press Ctrl+Shift+E for Focus Mode",
  },
  {
    id: "shortcuts",
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    description:
      "Keep your hands on the keys. Fly through every editing task using simple, efficient power shortcuts.",
    tip: "Press Ctrl+/ to reveal the cheat sheet",
  },
  {
    id: "privacy",
    icon: Shield,
    title: "100% Client-side.",
    description:
      "Your documents are processed locally on your device and never leave your browser.",
    tip: "All processing happens locally in your browser.",
  },
];

/**
 * Total number of onboarding slides
 */
export const TOTAL_SLIDES = ONBOARDING_SLIDES.length;
