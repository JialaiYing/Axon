"use client";

import * as React from "react";

interface ShellChromeContextValue {
  /** Immersive: hide sidebar so the current page fills the viewport. */
  immersive: boolean;
  setImmersive: (value: boolean) => void;
  /** Pomodoro Focus Mode: hide the sidebar while the overlay is up. */
  focusLock: boolean;
  setFocusLock: (value: boolean) => void;
}

const ShellChromeContext = React.createContext<ShellChromeContextValue | null>(null);

export function ShellChromeProvider({
  immersive,
  setImmersive,
  focusLock,
  setFocusLock,
  children,
}: {
  immersive: boolean;
  setImmersive: (value: boolean) => void;
  focusLock: boolean;
  setFocusLock: (value: boolean) => void;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ immersive, setImmersive, focusLock, setFocusLock }),
    [immersive, setImmersive, focusLock, setFocusLock]
  );
  return <ShellChromeContext.Provider value={value}>{children}</ShellChromeContext.Provider>;
}

export function useShellChrome() {
  const ctx = React.useContext(ShellChromeContext);
  if (!ctx) {
    return {
      immersive: false,
      setImmersive: () => {},
      focusLock: false,
      setFocusLock: () => {},
    };
  }
  return ctx;
}
