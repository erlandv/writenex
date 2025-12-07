/**
 * @fileoverview Welcome Tour Modal Component
 *
 * This component displays an onboarding carousel to first-time users,
 * introducing key features of Writenex. It uses a horizontal carousel
 * with dot indicators and navigation buttons.
 *
 * ## Features:
 * - 5-slide carousel with smooth transitions
 * - Dot indicators showing current position
 * - Previous/Next navigation buttons
 * - Skip button to close immediately
 * - Get Started button on final slide
 * - Keyboard navigation (Arrow keys, Escape)
 * - Persists completion to localStorage
 *
 * ## Trigger:
 * - Automatically opens on first visit
 * - Can be reopened via Help button in Header
 *
 * @module components/editor/WelcomeTourModal
 * @see {@link ONBOARDING_SLIDES} - Slide content definitions
 * @see {@link Header} - Contains Help button to reopen
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@writenex/ui" // dialog";
import { Button } from "@writenex/ui" // button";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { useEditorStore } from "@writenex/store";
import { ONBOARDING_SLIDES, TOTAL_SLIDES } from "../onboarding";
import { cn } from "@writenex/utils";

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

/**
 * Props for the SlideContent component
 */
interface SlideContentProps {
  /** Index of the slide to display */
  slideIndex: number;
}

/**
 * Renders the content of a single onboarding slide.
 *
 * @component
 * @param props - Component props
 * @returns Slide content with icon, title, description, and tip
 */
function SlideContent({ slideIndex }: SlideContentProps): React.ReactElement {
  const slide = ONBOARDING_SLIDES[slideIndex];

  if (!slide) {
    return <div>Loading...</div>;
  }

  const IconComponent = slide.icon;

  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      {/* Icon */}
      <div className="mb-6 rounded-full bg-blue-50 p-4 dark:bg-blue-900/30">
        <IconComponent className="h-12 w-12 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Title */}
      <h3 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {slide.title}
      </h3>

      {/* Description */}
      <p className="mb-4 max-w-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {slide.description}
      </p>

      {/* Tip */}
      {slide.tip && (
        <p className="flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
          {slide.tip}
        </p>
      )}
    </div>
  );
}

/**
 * Props for the DotIndicators component
 */
interface DotIndicatorsProps {
  /** Total number of slides */
  total: number;
  /** Current active slide index */
  current: number;
  /** Callback when a dot is clicked */
  onDotClick: (index: number) => void;
}

/**
 * Renders dot indicators for carousel navigation.
 *
 * @component
 * @param props - Component props
 * @returns Row of clickable dot indicators
 */
function DotIndicators({
  total,
  current,
  onDotClick,
}: DotIndicatorsProps): React.ReactElement {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          type="button"
          tabIndex={-1}
          onClick={() => onDotClick(index)}
          className={cn(
            "h-2 w-2 cursor-pointer rounded-full transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            index === current
              ? "w-6 bg-blue-600 dark:bg-blue-500"
              : "bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500"
          )}
          aria-label={`Go to slide ${index + 1}`}
          aria-current={index === current ? "step" : undefined}
        />
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Welcome Tour modal component for onboarding first-time users.
 *
 * Displays a carousel of slides introducing Writenex features.
 * Automatically opens on first visit and can be reopened via Help button.
 *
 * @component
 * @example
 * ```tsx
 * // Used in MarkdownEditor.tsx
 * function App() {
 *   return (
 *     <>
 *       <MarkdownEditor />
 *       <WelcomeTourModal />
 *     </>
 *   );
 * }
 * ```
 *
 * @returns Modal dialog with onboarding carousel
 */
export function WelcomeTourModal(): React.ReactElement {
  const { isOnboardingOpen, setOnboardingOpen, completeOnboarding } =
    useEditorStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === TOTAL_SLIDES - 1;

  /**
   * Go to the next slide
   */
  const handleNext = useCallback(() => {
    if (isLastSlide) {
      completeOnboarding();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [isLastSlide, completeOnboarding]);

  /**
   * Go to the previous slide
   */
  const handlePrevious = useCallback(() => {
    if (!isFirstSlide) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [isFirstSlide]);

  /**
   * Jump to a specific slide
   */
  const handleDotClick = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  /**
   * Handle dialog open state change.
   * Closing the dialog (via X button, Escape, or overlay click) marks
   * onboarding as complete to respect user's choice to dismiss.
   */
  const handleOpenChange = useCallback(
    (open: boolean) => {
      // Always reset to first slide when opening or closing
      setCurrentSlide(0);
      if (open) {
        setOnboardingOpen(true);
      } else {
        // User closed the dialog - treat as complete to respect their choice
        completeOnboarding();
      }
    },
    [setOnboardingOpen, completeOnboarding]
  );

  /**
   * Keyboard navigation within the carousel
   */
  useEffect(() => {
    if (!isOnboardingOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOnboardingOpen, handleNext, handlePrevious]);

  return (
    <Dialog open={isOnboardingOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        aria-describedby="onboarding-description"
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">Welcome to Writenex</DialogTitle>
        <DialogDescription id="onboarding-description" className="sr-only">
          A guided tour of Writenex features. Use arrow keys or buttons to
          navigate.
        </DialogDescription>

        {/* Carousel container */}
        <div className="relative overflow-hidden">
          {/* Slides */}
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {ONBOARDING_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                className="w-full shrink-0"
                role="tabpanel"
                aria-label={`Slide ${index + 1} of ${TOTAL_SLIDES}: ${slide.title}`}
              >
                <SlideContent slideIndex={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <DotIndicators
          total={TOTAL_SLIDES}
          current={currentSlide}
          onDotClick={handleDotClick}
        />

        {/* Navigation buttons */}
        <div className="flex items-center justify-between px-6 pb-6">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={isFirstSlide}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button onClick={handleNext} className="gap-1">
            {isLastSlide ? (
              "Get Started"
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
