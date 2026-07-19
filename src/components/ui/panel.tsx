"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The one surface primitive every section should reach for. Three variants
 * cover every case in the app — resist adding a fourth without a real reason.
 *
 *  - `standard`    dense UI: calendar cells, forms, toolbars.
 *  - `glass`       hero/stat surfaces that should read as floating glass.
 *  - `interactive` glass + hover elevation/glow, for clickable cards/columns.
 */
const panelVariants = cva(
  "relative rounded-xl border transition-[border-color,box-shadow,transform] duration-300",
  {
    variants: {
      variant: {
        standard:
          "border-border/50 bg-card shadow-[var(--shadow-elevation-1)]",
        glass:
          "border-white/8 bg-gradient-to-b from-white/[0.05] to-card/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),var(--shadow-elevation-2)] backdrop-blur-[14px] backdrop-saturate-120",
        interactive:
          "border-white/8 bg-card shadow-[var(--shadow-elevation-1)] hover:border-white/14 hover:bg-card-hover hover:shadow-[var(--shadow-elevation-2)] hover:-translate-y-[2px]",
      },
    },
    defaultVariants: {
      variant: "standard",
    },
  }
);

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(panelVariants({ variant, className }))} {...props} />
  )
);
Panel.displayName = "Panel";
