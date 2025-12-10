/**
 * @fileoverview Theme provider component for the Writenex application
 *
 * Manages theme application to the document root element based on user
 * preference stored in Zustand. Supports light, dark, and system themes.
 *
 * ## Features:
 * - Light/dark/system theme modes
 * - System preference detection and live updates
 * - Hydration-safe implementation (prevents flash)
 * - Listens for system theme changes in real-time
 *
 * ## Architecture:
 * Works in conjunction with the inline script in RootLayout for
 * flash-free theme initialization. The inline script handles initial
 * theme on page load, while this provider handles subsequent changes.
 *
 * Theme state is stored in Zustand (`useEditorStore`) and persisted
 * to localStorage, allowing the inline script to read it on load.
 *
 * @module components/ThemeProvider
 * @see {@link useEditorStore} - Zustand store with theme state
 * @see {@link RootLayout} - Root layout with inline theme script
 */

"use client";

import { useEffect, useState } from "react";
import { useEditorStore } from "@/lib/store";

/**
 * Props for the ThemeProvider component.
 *
 * @interface ThemeProviderProps
 */
interface ThemeProviderProps {
  /** Child components to render within the theme context */
  children: React.ReactNode;
}

/**
 * Theme provider component that applies theme to the document root.
 *
 * Reads the theme preference from Zustand store and applies the appropriate
 * class to the document root element. Handles three modes:
 * - `light`: Forces light mode
 * - `dark`: Forces dark mode
 * - `system`: Follows system preference and listens for changes
 *
 * Uses a mounted state to prevent hydration mismatches since theme
 * detection requires browser APIs.
 *
 * @component
 * @example
 * ```tsx
 * // Typically used in RootLayout to wrap the entire app
 * function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ThemeProvider>{children}</ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @param props.children - Child components to render
 * @returns Fragment containing children with theme applied to document root
 */
export function ThemeProvider({
  children,
}: ThemeProviderProps): React.ReactElement {
  const theme = useEditorStore((state) => state.theme);
  const [mounted, setMounted] = useState(false);

  /**
   * Sets mounted state to true after initial render.
   * This prevents hydration mismatches since theme detection
   * requires browser APIs that aren't available during SSR.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Applies the theme to the document root element.
   * Listens for system preference changes when in system mode.
   */
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    /**
     * Applies or removes the dark class from the document root.
     *
     * @param isDark - Whether to apply dark mode
     */
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (theme === "dark") {
      applyTheme(true);
    } else if (theme === "light") {
      applyTheme(false);
    } else {
      // System preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      // Listen for system theme changes
      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };

      mediaQuery.addEventListener("change", listener);

      return () => {
        mediaQuery.removeEventListener("change", listener);
      };
    }
  }, [theme, mounted]);

  return <>{children}</>;
}
