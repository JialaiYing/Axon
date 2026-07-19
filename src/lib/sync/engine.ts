"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { readLocalStorage, writeLocalStorage } from "@/hooks/use-local-storage";
import { SYNC_COLLECTIONS, type SyncCollection } from "@/lib/sync/collections";

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

interface EntityRow {
  id: string;
  user_id: string;
  payload: Record<string, unknown>;
  updated_at: string;
}

interface SingletonRow {
  user_id: string;
  payload: Record<string, unknown>;
  updated_at: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function entityUpdatedAt(entity: Record<string, unknown>): number {
  const raw = entity.updatedAt ?? entity.createdAt;
  if (typeof raw !== "string") return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

function mergeByUpdatedAt(
  local: Record<string, unknown>[],
  remote: Record<string, unknown>[]
): Record<string, unknown>[] {
  const map = new Map<string, Record<string, unknown>>();
  for (const item of local) {
    if (typeof item.id === "string") map.set(item.id, item);
  }
  for (const item of remote) {
    if (typeof item.id !== "string") continue;
    const existing = map.get(item.id);
    if (!existing || entityUpdatedAt(item) >= entityUpdatedAt(existing)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function readArray(collection: SyncCollection): Record<string, unknown>[] {
  const raw = readLocalStorage<unknown>(collection.key, collection.fallback);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && typeof (item as { id?: unknown }).id === "string"
  );
}

function readSingleton(collection: SyncCollection): Record<string, unknown> {
  return asRecord(readLocalStorage(collection.key, collection.fallback)) ?? {};
}

async function pushArray(
  supabase: SupabaseClient,
  userId: string,
  collection: SyncCollection
): Promise<void> {
  const items = readArray(collection);
  if (items.length === 0) return;

  const rows: EntityRow[] = items.map((item) => ({
    id: String(item.id),
    user_id: userId,
    payload: item,
    updated_at: new Date(entityUpdatedAt(item) || Date.now()).toISOString(),
  }));

  // Chunk to avoid payload limits. Rows are keyed per user: (user_id, id).
  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(collection.table)
      .upsert(chunk, { onConflict: "user_id,id" });
    if (error) throw error;
  }

  // Delete remote rows the user removed locally
  const localIds = new Set(items.map((item) => String(item.id)));
  const { data: remoteIds, error: listError } = await supabase
    .from(collection.table)
    .select("id")
    .eq("user_id", userId);
  if (listError) throw listError;
  const toDelete = (remoteIds ?? [])
    .map((r) => r.id as string)
    .filter((id) => !localIds.has(id));
  if (toDelete.length > 0) {
    const { error } = await supabase
      .from(collection.table)
      .delete()
      .eq("user_id", userId)
      .in("id", toDelete);
    if (error) throw error;
  }
}

async function pullArray(
  supabase: SupabaseClient,
  userId: string,
  collection: SyncCollection
): Promise<void> {
  const { data, error } = await supabase
    .from(collection.table)
    .select("id, payload, updated_at")
    .eq("user_id", userId);
  if (error) throw error;

  const remote = (data ?? []).map((row) => {
    const payload: Record<string, unknown> = asRecord(row.payload) ?? { id: row.id };
    if (typeof payload.id !== "string") payload.id = row.id;
    if (!payload.updatedAt && row.updated_at) payload.updatedAt = row.updated_at;
    return payload;
  });

  const local = readArray(collection);
  const merged = mergeByUpdatedAt(local, remote);
  writeLocalStorage(collection.key, () => merged, collection.fallback as never);
}

async function pushSingleton(
  supabase: SupabaseClient,
  userId: string,
  collection: SyncCollection
): Promise<void> {
  const payload = readSingleton(collection);
  const updatedAt =
    typeof payload.updatedAt === "string"
      ? payload.updatedAt
      : new Date().toISOString();
  const row: SingletonRow = {
    user_id: userId,
    payload: { ...payload, updatedAt },
    updated_at: updatedAt,
  };
  const { error } = await supabase.from(collection.table).upsert(row, { onConflict: "user_id" });
  if (error) throw error;
}

async function pullSingleton(
  supabase: SupabaseClient,
  userId: string,
  collection: SyncCollection
): Promise<void> {
  const { data, error } = await supabase
    .from(collection.table)
    .select("payload, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return;

  const remote = asRecord(data.payload) ?? {};
  const local = readSingleton(collection);
  const localTs = entityUpdatedAt(local);
  const remoteTs = Date.parse(data.updated_at) || entityUpdatedAt(remote);
  if (remoteTs >= localTs) {
    writeLocalStorage(
      collection.key,
      () => ({ ...remote, updatedAt: data.updated_at }),
      collection.fallback as never
    );
  }
}

/** Full bidirectional sync for every collection. */
export async function syncAll(supabase: SupabaseClient, userId: string): Promise<void> {
  for (const collection of SYNC_COLLECTIONS) {
    if (collection.kind === "array") {
      await pushArray(supabase, userId, collection);
      await pullArray(supabase, userId, collection);
    } else {
      await pushSingleton(supabase, userId, collection);
      await pullSingleton(supabase, userId, collection);
    }
  }
}

/** Push-only pass used after local writes. */
export async function pushAll(supabase: SupabaseClient, userId: string): Promise<void> {
  for (const collection of SYNC_COLLECTIONS) {
    if (collection.kind === "array") {
      await pushArray(supabase, userId, collection);
    } else {
      await pushSingleton(supabase, userId, collection);
    }
  }
}

/** Pull-only pass used on a timer / focus regain. */
export async function pullAll(supabase: SupabaseClient, userId: string): Promise<void> {
  for (const collection of SYNC_COLLECTIONS) {
    if (collection.kind === "array") {
      await pullArray(supabase, userId, collection);
    } else {
      await pullSingleton(supabase, userId, collection);
    }
  }
}
