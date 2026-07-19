"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface AppPageProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Optional row under the header — search, filters, view toggles. */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared scaffold for every app-shell route: consistent header/description/
 * actions spacing, an optional toolbar slot, and one staggered entrance so
 * Calendar, Kanban, Settings etc. all arrive on screen the same way
 * Dashboard/Flashcards already do.
 */
export function AppPage({ title, description, actions, toolbar, children, className }: AppPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className={cn("relative", className)}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
        }}
      >
        <PageHeader title={title} description={description} actions={actions} />
      </motion.div>

      {toolbar && (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
          }}
          className="mb-5"
        >
          {toolbar}
        </motion.div>
      )}

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 12 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
