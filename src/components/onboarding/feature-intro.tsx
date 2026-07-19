"use client";

import * as React from "react";
import { Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ONBOARDING_COPY,
  PAGE_TIP_FEATURES,
  useOnboarding,
  type OnboardingFeature,
  type PageTipFeature,
} from "@/hooks/use-onboarding";

interface FeatureIntroProps {
  feature: OnboardingFeature;
}

function isPageTip(feature: OnboardingFeature): feature is PageTipFeature {
  return (PAGE_TIP_FEATURES as readonly string[]).includes(feature);
}

/**
 * Lightweight tip for Kanban / Pomodoro only. Other features rely on the
 * core tour so first-run isn't seven separate banners.
 */
export function FeatureIntro({ feature }: FeatureIntroProps) {
  const { hydrated, hasSeen, markSeen, coreComplete } = useOnboarding();

  if (!isPageTip(feature)) return null;

  const copy = ONBOARDING_COPY[feature];
  // Wait until the core tour is done so tips don't stack on top of it.
  const visible = hydrated && coreComplete && !hasSeen(feature);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="mb-4 rounded-xl border border-accent/25 bg-accent-muted/40 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-sm"
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">{copy.title}</h2>
                <button
                  type="button"
                  aria-label="Dismiss intro"
                  onClick={() => markSeen(feature)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-card hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => markSeen(feature)}>
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
