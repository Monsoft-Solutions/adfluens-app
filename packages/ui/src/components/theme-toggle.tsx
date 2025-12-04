import * as React from "react";
import { Moon, Sun, Monitor, ChevronDown, Check } from "lucide-react";
import { Button } from "./button";
import { cn } from "../lib/utils";

type Theme = "light" | "dark" | "system";

type ThemeToggleBaseProps = {
  /** Current theme setting */
  theme: Theme;
  /** Callback when theme changes */
  onThemeChange: (theme: Theme) => void;
  /** Additional CSS classes */
  className?: string;
};

/* ==========================================================================
   VARIANT 1: ThemeToggle - Full-width button with label (for sidebar)
   ========================================================================== */

/**
 * Theme toggle button component with label
 *
 * Cycles through: system → light → dark → system
 * Best used in sidebars or settings panels where space allows.
 *
 * @example
 * const { theme, setTheme } = useTheme();
 * <ThemeToggle theme={theme} onThemeChange={setTheme} />
 */
export const ThemeToggle: React.FC<ThemeToggleBaseProps> = ({
  theme,
  onThemeChange,
  className,
}) => {
  const handleClick = () => {
    const nextTheme: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    onThemeChange(nextTheme);
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
      default:
        return "System";
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "w-full justify-start gap-2 text-muted-foreground hover:text-foreground",
        className
      )}
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
    >
      {getIcon()}
      <span className="text-sm">{getLabel()} theme</span>
    </Button>
  );
};

/* ==========================================================================
   VARIANT 2: ThemeToggleIcon - Minimalistic icon-only button
   ========================================================================== */

/**
 * Minimalistic icon-only theme toggle button
 *
 * Shows current theme icon, cycles on click.
 * Best for headers, toolbars, or compact UI areas.
 *
 * @example
 * const { theme, resolvedTheme, setTheme } = useTheme();
 * <ThemeToggleIcon theme={theme} resolvedTheme={resolvedTheme} onThemeChange={setTheme} />
 */
type ThemeToggleIconProps = ThemeToggleBaseProps & {
  /** The actual applied theme (light or dark) - used to show sun/moon based on what's visible */
  resolvedTheme?: "light" | "dark";
  /** Button size variant */
  size?: "sm" | "default" | "lg";
};

export const ThemeToggleIcon: React.FC<ThemeToggleIconProps> = ({
  theme,
  resolvedTheme,
  onThemeChange,
  className,
  size = "default",
}) => {
  const handleClick = () => {
    const nextTheme: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    onThemeChange(nextTheme);
  };

  // Use resolvedTheme for icon display if provided, otherwise use theme
  const displayTheme = resolvedTheme ?? (theme === "system" ? "light" : theme);

  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    default: "h-[1.1rem] w-[1.1rem]",
    lg: "h-5 w-5",
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      className={cn(sizeClasses[size], "relative overflow-hidden", className)}
      aria-label={`Toggle theme. Current: ${theme}`}
    >
      {/* Sun icon - visible in light mode */}
      <Sun
        className={cn(
          iconSizes[size],
          "absolute transition-all duration-300",
          displayTheme === "light"
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        )}
      />
      {/* Moon icon - visible in dark mode */}
      <Moon
        className={cn(
          iconSizes[size],
          "absolute transition-all duration-300",
          displayTheme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

/* ==========================================================================
   VARIANT 3: ThemeSwitcher - Pill-style segmented control
   ========================================================================== */

const themes = [
  { key: "system" as const, icon: Monitor, label: "System theme" },
  { key: "light" as const, icon: Sun, label: "Light theme" },
  { key: "dark" as const, icon: Moon, label: "Dark theme" },
];

/**
 * Pill-style theme switcher with all options visible
 *
 * Shows system/light/dark as a segmented control.
 * Best for settings pages or when you want all options visible at once.
 *
 * @example
 * const { theme, setTheme } = useTheme();
 * <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
 */
export const ThemeSwitcher: React.FC<ThemeToggleBaseProps> = ({
  theme,
  onThemeChange,
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center rounded-md bg-muted p-1 ring-1 ring-border",
        className
      )}
      role="radiogroup"
      aria-label="Select theme"
    >
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key;

        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            onClick={() => onThemeChange(key)}
            className={cn(
              "relative inline-flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
};

/* ==========================================================================
   VARIANT 4: ThemeDropdown - Dropdown menu style
   ========================================================================== */

/**
 * Dropdown-style theme selector
 *
 * Compact button that expands to show options.
 * Uses native HTML for simplicity (no Radix dependency needed).
 *
 * @example
 * const { theme, setTheme } = useTheme();
 * <ThemeDropdown theme={theme} onThemeChange={setTheme} />
 */
export const ThemeDropdown: React.FC<ThemeToggleBaseProps> = ({
  theme,
  onThemeChange,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  const getCurrentIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const handleSelect = (selectedTheme: Theme) => {
    onThemeChange(selectedTheme);
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {getCurrentIcon()}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </Button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute right-0 top-full z-50 mt-1 min-w-32",
            "rounded-md border border-border bg-popover p-1 shadow-md",
            "animate-fade-in"
          )}
        >
          {themes.map(({ key, icon: Icon }) => {
            const isActive = theme === key;

            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left capitalize">{key}</span>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
