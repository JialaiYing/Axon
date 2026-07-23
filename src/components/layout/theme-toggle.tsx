"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { headerIconButtonClass } from "@/components/layout/header-chrome";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme, hydrated } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!hydrated}
      className={cn(headerIconButtonClass(false), "disabled:opacity-0")}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
