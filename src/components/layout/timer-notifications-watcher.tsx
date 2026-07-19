"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Timer as TimerIcon } from "lucide-react";
import { usePomodoroTimers } from "@/hooks/use-pomodoro-timers";
import { useNotifications } from "@/hooks/use-notifications";
import { usePomodoroSessions } from "@/hooks/use-pomodoro-sessions";
import { useObjectives } from "@/hooks/use-objectives";

const TOAST_DURATION_MS = 6000;

interface Toast {
  id: string;
  timerId: string;
  title: string;
  message: string;
}

/**
 * Always-mounted (lives in the dashboard shell) watcher that turns a
 * finished Pomodoro timer into a toast + archived notification whenever the
 * user isn't already looking at the Pomodoro section. Each timer is
 * notified exactly once, tracked via its own `notified` flag so this
 * survives remounts/navigations without re-firing.
 */
export function TimerNotificationsWatcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { timers, hydrated, markLogged, markNotified, removeTimer } = usePomodoroTimers();
  const { addNotification, removeNotification } = useNotifications();
  const { logSession } = usePomodoroSessions();
  const { logStudyTime } = useObjectives();
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const loggedInThisMount = React.useRef(new Set<string>());

  // Completion accounting lives in this always-mounted watcher so Dashboard,
  // Analytics, Kanban progress, and Pomodoro all observe the same session
  // record even when the timer expires on another route.
  React.useEffect(() => {
    if (!hydrated) return;
    timers
      .filter((timer) => timer.status === "finished" && !timer.loggedCompletion)
      .forEach((timer) => {
        if (loggedInThisMount.current.has(timer.id)) return;
        loggedInThisMount.current.add(timer.id);
        markLogged(timer.id);
        const minutes = Math.max(0, Math.round(timer.durationSeconds / 60));
        if (minutes <= 0) return;
        if (timer.objectiveId) logStudyTime(timer.objectiveId, minutes);
        logSession({
          durationMinutes: minutes,
          type: "work",
          completed: true,
          objectiveId: timer.objectiveId,
          label: timer.label,
        });
      });
  }, [timers, hydrated, markLogged, logStudyTime, logSession]);

  React.useEffect(() => {
    if (!hydrated) return;
    const due = timers.filter((t) => t.status === "finished" && !t.notified);
    if (due.length === 0) return;
    due.forEach((timer) => {
      markNotified(timer.id);
      if (pathname === "/pomodoro") return;
      const notification = addNotification({
        timerId: timer.id,
        title: "Timer finished",
        message: `"${timer.label}" just ran out of time.`,
      });
      setToasts((prev) => [
        ...prev,
        { id: notification.id, timerId: timer.id, title: notification.title, message: notification.message },
      ]);
    });
  }, [timers, hydrated, pathname, markNotified, addNotification]);

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleOpen(toast: Toast) {
    dismissToast(toast.id);
    router.push("/pomodoro");
  }

  function handleClose(toast: Toast) {
    removeTimer(toast.timerId);
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
            <ToastCard toast={toast} onOpen={() => handleOpen(toast)} onClose={() => handleClose(toast)} onExpire={() => dismissToast(toast.id)} />
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
      className="group relative flex cursor-pointer items-start gap-3 rounded-xl border border-border-strong bg-card/95 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_20px_48px_-16px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-colors duration-200 hover:bg-card-hover"
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
        aria-label="Close notification and stop timer"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted opacity-0 transition-opacity duration-150 hover:bg-surface hover:text-danger group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
