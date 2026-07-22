"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Timer as TimerIcon } from "lucide-react";
import { usePomodoroTimers } from "@/hooks/use-pomodoro-timers";
import { useNotifications } from "@/hooks/use-notifications";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useObjectives } from "@/hooks/use-objectives";
import { showBrowserNotification } from "@/lib/notifications/browser";

const TOAST_DURATION_MS = 8000;

interface Toast {
  id: string;
  timerId: string;
  title: string;
  message: string;
}

/**
 * Always-mounted watcher: awards focus XP when a full countdown completes,
 * and always surfaces toast + bell (OS notif only when the tab is hidden).
 */
export function TimerNotificationsWatcher() {
  const router = useRouter();
  const { timers, hydrated, markNotified, claimCompletion } = usePomodoroTimers();
  const { addNotification, removeNotification } = useNotifications();
  const { logSession } = usePomodoroSessions();
  const { logStudyTime } = useObjectives();
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  // Award session + XP as soon as a full run completes (timer settles to Ready).
  React.useEffect(() => {
    if (!hydrated) return;
    for (const timer of timers) {
      if (!timer.hasCompletedRun || timer.loggedCompletion) continue;
      const claimed = claimCompletion(timer.id);
      if (!claimed) continue;
      const minutes = Math.max(1, Math.round(claimed.durationSeconds / 60));
      if (claimed.objectiveId) logStudyTime(claimed.objectiveId, minutes);
      logSession({
        durationMinutes: minutes,
        type: "work",
        completed: true,
        objectiveId: claimed.objectiveId,
        label: claimed.label,
      });
    }
  }, [timers, hydrated, claimCompletion, logStudyTime, logSession]);

  React.useEffect(() => {
    if (!hydrated) return;
    const due = timers.filter((t) => t.hasCompletedRun && !t.notified);
    if (due.length === 0) return;

    due.forEach((timer) => {
      const title = "Timer finished";
      const message = `"${timer.label}" just ran out of time.`;

      // OS alert only when the tab is in the background (browser.ts).
      const browserNote = showBrowserNotification(title, {
        body: message,
        tag: `axon-timer-${timer.id}`,
      });
      if (browserNote) {
        browserNote.onclick = () => {
          window.focus();
          router.push("/pomodoro");
          browserNote.close();
        };
      }

      // Always enqueue toast + bell — including while on /pomodoro.
      const notification = addNotification({
        timerId: timer.id,
        title,
        message,
      });
      setToasts((prev) => [
        ...prev,
        {
          id: notification.id,
          timerId: timer.id,
          title: notification.title,
          message: notification.message,
        },
      ]);

      // Mark only after a user-visible in-app channel fired.
      markNotified(timer.id);
    });
  }, [timers, hydrated, markNotified, addNotification, router]);

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleOpen(toast: Toast) {
    dismissToast(toast.id);
    router.push("/pomodoro");
  }

  function handleClose(toast: Toast) {
    // Dismiss the alert only — leave the Ready timer on the board.
    removeNotification(toast.id);
    dismissToast(toast.id);
  }

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-16 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="pointer-events-auto"
          >
            <ToastCard
              toast={toast}
              onOpen={() => handleOpen(toast)}
              onClose={() => handleClose(toast)}
              onExpire={() => dismissToast(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({
  toast,
  onOpen,
  onClose,
  onExpire,
}: {
  toast: Toast;
  onOpen: () => void;
  onClose: () => void;
  onExpire: () => void;
}) {
  React.useEffect(() => {
    const timeout = window.setTimeout(onExpire, TOAST_DURATION_MS);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="relative flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-elevation-3)] transition-colors duration-200 hover:border-border-strong hover:bg-card-hover"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-muted text-accent">
        <TimerIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{toast.message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
