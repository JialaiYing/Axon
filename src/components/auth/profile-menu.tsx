"use client";

import * as React from "react";
import Link from "next/link";
import { Cloud, CloudOff, Loader2, LogIn, LogOut, RefreshCw, Settings, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { useSync } from "@/components/sync/sync-provider";
import { cn } from "@/lib/utils";

function SyncBadge() {
  const { status, lastSyncedAt, syncNow } = useSync();
  const { user } = useAuth();

  if (!user) return null;

  const label =
    status === "syncing"
      ? "Syncing…"
      : status === "offline"
        ? "Offline"
        : status === "error"
          ? "Sync error"
          : status === "synced"
            ? "Synced"
            : "Idle";

  const Icon =
    status === "syncing"
      ? Loader2
      : status === "offline" || status === "error"
        ? CloudOff
        : Cloud;

  return (
    <button
      type="button"
      onClick={() => void syncNow()}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-surface",
        status === "error" && "text-danger",
        status === "offline" && "text-warning",
        status === "synced" && "text-muted-foreground"
      )}
      title={lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}` : undefined}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "syncing" && "animate-spin")} />
      <span className="flex-1">{label}</span>
      <RefreshCw className="h-3 w-3 opacity-60" />
    </button>
  );
}

export function ProfileMenu() {
  const { user, loading, signOut, configured } = useAuth();

  const initials =
    user?.email?.slice(0, 2).toUpperCase() ??
    (loading ? "…" : null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="User profile"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-secondary text-[10px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-transform hover:scale-105 active:scale-95"
          >
            {initials ?? <UserRound className="h-3.5 w-3.5" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            {user ? (
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Signed in</p>
                <p className="truncate text-[11px] font-normal text-muted-foreground">
                  {user.email}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">Local mode</p>
                <p className="text-[11px] font-normal text-muted-foreground">
                  {configured
                    ? "Sign in to sync across devices"
                    : "Configure Supabase to enable sync"}
                </p>
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user && (
            <>
              <SyncBadge />
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </DropdownMenuItem>
          {user ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void signOut();
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link href="/login">
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
