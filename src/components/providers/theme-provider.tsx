"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_PALETTE_ID,
  isPaletteId,
  isPaletteUnlocked,
  type PaletteId,
} from "@/lib/palettes/catalog";
import { useUserStats } from "@/hooks/use-user-stats";
import { useDevUnlockAll } from "@/hooks/use-dev-unlock-all";

export type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "axon:theme";
const PALETTE_STORAGE_KEY = "axon:palette";

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
  /** Equipped dark palette id (ignored visually while light mode is on). */
  paletteId: PaletteId;
  setPaletteId: (id: PaletteId) => void;
  hydrated: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function commitTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

function commitPalette(paletteId: PaletteId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-palette", paletteId);
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

  const root = document.documentElement;
  root.setAttribute("data-theme-transition", "");
  commitTheme(theme);
  window.setTimeout(() => {
    root.removeAttribute("data-theme-transition");
  }, THEME_TRANSITION_MS);
}

function applyPalette(paletteId: PaletteId, { animate = false }: { animate?: boolean } = {}) {
  if (typeof document === "undefined") return;

  if (!animate || prefersReducedMotion()) {
    commitPalette(paletteId);
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (update: () => void) => { finished: Promise<void> };
  };

  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(() => commitPalette(paletteId));
    return;
  }

  const root = document.documentElement;
  root.setAttribute("data-theme-transition", "");
  commitPalette(paletteId);
  window.setTimeout(() => {
    root.removeAttribute("data-theme-transition");
  }, THEME_TRANSITION_MS);
}

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
  const { stats, hydrated: statsHydrated } = useUserStats();
  const level = stats.level || 1;
  const unlockAll = useDevUnlockAll();

  const [theme, setThemeState] = React.useState<ThemeMode>("dark");
  const [paletteId, setPaletteState] = React.useState<PaletteId>(DEFAULT_PALETTE_ID);
  const [hydrated, setHydrated] = React.useState(false);
  const animateNextTheme = React.useRef(false);
  const animateNextPalette = React.useRef(false);

  React.useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      setThemeState(storedTheme === "light" ? "light" : "dark");
      const storedPalette = window.localStorage.getItem(PALETTE_STORAGE_KEY);
      setPaletteState(isPaletteId(storedPalette) ? storedPalette : DEFAULT_PALETTE_ID);
    } catch {
      setThemeState("dark");
      setPaletteState(DEFAULT_PALETTE_ID);
    }
    setHydrated(true);
  }, []);

  // If the stored palette is locked for this account's level, fall back to Axon
  // without rewriting storage until the user picks something else.
  const effectivePaletteId = React.useMemo(() => {
    if (!statsHydrated) return paletteId;
    return isPaletteUnlocked(paletteId, level) ? paletteId : DEFAULT_PALETTE_ID;
  }, [paletteId, level, statsHydrated, unlockAll]);

  React.useEffect(() => {
    const animate = animateNextTheme.current;
    animateNextTheme.current = false;
    const onThemeable = isThemeableRoute(pathname);
    applyTheme(onThemeable ? theme : "dark", { animate });
    applyScope(onThemeable);
  }, [theme, pathname]);

  React.useEffect(() => {
    const animate = animateNextPalette.current;
    animateNextPalette.current = false;
    const onThemeable = isThemeableRoute(pathname);
    // Marketing always Axon; light mode keeps data-palette set but CSS ignores it.
    const nextPalette = onThemeable ? effectivePaletteId : DEFAULT_PALETTE_ID;
    applyPalette(nextPalette, { animate });
  }, [effectivePaletteId, pathname]);

  const setTheme = React.useCallback((next: ThemeMode) => {
    animateNextTheme.current = true;
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setPaletteId = React.useCallback(
    (next: PaletteId) => {
      if (!isPaletteUnlocked(next, level)) return;
      animateNextPalette.current = true;
      setPaletteState(next);
      try {
        window.localStorage.setItem(PALETTE_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    },
    [level, unlockAll]
  );

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      paletteId: effectivePaletteId,
      setPaletteId,
      hydrated,
    }),
    [theme, setTheme, effectivePaletteId, setPaletteId, hydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
