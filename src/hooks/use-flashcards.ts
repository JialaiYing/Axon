"use client";

import * as React from "react";
import { asArray, dedupeById, useLocalStorage } from "@/hooks/use-local-storage";
import { recordTombstone } from "@/lib/sync/tombstones";
import type { Flashcard, FlashcardFolder, FlashcardSet } from "@/types";

const FOLDERS_KEY = "axon:flashcards:folders";
const SETS_KEY = "axon:flashcards:sets";

export const FOLDER_COLORS = [
  "#5227FF",
  "#3b82f6",
  "#a855f7",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#FF9FFC",
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function validIso(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return Number.isNaN(new Date(value).getTime()) ? undefined : value;
}

function normalizeFolder(value: FlashcardFolder): FlashcardFolder | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  return {
    ...value,
    title: typeof value.title === "string" && value.title.trim() ? value.title : "Untitled folder",
    imageDataUrl: typeof value.imageDataUrl === "string" ? value.imageDataUrl : undefined,
    color: typeof value.color === "string" ? value.color : FOLDER_COLORS[0] ?? "#5227FF",
    createdAt: validIso(value.createdAt) ?? new Date().toISOString(),
    lastOpenedAt: validIso(value.lastOpenedAt),
    // Omit = visible. Only an explicit `false` hides the folder from the dome.
    showInDome: value.showInDome === false ? false : true,
    pinned: Boolean(value.pinned),
  };
}

function normalizeCard(value: Flashcard): Flashcard | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const correct = typeof value.correctCount === "number" ? Math.max(0, value.correctCount) : 0;
  const incorrect = typeof value.incorrectCount === "number" ? Math.max(0, value.incorrectCount) : 0;
  const attempts = correct + incorrect;
  return {
    id: value.id,
    front: typeof value.front === "string" ? value.front : "",
    back: typeof value.back === "string" ? value.back : "",
    correctCount: correct,
    incorrectCount: incorrect,
    masteryPercent: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
  };
}

function normalizeTestResult(value: unknown): FlashcardSet["lastTestResult"] {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  const completedAt = validIso(v.completedAt);
  if (!completedAt) return undefined;
  const total = typeof v.total === "number" ? Math.max(0, Math.round(v.total)) : 0;
  const correct = typeof v.correct === "number" ? Math.max(0, Math.min(total, Math.round(v.correct))) : 0;
  if (total === 0) return undefined;
  return { correct, total, completedAt };
}

function normalizeSet(value: FlashcardSet): FlashcardSet | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const now = new Date().toISOString();
  return {
    ...value,
    title: typeof value.title === "string" && value.title.trim() ? value.title : "Untitled set",
    description: typeof value.description === "string" ? value.description : undefined,
    subject: typeof value.subject === "string" && value.subject.trim() ? value.subject : "General",
    folderId: typeof value.folderId === "string" ? value.folderId : undefined,
    createdAt: validIso(value.createdAt) ?? now,
    updatedAt: validIso(value.updatedAt) ?? now,
    lastOpenedAt: validIso(value.lastOpenedAt),
    pinned: Boolean(value.pinned),
    completedAt: validIso(value.completedAt),
    lastTestResult: normalizeTestResult(value.lastTestResult),
    cards: dedupeById(asArray<Flashcard>(value.cards))
      .map(normalizeCard)
      .filter((card): card is Flashcard => card !== null),
  };
}

function normalizeFolders(value: unknown): FlashcardFolder[] {
  return dedupeById(asArray<FlashcardFolder>(value))
    .map(normalizeFolder)
    .filter((folder): folder is FlashcardFolder => folder !== null);
}

function normalizeSets(value: unknown): FlashcardSet[] {
  return dedupeById(asArray<FlashcardSet>(value))
    .map(normalizeSet)
    .filter((set): set is FlashcardSet => set !== null);
}

export function useFlashcards() {
  const [rawFolders, setRawFolders, foldersHydrated] = useLocalStorage<FlashcardFolder[]>(
    FOLDERS_KEY,
    []
  );
  const [rawSets, setRawSets, setsHydrated] = useLocalStorage<FlashcardSet[]>(SETS_KEY, []);

  const folders = React.useMemo(() => normalizeFolders(rawFolders), [rawFolders]);
  const sets = React.useMemo(() => normalizeSets(rawSets), [rawSets]);
  const hydrated = foldersHydrated && setsHydrated;

  const setFolders = React.useCallback(
    (value: FlashcardFolder[] | ((prev: FlashcardFolder[]) => FlashcardFolder[])) => {
      setRawFolders((prev) => {
        const safePrev = normalizeFolders(prev);
        return normalizeFolders(value instanceof Function ? value(safePrev) : value);
      });
    },
    [setRawFolders]
  );

  const setSets = React.useCallback(
    (value: FlashcardSet[] | ((prev: FlashcardSet[]) => FlashcardSet[])) => {
      setRawSets((prev) => {
        const safePrev = normalizeSets(prev);
        return normalizeSets(value instanceof Function ? value(safePrev) : value);
      });
    },
    [setRawSets]
  );

  const addFolder = React.useCallback(
    (input: { title: string; imageDataUrl?: string; color?: string }) => {
      const folder: FlashcardFolder = {
        id: createId(),
        title: input.title,
        imageDataUrl: input.imageDataUrl,
        color: input.color ?? FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)] ?? "#5227FF",
        createdAt: new Date().toISOString(),
        showInDome: true,
        pinned: false,
      };
      setFolders((prev) => [folder, ...prev]);

      // When signed in, replace bulky data URLs with a Supabase Storage public URL.
      if (input.imageDataUrl?.startsWith("data:")) {
        void import("@/lib/supabase/storage").then(({ maybeUploadFlashcardImage }) =>
          maybeUploadFlashcardImage(input.imageDataUrl, folder.id).then((url) => {
            if (!url || url === input.imageDataUrl) return;
            setFolders((prev) =>
              prev.map((f) => (f.id === folder.id ? { ...f, imageDataUrl: url } : f))
            );
          })
        );
      }

      return folder;
    },
    [setFolders]
  );

  const updateFolder = React.useCallback(
    (id: string, patch: Partial<Omit<FlashcardFolder, "id" | "createdAt">>) => {
      setFolders((prev) =>
        prev.map((folder) => (folder.id === id ? { ...folder, ...patch } : folder))
      );
    },
    [setFolders]
  );

  /** Deletes the folder; its sets become unfiled rather than being destroyed. */
  const deleteFolder = React.useCallback(
    (id: string) => {
      recordTombstone(FOLDERS_KEY, id);
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      setSets((prev) =>
        prev.map((set) => (set.folderId === id ? { ...set, folderId: undefined } : set))
      );
    },
    [setFolders, setSets]
  );

  const touchFolder = React.useCallback(
    (id: string) => {
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === id ? { ...folder, lastOpenedAt: new Date().toISOString() } : folder
        )
      );
    },
    [setFolders]
  );

  const addSet = React.useCallback(
    (input: { title: string; subject: string; description?: string; folderId?: string }) => {
      const now = new Date().toISOString();
      const set: FlashcardSet = {
        id: createId(),
        title: input.title,
        subject: input.subject,
        description: input.description,
        folderId: input.folderId,
        createdAt: now,
        updatedAt: now,
        cards: [],
      };
      setSets((prev) => [set, ...prev]);
      return set;
    },
    [setSets]
  );

  const updateSet = React.useCallback(
    (id: string, patch: Partial<Omit<FlashcardSet, "id" | "createdAt" | "cards">>) => {
      setSets((prev) =>
        prev.map((set) =>
          set.id === id ? { ...set, ...patch, updatedAt: new Date().toISOString() } : set
        )
      );
    },
    [setSets]
  );

  const deleteSet = React.useCallback(
    (id: string) => {
      recordTombstone(SETS_KEY, id);
      setSets((prev) => prev.filter((set) => set.id !== id));
    },
    [setSets]
  );

  const touchSet = React.useCallback(
    (id: string) => {
      setSets((prev) =>
        prev.map((set) =>
          set.id === id ? { ...set, lastOpenedAt: new Date().toISOString() } : set
        )
      );
    },
    [setSets]
  );

  const addCard = React.useCallback(
    (setId: string, input: { front: string; back: string }) => {
      const card: Flashcard = {
        id: createId(),
        front: input.front,
        back: input.back,
        correctCount: 0,
        incorrectCount: 0,
        masteryPercent: 0,
      };
      setSets((prev) =>
        prev.map((set) =>
          set.id === setId
            ? { ...set, cards: [...set.cards, card], updatedAt: new Date().toISOString() }
            : set
        )
      );
      return card;
    },
    [setSets]
  );

  const deleteCard = React.useCallback(
    (setId: string, cardId: string) => {
      setSets((prev) =>
        prev.map((set) =>
          set.id === setId
            ? {
                ...set,
                cards: set.cards.filter((card) => card.id !== cardId),
                updatedAt: new Date().toISOString(),
              }
            : set
        )
      );
    },
    [setSets]
  );

  /** Records one study/test answer against a card — feeds correctCount/incorrectCount → masteryPercent. */
  const recordCardResult = React.useCallback(
    (setId: string, cardId: string, correct: boolean) => {
      setSets((prev) =>
        prev.map((set) => {
          if (set.id !== setId) return set;
          return {
            ...set,
            updatedAt: new Date().toISOString(),
            cards: set.cards.map((card) =>
              card.id === cardId
                ? {
                    ...card,
                    correctCount: card.correctCount + (correct ? 1 : 0),
                    incorrectCount: card.incorrectCount + (correct ? 0 : 1),
                  }
                : card
            ),
          };
        })
      );
    },
    [setSets]
  );

  /** Marks a set as completed — a full study pass or a finished test run. */
  const completeSet = React.useCallback(
    (setId: string, result?: { correct: number; total: number }) => {
      const now = new Date().toISOString();
      setSets((prev) =>
        prev.map((set) =>
          set.id === setId
            ? {
                ...set,
                completedAt: now,
                lastTestResult: result ? { ...result, completedAt: now } : set.lastTestResult,
              }
            : set
        )
      );
    },
    [setSets]
  );

  /** Most recently completed sets (full study pass or finished test) — powers the home "Completed" panel. */
  const completedSets = React.useMemo(() => {
    return sets
      .filter((set) => Boolean(set.completedAt))
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 6);
  }, [sets]);

  /** Sets in a folder (or unfiled sets when folderId is undefined). */
  const setsInFolder = React.useCallback(
    (folderId: string | undefined) => sets.filter((set) => set.folderId === folderId),
    [sets]
  );

  /** Most recently opened sets/folders, interleaved, newest first. */
  const recents = React.useMemo(() => {
    const entries: { kind: "folder" | "set"; id: string; title: string; openedAt: string }[] = [];
    for (const folder of folders) {
      if (folder.lastOpenedAt)
        entries.push({ kind: "folder", id: folder.id, title: folder.title, openedAt: folder.lastOpenedAt });
    }
    for (const set of sets) {
      if (set.lastOpenedAt)
        entries.push({ kind: "set", id: set.id, title: set.title, openedAt: set.lastOpenedAt });
    }
    return entries
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())
      .slice(0, 6);
  }, [folders, sets]);

  /** The single most recently opened set — powers "Jump right back in". */
  const lastStudiedSet = React.useMemo(() => {
    return (
      sets
        .filter((set) => set.lastOpenedAt)
        .sort(
          (a, b) => new Date(b.lastOpenedAt!).getTime() - new Date(a.lastOpenedAt!).getTime()
        )[0] ?? null
    );
  }, [sets]);

  const totalCards = React.useMemo(
    () => sets.reduce((sum, set) => sum + set.cards.length, 0),
    [sets]
  );

  const toggleFolderInDome = React.useCallback(
    (id: string) => {
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === id
            ? { ...folder, showInDome: folder.showInDome === false ? true : false }
            : folder
        )
      );
    },
    [setFolders]
  );

  const toggleFolderPinned = React.useCallback(
    (id: string) => {
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === id ? { ...folder, pinned: !folder.pinned } : folder
        )
      );
    },
    [setFolders]
  );

  const toggleSetPinned = React.useCallback(
    (id: string) => {
      setSets((prev) =>
        prev.map((set) => (set.id === id ? { ...set, pinned: !set.pinned } : set))
      );
    },
    [setSets]
  );

  /** Pinned folders and sets interleaved — folders first within each group, then by title. */
  const pinned = React.useMemo(() => {
    const entries: {
      kind: "folder" | "set";
      id: string;
      title: string;
      color?: string;
      subject?: string;
    }[] = [];
    for (const folder of folders) {
      if (folder.pinned)
        entries.push({ kind: "folder", id: folder.id, title: folder.title, color: folder.color });
    }
    for (const set of sets) {
      if (set.pinned)
        entries.push({ kind: "set", id: set.id, title: set.title, subject: set.subject });
    }
    return entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
  }, [folders, sets]);

  return {
    folders,
    sets,
    hydrated,
    addFolder,
    updateFolder,
    deleteFolder,
    touchFolder,
    addSet,
    updateSet,
    deleteSet,
    touchSet,
    addCard,
    deleteCard,
    recordCardResult,
    completeSet,
    setsInFolder,
    recents,
    lastStudiedSet,
    completedSets,
    totalCards,
    toggleFolderInDome,
    toggleFolderPinned,
    toggleSetPinned,
    pinned,
  };
}
