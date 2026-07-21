"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Pass a rendered icon element, e.g. `<Inbox className="h-5.5 w-5.5 text-muted" />` —
   *  keeps this usable from server-component call sites (a bare component
   *  reference can't cross the server/client boundary, an element can). */
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * One consistent "nothing here yet" surface — replaces the ad-hoc empty
 * blocks that used to be hand-rolled per section.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60 bg-surface/20 p-10 text-center backdrop-blur-sm",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-foreground/6">
        {icon}
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
