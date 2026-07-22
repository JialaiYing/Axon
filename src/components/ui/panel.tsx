"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The one surface primitive every section should reach for. Three variants
 * cover every case in the app — resist adding a fourth without a real reason.
 *
 *  - `standard`    dense UI: calendar cells, forms, toolbars.
 *  - `glass`       hero/stat surfaces — same flat card, one shadow step up.
 *  - `interactive` flat card + hover lift, for clickable cards/columns.
 */
const panelVariants = cva(
  "relative rounded-xl border transition-[border-color,box-shadow,transform,background-color] duration-300",
  {
    variants: {
      variant: {
        standard:
          "border-border bg-card shadow-[var(--shadow-elevation-1),inset_0_1px_0_rgba(255,255,255,0.04)] light:shadow-[var(--shadow-elevation-1)]",
        glass:
          "border-border bg-card shadow-[var(--shadow-elevation-2),inset_0_1px_0_rgba(255,255,255,0.05)] light:shadow-[var(--shadow-elevation-2)]",
        interactive:
          "border-border bg-card shadow-[var(--shadow-elevation-1)] hover:border-border-strong hover:bg-card-hover hover:shadow-[var(--shadow-elevation-2)]",
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
