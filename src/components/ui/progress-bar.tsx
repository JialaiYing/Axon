"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  /** Override the fill — default is accent (growth/motion); use for done → success, etc. */
  barClassName?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  className,
  barClassName,
  size = "md",
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-pill bg-white/[0.06] shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] light:bg-border/60 light:shadow-none",
          sizeMap[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-pill transition-all duration-500 ease-out",
            barClassName ?? "bg-accent/80 light:bg-accent/75"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-xs font-medium tabular-nums text-muted">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
