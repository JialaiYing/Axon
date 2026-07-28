"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, Target, Coffee } from "lucide-react";
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
import { showBrowserNotification } from "@/lib/notifications/browser";
import { phaseLabel } from "@/lib/pomodoro-utils";
import type { PomodoroTimerInstance } from "@/types";

interface TimerFullscreenOverlayProps {
  timer: PomodoroTimerInstance | null;
  remainingSeconds: number;
  lockdown?: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onExit: () => void;
}

/**
 * Focus Mode — portaled overlay so it covers the shell. When the countdown
 * ends, Focus Mode exits automatically.
 */
export function TimerFullscreenOverlay({
  timer,
  remainingSeconds,
  lockdown = true,
  onPause,
  onResume,
  onStop,
  onExit,
}: TimerFullscreenOverlayProps) {
  const leftWhileHiddenRef = React.useRef(false);
  const [mounted, setMounted] = React.useState(false);
  const [returnOpen, setReturnOpen] = React.useState(false);
  const [leaveHint, setLeaveHint] = React.useState(false);

  const isReadyAfterRun = Boolean(
    timer?.hasCompletedRun &&
      timer.status === "paused" &&
      (timer.pausedRemainingSeconds ?? 0) >= timer.durationSeconds
  );
  const active = Boolean(timer && timer.status !== "finished" && !isReadyAfterRun);
  const wasRunningRef = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Leave Focus Mode as soon as the countdown settles — no button required.
  React.useEffect(() => {
    if (isReadyAfterRun) onExit();
  }, [isReadyAfterRun, onExit]);

  // Single-click exit — no confirm dialog.
  const requestExit = React.useCallback(() => {
    onExit();
  }, [onExit]);

  React.useEffect(() => {
    wasRunningRef.current = timer?.status === "running";
  }, [timer?.status]);

  React.useEffect(() => {
    if (!timer || timer.status === "finished") return;
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
        leftWhileHiddenRef.current = true;
        setLeaveHint(true);
        if (wasRunningRef.current) onPause();
        const note = showBrowserNotification("Come back to Focus Mode", {
          body: `"${timer!.label}" was paused — switch back to Axon to keep going.`,
          tag: `focus-leave-${timer!.id}`,
          requireInteraction: true,
        });
        if (note) {
          note.onclick = () => {
            window.focus();
            note.close();
          };
        }
        return;
      }

      if (leftWhileHiddenRef.current) {
        leftWhileHiddenRef.current = false;
        setReturnOpen(true);
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [timer, lockdown, active, onPause]);

  React.useEffect(() => {
    if (!leaveHint) return;
    const id = window.setTimeout(() => setLeaveHint(false), 6000);
    return () => window.clearTimeout(id);
  }, [leaveHint]);

  React.useEffect(() => {
    if (!timer) {
      setReturnOpen(false);
      setLeaveHint(false);
      leftWhileHiddenRef.current = false;
    }
  }, [timer]);

  const resumeAfterReturn = React.useCallback(() => {
    setReturnOpen(false);
    onResume();
  }, [onResume]);

  /** Stop ends the session and leaves Focus Mode in one gesture. */
  const handleStop = React.useCallback(() => {
    onExit();
    onStop();
  }, [onExit, onStop]);

  if (!mounted) return null;

  const showOverlay = Boolean(timer && timer.status !== "finished" && !isReadyAfterRun);

  return createPortal(
    <>
      <AnimatePresence>
        {showOverlay && timer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
            role="dialog"
            aria-modal="true"
            aria-label="Focus mode"
          >
            <button
              type="button"
              aria-label="Exit focus mode"
              title="Exit focus mode"
              onClick={requestExit}
              className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-transparent text-muted-foreground shadow-none transition-colors duration-150 hover:bg-wash hover:text-foreground active:scale-95 light:border-border"
            >
              <Minimize2 className="h-4 w-4" />
            </button>

            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="flex flex-col items-center gap-5 px-6"
            >
              <h2 className="max-w-2xl px-4 text-center font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {timer.label}
              </h2>

              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
                {timer.source === "objective" ? (
                  <Target className="h-3 w-3" />
                ) : (
                  <Coffee className="h-3 w-3" />
                )}
                Focus Mode · {phaseLabel(timer.phase ?? "work")}
              </span>

              <TimerDisplay
                remainingSeconds={remainingSeconds}
                totalSeconds={timer.durationSeconds || 1}
                size={420}
              />

              <TimerControls
                status={timer.status}
                onPause={onPause}
                onResume={onResume}
                onStop={handleStop}
              />

              <AnimatePresence>
                {leaveHint && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] font-medium text-warning"
                  >
                    Session paused — come back to keep focusing.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={returnOpen}
        onOpenChange={(open) => {
          if (!open) setReturnOpen(false);
        }}
      >
        <DialogContent className="z-[110] max-w-sm">
          <DialogHeader>
            <DialogTitle>Welcome back</DialogTitle>
            <DialogDescription>
              You left Axon during Focus Mode, so the timer was paused. Resume when you&apos;re
              ready to focus again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setReturnOpen(false)} className="shadow-none sm:mr-auto">
              Stay paused
            </Button>
            <Button onClick={resumeAfterReturn} className="shadow-none">
              Resume focus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>,
    document.body
  );
}
