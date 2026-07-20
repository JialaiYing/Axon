"use client";

import * as React from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeDisplayName } from "@/lib/security/sanitize";

const STORAGE_KEY = "axon:profile:displayName";

/**
 * Display name for greetings — local first, synced to profiles when signed in.
 */
export function useDisplayName() {
  const { user, updateDisplayName } = useAuth();
  const [raw, setRaw, hydrated] = useLocalStorage<string>(STORAGE_KEY, "");
  const [cloudName, setCloudName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) {
      setCloudName(null);
      return;
    }
    const meta = user.user_metadata?.display_name;
    if (typeof meta === "string" && meta.trim()) {
      setCloudName(meta.trim());
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name && typeof data.display_name === "string") {
          setCloudName(data.display_name);
        }
      });
  }, [user]);

  const displayName = (cloudName || raw || "").trim();

  const setDisplayName = React.useCallback(
    async (name: string) => {
      const sanitized = sanitizeDisplayName(name);
      if (!sanitized.ok) return { error: sanitized.error };
      setRaw(sanitized.value);
      return updateDisplayName(sanitized.value);
    },
    [setRaw, updateDisplayName]
  );

  return { displayName, setDisplayName, hydrated };
}
