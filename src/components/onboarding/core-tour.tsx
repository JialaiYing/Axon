"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CORE_TOUR_STEPS, useOnboarding } from "@/hooks/use-onboarding";

/**
 * ≤4-step first-run tour focused on the Kanban → Pomodoro core loop.
 * Mounted once in the app shell; Settings can replay via resetAll().
 */
export function CoreTour() {
  const router = useRouter();
  const { hydrated, coreComplete, markSeen } = useOnboarding();
  const [stepIndex, setStepIndex] = React.useState(0);
  const open = hydrated && !coreComplete;
  const step = CORE_TOUR_STEPS[stepIndex] ?? CORE_TOUR_STEPS[0]!;
  const isLast = stepIndex >= CORE_TOUR_STEPS.length - 1;

  function finish() {
    markSeen("core");
    // Also silence legacy tip keys so old installs don't re-show page banners.
    markSeen("dashboard");
    markSeen("calendar");
    markSeen("flashcards");
    markSeen("analytics");
    markSeen("goals");
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function goCta() {
    if (step.href) router.push(step.href);
    next();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) finish();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-accent-muted">
            <Sparkles className="h-4.5 w-4.5 text-accent" />
          </div>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.body}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1.5">
          {CORE_TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${
                i <= stepIndex ? "bg-accent" : "bg-surface"
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Step {stepIndex + 1} of {CORE_TOUR_STEPS.length}
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="ghost" size="sm" onClick={finish} className="sm:mr-auto">
            Skip tour
          </Button>
          {step.cta && step.href ? (
            <Button type="button" onClick={goCta}>
              {step.cta}
            </Button>
          ) : (
            <Button type="button" onClick={next}>
              {isLast ? "Get started" : "Next"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
