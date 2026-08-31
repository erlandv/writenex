/**
 * @fileoverview Theme context and provider for Writenex Astro
 *
 * Manages theme state (light/dark/system) and applies the appropriate
 * class to the document root element. Persists preference to localStorage.
 *
 * @module @writenex/astro/client/context/ThemeContext
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Available theme options
 */
export type Theme = "light" | "dark" | "system";

/**
 * Theme context value interface
 */
interface ThemeContextValue {
  /** Current theme setting */
  theme: Theme;
  /** Resolved theme (actual light/dark being displayed) */
  resolvedTheme: "light" | "dark";
  /** Update theme preference */
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "writenex-astro-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Get system color scheme preference
 */
function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Get stored theme from localStorage
 */
function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return "system";
}

/**
 * Props for ThemeProvider component
 */
interface ThemeProviderProps {
  /** Child components */
  children: ReactNode;
  /** Default theme (optional) */
  defaultTheme?: Theme;
}

/**
 * Theme provider component that manages theme state and applies it to DOM.
 *
 * @component
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps): React.ReactElement {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    return getStoredTheme();
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = getStoredTheme();
    if (stored === "system") return getSystemTheme();
    return stored;
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // localStorage not available
    }
  }, []);

  // Apply theme to document and handle system preference changes
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("wn-dark");
        root.classList.remove("wn-light");
      } else {
        root.classList.add("wn-light");
        root.classList.remove("wn-dark");
      }
      setResolvedTheme(isDark ? "dark" : "light");
    };

    if (theme === "dark") {
      applyTheme(true);
    } else if (theme === "light") {
      applyTheme(false);
    } else {
      // System preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };

      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 *
 * @returns Theme context value
 * @throws Error if used outside ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *   return <button onClick={() => setTheme('dark')}>Dark</button>;
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
