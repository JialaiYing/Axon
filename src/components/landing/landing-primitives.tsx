import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared landing layout language — one container, one section rhythm,
 * one eyebrow / heading pattern. Keeps every marketing section reading
 * as the same product rather than a collage of one-offs.
 */

export const LANDING_MAX = "max-w-6xl";
export const LANDING_GUTTER = "px-6";
/** Vertical padding for standard content sections. */
export const LANDING_SECTION_Y = "py-20 md:py-28";
/** Slightly taller for closing CTA. */
export const LANDING_SECTION_Y_LG = "py-24 md:py-32";

export function LandingContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full", LANDING_MAX, LANDING_GUTTER, className)}>
      {children}
    </div>
  );
}

export function LandingSection({
  id,
  children,
  className,
  size = "default",
  bordered = true,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  size?: "default" | "lg";
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        size === "lg" ? LANDING_SECTION_Y_LG : LANDING_SECTION_Y,
        bordered && "border-t border-border/50",
        className
      )}
    >
      {children}
    </section>
  );
}

export function LandingEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}

export function LandingHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "font-display font-medium text-foreground text-balance",
        Tag === "h1" && "text-4xl leading-[1.05] tracking-[-0.035em] md:text-6xl",
        Tag === "h2" && "text-3xl leading-[1.1] tracking-[-0.03em] md:text-4xl",
        Tag === "h3" && "text-xl leading-snug tracking-[-0.025em] md:text-2xl",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function LandingLead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[15px] leading-relaxed text-muted-foreground text-pretty md:text-base",
        className
      )}
    >
      {children}
    </p>
  );
}

export function LandingHeader({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "max-w-xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? <LandingEyebrow>{eyebrow}</LandingEyebrow> : null}
      <LandingHeading className={cn(eyebrow && "mt-3")}>{title}</LandingHeading>
      {description ? (
        <LandingLead className="mt-3 md:mt-4">{description}</LandingLead>
      ) : null}
    </div>
  );
}

/** Soft light lift for marketing product mocks against the near-black page. */
export const landingPreviewHaloStyle: React.CSSProperties = {
  boxShadow:
    "0 0 0 1px rgba(255,255,255,0.12), 0 0 40px 6px rgba(255,255,255,0.16), 0 0 100px 28px rgba(255,255,255,0.08)",
};

/** Traffic-light chrome used on product frames — one pattern, every shot. */
export function ProductChrome({
  title,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      data-theme="dark"
      className={cn(
        "relative flex flex-col overflow-hidden rounded-md border border-border/50 bg-background shadow-[var(--shadow-elevation-2)]",
        className
      )}
    >
      <div
        className="flex shrink-0 items-center gap-1.5 border-b border-border/50 bg-surface px-3 py-2"
        aria-hidden
      >
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" />
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" />
        <span className="ml-1.5 text-[10px] text-muted-foreground">{title}</span>
      </div>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </div>
  );
}

/**
 * Seamless hairline-divided grid — a border-and-background sandwich where the
 * 1px gaps between cells read as dividers. Children supply their own
 * `bg-background`/`bg-surface` fill and padding so density can vary per use
 * (product tiles vs. stat tiles vs. principle tiles).
 */
export function HairlineGrid({
  children,
  className,
  cols = 2,
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-lg border border-border bg-white/[0.06]",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-3",
        cols === 4 && "grid-cols-2 sm:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Primary marketing CTA — flat accent, no lift/scale (Linear/Vercel style). */
export const landingPrimaryCtaClassName =
  "h-10 rounded-md border-0 bg-accent px-5 text-sm font-medium text-accent-foreground shadow-none hover:translate-y-0 hover:scale-100 hover:bg-accent/90 hover:shadow-none active:scale-[0.98]";

/** Secondary marketing CTA — bordered, pairs with the primary in Hero/Final CTA. Use with `variant="outline"`. */
export const landingSecondaryCtaClassName =
  "h-10 rounded-md px-5 text-sm font-medium shadow-none hover:translate-y-0 hover:scale-100 hover:shadow-none active:scale-[0.98]";

export const landingNavCtaClassName =
  "h-8 rounded-md border-0 bg-accent px-3 text-[13px] font-medium text-accent-foreground shadow-none hover:translate-y-0 hover:scale-100 hover:bg-accent/90 hover:shadow-none active:scale-[0.98]";

export const landingFocusRingClassName =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
