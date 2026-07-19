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
          "border-border/50 bg-card/45 shadow-[var(--shadow-elevation-1)] backdrop-blur-md",
        glass:
          "border-white/9 bg-gradient-to-b from-white/[0.07] to-card/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),var(--shadow-elevation-3)] backdrop-blur-[28px] backdrop-saturate-150",
        interactive:
          "border-white/9 bg-gradient-to-b from-white/[0.07] to-card/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),var(--shadow-elevation-3)] backdrop-blur-[28px] backdrop-saturate-150 hover:border-white/16 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),var(--shadow-elevation-4),0_0_40px_-12px_rgba(59,130,246,0.35)] hover:-translate-y-[3px]",
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
