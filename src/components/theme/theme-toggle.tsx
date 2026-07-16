"use client";

import { Sun, Moon, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/components/theme/theme-provider";

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light theme" },
  { value: "dark", icon: Moon, label: "Dark theme" },
  { value: "warm", icon: Flame, label: "Warm theme" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={isActive}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors duration-150",
              isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:bg-card hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        );
      })}
    </div>
  );
}
