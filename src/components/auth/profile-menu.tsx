"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] transition-colors",
        "hover:bg-foreground/[0.04] light:hover:bg-black/[0.04]",
        status === "error" && "text-danger",
        status === "offline" && "text-warning",
        status === "synced" && "text-muted-foreground",
        status !== "error" && status !== "offline" && status !== "synced" && "text-muted-foreground"
      )}
      title={lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}` : undefined}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "syncing" && "animate-spin")} />
      <span className="flex-1">{label}</span>
      <RefreshCw className="h-3 w-3 opacity-50" />
    </button>
  );
}

export function ProfileMenu() {
  const router = useRouter();
  const { user, loading, signOut, configured } = useAuth();

  const initials =
    user?.email?.slice(0, 2).toUpperCase() ??
    (loading ? "…" : null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User profile"
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-colors duration-150",
            "bg-foreground/[0.08] text-foreground hover:bg-foreground/[0.12]",
            "light:bg-black/[0.08] light:hover:bg-black/[0.12]",
            "active:scale-95"
          )}
        >
          {initials ?? <UserRound className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-md border-border/50 p-1 shadow-[var(--shadow-elevation-2)] light:border-border"
      >
        <DropdownMenuLabel>
          {user ? (
            <div className="space-y-0.5">
              <p className="text-[13px] font-medium text-foreground">Signed in</p>
              <p className="truncate text-[11px] font-normal text-muted-foreground">
                {user.email}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="text-[13px] font-medium text-foreground">Not signed in</p>
              <p className="text-[11px] font-normal text-muted-foreground">
                {configured
                  ? "Sign in to use Axon"
                  : "Configure Supabase to enable sign-in"}
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
              void signOut().then(() => router.replace("/login"));
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
  );
}
