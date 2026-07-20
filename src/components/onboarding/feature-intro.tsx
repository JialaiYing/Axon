"use client";

import { Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ONBOARDING_COPY, useOnboarding, type OnboardingFeature } from "@/hooks/use-onboarding";

interface FeatureIntroProps {
  feature: OnboardingFeature;
}

/**
 * One dismissible intro tip per feature, rendered inline as part of that
 * feature's own page — it appears at the same time as the page itself,
 * never before or after via a separate blocking overlay. "Replay tour" in
 * Settings just clears every seen-flag, so tips reappear naturally as each
 * page is visited again rather than forcing a restart from a fixed step.
 */
export function FeatureIntro({ feature }: FeatureIntroProps) {
  const { hydrated, hasSeen, markSeen } = useOnboarding();

  const copy = ONBOARDING_COPY[feature];
  const gateSatisfied = !copy.after || hasSeen(copy.after);
  const visible = hydrated && gateSatisfied && !hasSeen(feature);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mb-4 flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elevation-1)]"
          role="status"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">{copy.title}</h2>
              <button
                type="button"
                aria-label="Dismiss intro"
                onClick={() => markSeen(feature)}
                className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.body}</p>
            <div className="mt-3">
              <Button type="button" size="sm" onClick={() => markSeen(feature)}>
                Got it
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
