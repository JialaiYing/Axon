"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Soft icon drawn against the surface — no bordered tile. Pass e.g. `<Inbox className="h-8 w-8" />`. */
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  /** Larger action button — used when the empty state is the primary surface. */
  actionSize?: "sm" | "default" | "lg";
  /** Nested chart/panel empties — smaller type and icon. */
  compact?: boolean;
  /**
   * `integrated` (default) — bare icon + type on the page surface, no dashed frame.
   * `framed` — dashed border for standalone empty panels that need a container.
   */
  variant?: "integrated" | "framed";
}

/**
 * Shared empty surface for “nothing here yet” moments.
 * Title size matches Pomodoro idle (`18/20px`); icons sit bare on the background.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  titleClassName,
  descriptionClassName,
  actionSize = "sm",
  compact = false,
  variant = "integrated",
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        variant === "framed" &&
          "rounded-md border border-dashed border-border/60 light:border-border light:bg-card",
        compact ? "min-h-[160px] p-4" : "min-h-[320px] p-10",
        className
      )}
    >
      {icon ? (
        <div
          className={cn(
            "text-muted-foreground",
            compact ? "[&_svg]:h-5 [&_svg]:w-5" : "[&_svg]:h-8 [&_svg]:w-8"
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm">
        <p
          className={cn(
            compact
              ? "text-[14px] font-medium text-foreground"
              : "text-[18px] font-semibold tracking-tight text-foreground sm:text-[20px]",
            titleClassName
          )}
        >
          {title}
        </p>
        {description && (
          <p
            className={cn(
              "mt-1.5 text-[14px] leading-relaxed text-muted-foreground",
              descriptionClassName
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button size={actionSize} onClick={onAction} className="mt-1 shadow-none">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
