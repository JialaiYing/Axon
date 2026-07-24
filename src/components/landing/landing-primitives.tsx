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
        "text-[11px] font-medium uppercase tracking-[0.14em] text-muted",
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
        "font-display font-semibold tracking-tight text-foreground text-balance",
        Tag === "h1" && "text-4xl leading-[1.05] md:text-6xl",
        Tag === "h2" && "text-3xl leading-[1.1] md:text-4xl",
        Tag === "h3" && "text-xl leading-snug md:text-2xl",
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

/** Primary marketing CTA — flat accent, no lift/scale (Linear/Vercel style). */
export const landingPrimaryCtaClassName =
  "h-10 rounded-md border-0 bg-accent px-5 text-sm font-medium text-accent-foreground shadow-none hover:translate-y-0 hover:scale-100 hover:bg-accent/90 hover:shadow-none active:scale-[0.98]";

export const landingNavCtaClassName =
  "h-8 rounded-md border-0 bg-accent px-3 text-[13px] font-medium text-accent-foreground shadow-none hover:translate-y-0 hover:scale-100 hover:bg-accent/90 hover:shadow-none active:scale-[0.98]";

export const landingFocusRingClassName =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
