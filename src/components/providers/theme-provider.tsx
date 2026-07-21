"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "axon:theme";

// Light mode is a dashboard-only preference. Marketing + auth surfaces
// always force dark regardless of the stored preference.
const ALWAYS_DARK_ROUTES = new Set(["/", "/login", "/privacy", "/terms", "/faq"]);

function isThemeableRoute(pathname: string | null) {
  return pathname !== null && !ALWAYS_DARK_ROUTES.has(pathname);
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  hydrated: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = React.useState<ThemeMode>("dark");
  const [hydrated, setHydrated] = React.useState(false);

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
    applyTheme(isThemeableRoute(pathname) ? theme : "dark");
  }, [theme, pathname]);

  const setTheme = React.useCallback((next: ThemeMode) => {
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
