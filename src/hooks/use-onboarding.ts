"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export type OnboardingFeature =
  | "dashboard"
  | "kanban"
  | "calendar"
  | "flashcards"
  | "pomodoro"
  | "analytics"
  | "goals";

export const ONBOARDING_FEATURES: OnboardingFeature[] = [
  "dashboard",
  "kanban",
  "calendar",
  "flashcards",
  "pomodoro",
  "analytics",
  "goals",
];

export const ONBOARDING_COPY: Record<
  OnboardingFeature,
  { title: string; body: string }
> = {
  dashboard: {
    title: "Your command center",
    body: "See today’s schedule, streak, focus time, and the next objectives worth tackling. Everything else in Axon feeds into this overview.",
  },
  kanban: {
    title: "Track objectives on a board",
    body: "Create study objectives, drag them between Queued / In progress / Done, add checklists, and schedule work straight from a card.",
  },
  calendar: {
    title: "Plan when you’ll study",
    body: "Drop objectives onto days or time slots, drag to reschedule, and export an .ics file to sync with Google or Apple Calendar.",
  },
  flashcards: {
    title: "Build sets and drill mastery",
    body: "Organize decks into folders, study in focused sessions, and watch mastery climb as you mark cards correct or incorrect.",
  },
  pomodoro: {
    title: "Focus with live timers",
    body: "Start objective-linked or personal timers, run several at once, and get notified when a session finishes — even if you’re on another page.",
  },
  analytics: {
    title: "Understand your patterns",
    body: "Charts for focus trends, completions, peak hours, and flashcard performance so you can see what’s actually working.",
  },
  goals: {
    title: "Daily and weekly targets",
    body: "Set a daily focus-minute goal and a weekly objectives goal. Progress updates automatically from your real sessions and completions.",
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
