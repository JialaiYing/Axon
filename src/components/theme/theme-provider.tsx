"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "warm";

const STORAGE_KEY = "axon:theme";
const THEMES: Theme[] = ["light", "dark", "warm"];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function applyThemeToDocument(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");

  // On mount, read whatever the blocking init script (see layout.tsx) already
  // applied to <html data-theme="..."> so React state matches the DOM and we
  // don't get a flash or a hydration mismatch.
  React.useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (current && THEMES.includes(current)) {
      setThemeState(current);
    }
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeToDocument(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (e.g. private browsing) — theme just won't persist.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

export { THEMES };
