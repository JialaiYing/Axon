"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { FeatureIntro } from "@/components/onboarding/feature-intro";
import { DURATION, EASE, STAGGER, enterVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { OnboardingFeature } from "@/hooks/use-onboarding";

interface AppPageProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Optional row under the header — search, filters, view toggles. */
  toolbar?: React.ReactNode;
  /** When set, shows a one-time Canva-style intro for this feature. */
  feature?: OnboardingFeature;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared scaffold for every app-shell route: consistent header/description/
 * actions spacing, an optional toolbar slot, and one staggered entrance so
 * Calendar, Kanban, Settings etc. all arrive on screen the same way.
 */
export function AppPage({
  title,
  description,
  actions,
  toolbar,
  feature,
  children,
  className,
}: AppPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const sectionVariants = enterVariants(8);

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: STAGGER.base } },
      }}
      className={cn("relative", className)}
    >
      {feature && <FeatureIntro feature={feature} />}

      <motion.div
        variants={sectionVariants}
        transition={{ duration: DURATION.section, ease: EASE }}
      >
        <PageHeader title={title} description={description} actions={actions} />
      </motion.div>

      {toolbar && (
        <motion.div
          variants={sectionVariants}
          transition={{ duration: DURATION.section, ease: EASE }}
          className="mb-5"
        >
          {toolbar}
        </motion.div>
      )}

      <motion.div
        variants={sectionVariants}
        transition={{ duration: DURATION.section, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
