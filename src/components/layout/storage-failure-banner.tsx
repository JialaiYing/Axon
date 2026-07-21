"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { subscribeStorageFailures } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";

/**
 * Visible banner when localStorage writes fail (quota / private mode).
 * Without this, the UI keeps updating while persistence silently drops.
 */
export function StorageFailureBanner() {
  const [visible, setVisible] = React.useState(false);
  const [reason, setReason] = React.useState<"quota" | "unknown">("quota");

  React.useEffect(() => {
    return subscribeStorageFailures((next) => {
      setReason(next);
      setVisible(true);
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="pointer-events-auto fixed inset-x-3 bottom-3 z-[70] mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-warning/40 bg-card/95 p-3.5 shadow-[var(--shadow-elevation-3)] backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {reason === "quota" ? "Browser storage is full" : "Couldn’t save to this device"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {reason === "quota"
            ? "Some changes may not persist. Clear recycle bin, remove large flashcard images, or free site data."
            : "Private mode or blocked storage can prevent saves. Check browser settings."}
        </p>
        <Button asChild size="sm" variant="outline" className="mt-2">
          <Link href="/settings">Open Settings</Link>
        </Button>
      </div>
      <button
        type="button"
        aria-label="Dismiss storage warning"
        onClick={() => setVisible(false)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted hover:bg-surface hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
