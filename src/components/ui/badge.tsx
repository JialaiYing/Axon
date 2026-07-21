import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-border/70 bg-surface/80 text-muted",
        accent: "border-accent/25 bg-accent-muted/80 text-accent",
        secondary: "border-secondary/25 bg-secondary-muted/80 text-secondary",
        success: "border-success/25 bg-success-muted/80 text-success",
        warning: "border-warning/25 bg-warning-muted/80 text-warning",
        danger: "border-danger/25 bg-danger-muted/80 text-danger",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
