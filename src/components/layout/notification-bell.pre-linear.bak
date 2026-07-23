"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X, Timer as TimerIcon, BellOff, Flag, ImageIcon, CalendarClock } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { usePomodoroTimers } from "@/hooks/use-pomodoro-timers";
import type { TimerNotification } from "@/types";
import { safeInternalPathOrNull } from "@/lib/security/urls";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "just now";
  const ms = Date.now() - time;
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function notificationHref(n: TimerNotification): string {
  const fromPayload = safeInternalPathOrNull(n.href);
  if (fromPayload) return fromPayload;
  if (n.kind === "due-soon") return "/kanban";
  if (n.kind === "missed-schedule") return "/calendar";
  if (n.kind === "background-unlock") return "/settings";
  return "/pomodoro";
}

function NotificationKindIcon({ kind }: { kind?: TimerNotification["kind"] }) {
  if (kind === "due-soon") return <Flag className="h-3.5 w-3.5" />;
  if (kind === "missed-schedule") return <CalendarClock className="h-3.5 w-3.5" />;
  if (kind === "background-unlock") return <ImageIcon className="h-3.5 w-3.5" />;
  return <TimerIcon className="h-3.5 w-3.5" />;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { notifications, removeNotification, markAllRead, unreadCount } = useNotifications();
  const { removeTimer } = usePomodoroTimers();

  React.useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function handleToggle() {
    if (!open) markAllRead();
    setOpen((prev) => !prev);
  }

  function handleOpenNotification(n: TimerNotification) {
    setOpen(false);
    router.push(notificationHref(n));
  }

  function handleCloseNotification(n: TimerNotification) {
    // Only timer notifications are coupled to live timer instances.
    if ((n.kind ?? "timer") === "timer" && n.timerId) {
      removeTimer(n.timerId);
    }
    removeNotification(n.id);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={handleToggle}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-md text-muted transition-all duration-200",
          "hover:bg-card hover:text-foreground active:scale-90",
          open && "bg-card text-foreground"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-accent ring-2 ring-background">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-card/95 shadow-[var(--shadow-overlay)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {notifications.length > 0 && (
                <span className="text-[11px] text-muted-foreground">{notifications.length} archived</span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">You&apos;re all caught up.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenNotification(n)}
                        onKeyDown={(e) => e.key === "Enter" && handleOpenNotification(n)}
                        className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-muted text-accent">
                          <NotificationKindIcon kind={n.kind} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.message}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                        </div>
                        <button
                          type="button"
                          aria-label="Dismiss notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseNotification(n);
                          }}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted opacity-0 transition-opacity hover:bg-surface hover:text-danger group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
