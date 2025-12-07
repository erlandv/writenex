/**
 * @fileoverview FAQ Accordion component for the landing page
 *
 * An accessible accordion component that displays frequently asked questions
 * with expandable/collapsible answers. Implements single-expand behavior where
 * only one item can be open at a time.
 *
 * ## Features:
 * - Single-expand behavior (one item open at a time)
 * - First item expanded by default
 * - Smooth CSS grid animation for expand/collapse
 * - Accessible with aria-expanded attribute
 * - Dark mode support
 *
 * ## Accessibility:
 * - Uses semantic button elements for triggers
 * - Includes aria-expanded attribute for screen readers
 * - Keyboard navigable (Tab, Enter/Space)
 *
 * @module components/landing/FAQAccordion
 * @see {@link FAQSection} - Parent section component on landing page
 */

"use client";

import { useState } from "react";

/**
 * Represents a single FAQ item with question and answer.
 *
 * @interface FAQItem
 */
interface FAQItem {
  /** The question text displayed as the accordion trigger */
  question: string;
  /** The answer text revealed when the accordion item is expanded */
  answer: string;
}

/**
 * Props for the FAQAccordion component.
 *
 * @interface FAQAccordionProps
 */
interface FAQAccordionProps {
  /** Array of FAQ items to display in the accordion */
  faqs: FAQItem[];
}

/**
 * FAQ Accordion component with single-expand behavior.
 *
 * Displays a list of FAQ items where only one can be expanded at a time.
 * The first item is expanded by default. Clicking another item closes
 * the previously opened one. Uses CSS grid for smooth height animations.
 *
 * @component
 * @example
 * ```tsx
 * const faqs = [
 *   { question: "Is it free?", answer: "Yes, completely free!" },
 *   { question: "Do I need to sign up?", answer: "No account required." },
 * ];
 *
 * function FAQPage() {
 *   return <FAQAccordion faqs={faqs} />;
 * }
 * ```
 *
 * @param props - Component props
 * @param props.faqs - Array of FAQ items with question and answer
 * @returns Accordion component with expandable FAQ items
 */
export function FAQAccordion({ faqs }: FAQAccordionProps): React.ReactElement {
  const [openIndex, setOpenIndex] = useState<number>(0);

  /**
   * Toggles the accordion item at the given index.
   * If the item is already open, it closes. Otherwise, it opens
   * and closes any previously open item.
   *
   * @param index - The index of the FAQ item to toggle
   */
  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={faq.question}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          >
            <button
              type="button"
              onClick={() => handleToggle(index)}
              className="flex w-full cursor-pointer items-center justify-between p-6 text-left"
              aria-expanded={isOpen}
            >
              <h3 className="pr-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {faq.question}
              </h3>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center text-zinc-500 transition-transform duration-200 dark:text-zinc-400 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-200 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-6">
                  <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
