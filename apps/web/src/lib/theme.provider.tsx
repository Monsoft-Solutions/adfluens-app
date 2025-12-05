import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

/**
 * Theme options for the application
 * - light: "Paper & Ink" theme from DESIGN.md
 * - dark: "Obsidian & Neon" theme from DESIGN.md
 * - system: Auto-detect from OS preference
 */
type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  /** Current theme setting (includes 'system' option) */
  theme: Theme;
  /** Resolved theme (only 'light' or 'dark' - what's actually applied) */
  resolvedTheme: "light" | "dark";
  /** Update theme preference */
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "adfluens-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Get system color scheme preference
 */
const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * Get initial theme from localStorage or default to system
 */
const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
};

/**
 * Apply theme class to document element
 */
const applyTheme = (resolvedTheme: "light" | "dark") => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
};

type ThemeProviderProps = {
  children: React.ReactNode;
  /** Default theme if no preference is stored */
  defaultTheme?: Theme;
};

/**
 * ThemeProvider component for managing application theme
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Auto-detects system preference when set to "system"
 * - Listens for system preference changes
 * - Prevents flash of unstyled content (FOUC)
 *
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "system",
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Use default on first render, will be updated in useEffect
    if (typeof window === "undefined") return defaultTheme;
    return getInitialTheme();
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const initial = getInitialTheme();
    return initial === "system" ? getSystemTheme() : initial;
  });

  /**
   * Update theme with optional view transitions support
   */
  const setTheme = useCallback((newTheme: Theme) => {
    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;

    // Use View Transitions API if available for smooth theme change
    if ("startViewTransition" in document) {
      (
        document as Document & { startViewTransition: (fn: () => void) => void }
      ).startViewTransition(() => {
        setThemeState(newTheme);
        setResolvedTheme(resolved);
        applyTheme(resolved);
        localStorage.setItem(STORAGE_KEY, newTheme);
      });
    } else {
      setThemeState(newTheme);
      setResolvedTheme(resolved);
      applyTheme(resolved);
      localStorage.setItem(STORAGE_KEY, newTheme);
    }
  }, []);

  // Apply theme on mount and listen for system preference changes
  useEffect(() => {
    const stored = getInitialTheme();
    const resolved = stored === "system" ? getSystemTheme() : stored;

    setThemeState(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if theme is set to "system"
      const currentTheme = localStorage.getItem(STORAGE_KEY) || "system";
      if (currentTheme === "system") {
        const newResolved = e.matches ? "dark" : "light";
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 *
 * @example
 * const { theme, resolvedTheme, setTheme } = useTheme();
 *
 * // Toggle between light and dark
 * setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
 *
 * // Set to system preference
 * setTheme('system');
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
