"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, X, Target, Coffee, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimerDisplay } from "@/components/pomodoro/timer-display";
import { TimerControls } from "@/components/pomodoro/timer-controls";
import type { PomodoroTimerInstance, TimerDisplayMode } from "@/types";

interface TimerFullscreenOverlayProps {
  timer: PomodoroTimerInstance | null;
  remainingSeconds: number;
  displayMode: TimerDisplayMode;
  /** When true, exiting requires confirmation while the timer is active. */
  lockdown?: boolean;
  /** Optional reminder that browsers can't hard-block other sites. */
  showBlocklistReminder?: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onCloseTimer: () => void;
  onExit: () => void;
}

/**
 * Focus Mode overlay — full-viewport lockdown over the app shell. Escape /
 * minimize / tab-hide / unload all nudge the student before leaving an
 * active session. This is intentional friction, not a hard OS lock.
 */
export function TimerFullscreenOverlay({
  timer,
  remainingSeconds,
  displayMode,
  lockdown = true,
  showBlocklistReminder = true,
  onPause,
  onResume,
  onStop,
  onCloseTimer,
  onExit,
}: TimerFullscreenOverlayProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [leaveHint, setLeaveHint] = React.useState(false);
  const active = Boolean(timer && timer.status !== "finished");

  const requestExit = React.useCallback(() => {
    if (!lockdown || !active) {
      onExit();
      return;
    }
    setConfirmOpen(true);
  }, [lockdown, active, onExit]);

  const confirmExit = React.useCallback(() => {
    setConfirmOpen(false);
    onExit();
  }, [onExit]);

  React.useEffect(() => {
    if (!timer) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestExit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [timer, requestExit]);

  React.useEffect(() => {
    if (!timer || !lockdown || !active) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [timer, lockdown, active]);

  React.useEffect(() => {
    if (!timer || !lockdown || !active) return;
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        setLeaveHint(true);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [timer, lockdown, active]);

  React.useEffect(() => {
    if (!leaveHint) return;
    const id = window.setTimeout(() => setLeaveHint(false), 5000);
    return () => window.clearTimeout(id);
  }, [leaveHint]);

  React.useEffect(() => {
    if (!timer) {
      setConfirmOpen(false);
      setLeaveHint(false);
    }
  }, [timer]);

  return (
    <>
      <AnimatePresence>
        {timer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Focus mode"
          >
            {timer.status === "finished" && (
              <button
                type="button"
                aria-label="Close finished timer"
                title="Close"
                onClick={() => {
                  onCloseTimer();
                  onExit();
                }}
                className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface text-muted shadow-sm transition-all duration-200 hover:scale-105 hover:border-danger/40 hover:bg-danger-muted hover:text-danger active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              aria-label="Exit focus mode"
              title="Exit focus mode"
              onClick={requestExit}
              className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-all duration-200 hover:scale-105 hover:bg-card hover:text-foreground active:scale-95"
            >
              <Minimize2 className="h-4 w-4" />
            </button>

            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="flex flex-col items-center gap-6 px-6"
            >
              <Badge variant={timer.source === "objective" ? "accent" : "default"} className="gap-1">
                {timer.source === "objective" ? (
                  <Target className="h-3 w-3" />
                ) : (
                  <Coffee className="h-3 w-3" />
                )}
                Focus Mode
              </Badge>

              <h2 className="max-w-lg truncate px-4 text-center text-2xl font-semibold tracking-tight text-foreground">
                {timer.label}
              </h2>

              <TimerDisplay
                mode={displayMode}
                onModeChange={() => {}}
                hideModeToggle
                remainingSeconds={remainingSeconds}
                totalSeconds={timer.durationSeconds || 1}
                size={420}
              />

              {timer.status !== "finished" ? (
                <TimerControls status={timer.status} onPause={onPause} onResume={onResume} onStop={onStop} />
              ) : (
                <p className="text-sm text-muted-foreground">Session complete — close to dismiss.</p>
              )}

              {showBlocklistReminder && active && (
                <div className="mt-2 flex max-w-md items-start gap-2 rounded-lg border border-border/60 bg-surface/50 px-3 py-2.5 text-left">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Stay in this tab. Pin Axon and close social sites while you focus — browsers
                    can&apos;t hard-block other sites from a web app.
                  </p>
                </div>
              )}

              <AnimatePresence>
                {leaveHint && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-full border border-warning/30 bg-warning-muted/40 px-3 py-1 text-xs font-medium text-warning"
                  >
                    Are you sure you want to leave? Your focus session is still running.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="z-[110] max-w-sm">
          <DialogHeader>
            <DialogTitle>Leave Focus Mode?</DialogTitle>
            <DialogDescription>
              Your timer keeps running in the background, but leaving Focus Mode makes it easier
              to get distracted. Stay focused a little longer?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="sm:mr-auto">
              Keep focusing
            </Button>
            <Button variant="secondary" onClick={confirmExit}>
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
