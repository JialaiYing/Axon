"use client";

import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Trend } from "@/lib/percent-trend";
import { cn } from "@/lib/utils";

/** Compact up/down chip used on Dashboard Focus today and Analytics Focus time. */
export const TrendBadge = React.memo(function TrendBadge({ direction, label }: Trend) {
  const Icon = direction === "up" ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-[11px] font-medium tabular-nums",
        direction === "up" && "text-success",
        direction === "down" && "text-danger"
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
});
