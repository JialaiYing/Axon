"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

/**
 * Core-loop tour only (≤4 steps). Legacy per-page tips are collapsed into
 * this single first-run flow focused on Kanban + Pomodoro.
 */
export type OnboardingFeature =
  | "dashboard"
  | "kanban"
  | "calendar"
  | "flashcards"
  | "pomodoro"
  | "analytics"
  | "goals"
  | "core";

export const ONBOARDING_FEATURES: OnboardingFeature[] = [
  "core",
  "dashboard",
  "kanban",
  "calendar",
  "flashcards",
  "pomodoro",
  "analytics",
  "goals",
];

/** Features that still show a lightweight page tip (core loop only). */
export const PAGE_TIP_FEATURES = ["kanban", "pomodoro"] as const;

export type PageTipFeature = (typeof PAGE_TIP_FEATURES)[number];

export const ONBOARDING_COPY: Record<
  PageTipFeature,
  { title: string; body: string }
> = {
  kanban: {
    title: "Track objectives on a board",
    body: "Create a study objective, then drag it Queued → In progress → Done as you work.",
  },
  pomodoro: {
    title: "Focus with a live timer",
    body: "Start an objective-linked or personal timer. Focus Mode locks the screen so you stay on task.",
  },
};

export interface CoreTourStep {
  id: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
}

export const CORE_TOUR_STEPS: CoreTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Axon",
    body: "Your study loop is simple: plan objectives, focus with Pomodoro, and watch progress update automatically.",
  },
  {
    id: "kanban",
    title: "Plan on the Kanban board",
    body: "Create your first objective — subject, priority, and an estimate. Drag cards as you make progress.",
    href: "/kanban",
    cta: "Open Kanban",
  },
  {
    id: "pomodoro",
    title: "Start a focus session",
    body: "Link a timer to an objective and enter Focus Mode. Stay in the tab until the session ends.",
    href: "/pomodoro",
    cta: "Open Pomodoro",
  },
  {
    id: "done",
    title: "You’re ready",
    body: "That’s the core loop. Dashboard shows today’s agenda; Analytics and Goals fill in as you study.",
  },
];

const STORAGE_KEY = "axon:onboarding:seen";

type SeenMap = Partial<Record<OnboardingFeature, boolean>>;

export function useOnboarding() {
  const [seen, setSeen, hydrated] = useLocalStorage<SeenMap>(STORAGE_KEY, {});

  const hasSeen = React.useCallback(
    (feature: OnboardingFeature) => Boolean(seen[feature]),
    [seen]
  );

  const markSeen = React.useCallback(
    (feature: OnboardingFeature) => {
      setSeen((prev) => ({ ...prev, [feature]: true }));
    },
    [setSeen]
  );

  const resetAll = React.useCallback(() => {
    setSeen({});
  }, [setSeen]);

  const markAllSeen = React.useCallback(() => {
    const next: SeenMap = {};
    for (const feature of ONBOARDING_FEATURES) next[feature] = true;
    setSeen(next);
  }, [setSeen]);

  const coreComplete = Boolean(seen.core);

  return {
    seen,
    hydrated,
    hasSeen,
    markSeen,
    resetAll,
    markAllSeen,
    coreComplete,
  };
}
