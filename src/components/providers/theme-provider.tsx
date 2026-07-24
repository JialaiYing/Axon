"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "axon:theme";

// Light mode is a dashboard-only preference. Marketing + auth surfaces
// always force dark regardless of the stored preference.
const ALWAYS_DARK_ROUTES = new Set(["/", "/login", "/privacy", "/terms", "/faq"]);

const THEME_TRANSITION_MS = 280;

function isThemeableRoute(pathname: string | null) {
  return pathname !== null && !ALWAYS_DARK_ROUTES.has(pathname);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  hydrated: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function commitTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

/**
 * Applies the theme attribute. When `animate` is true, uses the View
 * Transitions API (crossfade) or a short CSS color-transition fallback.
 * Hydration / route sync should pass `animate: false` to avoid a flash.
 */
function applyTheme(theme: ThemeMode, { animate = false }: { animate?: boolean } = {}) {
  if (typeof document === "undefined") return;

  if (!animate || prefersReducedMotion()) {
    commitTheme(theme);
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (update: () => void) => { finished: Promise<void> };
  };

  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(() => commitTheme(theme));
    return;
  }

  // Fallback for browsers without View Transitions — brief paint transitions.
  const root = document.documentElement;
  root.setAttribute("data-theme-transition", "");
  commitTheme(theme);
  window.setTimeout(() => {
    root.removeAttribute("data-theme-transition");
  }, THEME_TRANSITION_MS);
}

// Dashboard-only design scope (Inter/JetBrains Mono fonts, sharp corner
// radii) — same route split as the theme, kept as a separate attribute so
// it composes independently of dark/light. Mirrors the inline script in
// app/layout.tsx which sets this before first paint.
function applyScope(isDashboard: boolean) {
  if (typeof document === "undefined") return;
  if (isDashboard) {
    document.documentElement.setAttribute("data-scope", "dashboard");
  } else {
    document.documentElement.removeAttribute("data-scope");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = React.useState<ThemeMode>("dark");
  const [hydrated, setHydrated] = React.useState(false);
  /** User-initiated toggles animate; hydration / route sync do not. */
  const animateNextTheme = React.useRef(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const next: ThemeMode = stored === "light" ? "light" : "dark";
      setThemeState(next);
    } catch {
      setThemeState("dark");
    }
    setHydrated(true);
  }, []);

  // Re-applies whenever the stored preference OR the route changes, so
  // navigating back to the homepage always snaps to dark even if the user
  // picked light mode inside the dashboard.
  React.useEffect(() => {
    const animate = animateNextTheme.current;
    animateNextTheme.current = false;
    applyTheme(isThemeableRoute(pathname) ? theme : "dark", { animate });
    applyScope(isThemeableRoute(pathname));
  }, [theme, pathname]);

  const setTheme = React.useCallback((next: ThemeMode) => {
    animateNextTheme.current = true;
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, hydrated }),
    [theme, setTheme, hydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
