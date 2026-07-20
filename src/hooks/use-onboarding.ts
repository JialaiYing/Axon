"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

/**
 * Every feature gets its own dismissible intro tip, shown inline on that
 * feature's page the moment it's visited — never a separate full-screen
 * tour that navigates you around. This means the intro always appears
 * alongside the actual page it describes, and "replay" just clears the
 * seen-flags so tips reappear naturally as each page is revisited, instead
 * of forcing you back to a fixed first step.
 */
export type OnboardingFeature =
  | "dashboard"
  | "kanban"
  | "calendar"
  | "flashcards"
  | "pomodoro"
  | "analytics"
  | "goals"
  | "gamification"
  | "rank";

export const ONBOARDING_FEATURES: OnboardingFeature[] = [
  "dashboard",
  "kanban",
  "calendar",
  "flashcards",
  "pomodoro",
  "analytics",
  "goals",
  "gamification",
  "rank",
];

export interface OnboardingTip {
  title: string;
  body: string;
  /**
   * Only reveal this tip after the given feature's tip has been dismissed.
   * Used to sequence two tips that live on the same page (e.g. the
   * dashboard's general welcome, then a follow-up about gamification)
   * without stacking multiple banners at once.
   */
  after?: OnboardingFeature;
}

export const ONBOARDING_COPY: Record<OnboardingFeature, OnboardingTip> = {
  dashboard: {
    title: "Your dashboard",
    body: "Today's agenda, streak, and quick actions live here — a glance-and-go home base for the whole app.",
  },
  kanban: {
    title: "You're on the Kanban board",
    body: "Create a study objective with the toolbar, then drag cards Queued → In progress → Done.",
  },
  calendar: {
    title: "You're on the Calendar",
    body: "Drag any objective onto a day to schedule it, or leave it in the unscheduled rail to plan later.",
  },
  flashcards: {
    title: "You're on Flashcards",
    body: "Build a folder and a set, then start a study session to track mastery on each card over time.",
  },
  pomodoro: {
    title: "You're on Pomodoro",
    body: "Pick an objective or a personal timer, then start Focus Mode to stay locked in.",
  },
  analytics: {
    title: "You're on Analytics",
    body: "Every chart here comes from your real sessions and objectives — plain statistics, not a guess.",
  },
  goals: {
    title: "You're on Goals",
    body: "Daily and weekly targets track automatically. Add a personal goal for anything you'd like to track manually.",
  },
  gamification: {
    title: "XP, ranks, and streaks",
    body: "Finishing objectives and focus sessions earns XP automatically. Visit Rank for the full ladder and streak history.",
    after: "dashboard",
  },
  rank: {
    title: "You're on Rank",
    body: "The full 30-level ladder, your streaks, and exactly how XP is earned — plus a shortcut to unlock backgrounds.",
  },
};

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

  return {
    seen,
    hydrated,
    hasSeen,
    markSeen,
    resetAll,
    markAllSeen,
  };
}
